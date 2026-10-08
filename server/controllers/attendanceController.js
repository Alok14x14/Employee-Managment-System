import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { istDayStart, isLate, isWeekend } from "../utils/time.js";

// Clock in/out for employee
// POST /api/attendance
export const clockInOut = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId })
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) return res.status(403).json({
                error: "Your account is deactivated. You cannot clock in/out.",
            });

        const today = istDayStart();

        const existing = await Attendance.findOne({
            employeeId: employee._id,
            date: today,
        })

        const now = new Date();

        if(!existing || existing.status === "ABSENT"){
            let attendance = existing;
            if (attendance) {
                attendance.checkIn = now;
                attendance.status = isLate(now) ? "LATE" : "PRESENT";
                await attendance.save();
            } else {
                try {
                    attendance = await Attendance.create({
                        employeeId: employee._id,
                        date: today,
                        checkIn: now,
                        status: isLate(now) ? "LATE" : "PRESENT"
                    })
                } catch (createErr) {
                    if (createErr.code === 11000) {
                        const record = await Attendance.findOne({
                            employeeId: employee._id,
                            date: today,
                        });
                        if (record) {
                            if (record.status === "ABSENT") {
                                record.checkIn = now;
                                record.status = isLate(now) ? "LATE" : "PRESENT";
                                await record.save();
                            }
                            return res.json({ success: true, type: "CHECK_IN", data: record });
                        }
                    }
                    throw createErr;
                }
            }

            try {
                await inngest.send({
                    name: "employee/check-in",
                    data: {
                        employeeId: employee._id,
                        attendanceId: attendance._id,
                    }
                })
            } catch (e) {
                console.error("inngest send failed", e);
            }

            return res.json({ success: true, type: "CHECK_IN", data: attendance });
        } else if(!existing.checkOut){
            const checkInTime = new Date(existing.checkIn).getTime()
            const diffMs = now.getTime() - checkInTime;
            const diffHours = diffMs / (1000 * 60 * 60)

            existing.checkOut = now;

            // Compute working hours and day type
            const workingHours = parseFloat(diffHours.toFixed(2))
            let dayType = "Half Day";
            if (workingHours >= 8) dayType = "Full Day";
            else if (workingHours >= 6) dayType = "Three Quarter Day";
            else if (workingHours >= 4) dayType = "Half Day";
            else dayType = "Short Day";

            existing.workingHours = workingHours;
            existing.dayType = dayType;

            await existing.save();
            return res.json({ success: true, type: "CHECK_OUT", data: existing });
        }else {
            return res.json({ success: true, type: "CHECK_OUT", data: existing });
        }


    } catch (error) {
        if (error.code === 11000) {
            try {
                const today = istDayStart();
                const session = req.session;
                const employee = await Employee.findOne({ userId: session?.userId });
                if (employee) {
                    const record = await Attendance.findOne({
                        employeeId: employee._id,
                        date: today,
                    });
                    if (record) {
                        return res.json({ success: true, type: "CHECK_IN", data: record });
                    }
                }
            } catch (refetchErr) {
                console.error("Failed to re-fetch attendance after 11000:", refetchErr);
            }
        }
        console.error("Attendance Error:", error);
        return res.status(500).json({ error: "Operation failed" });
    }
}

// Get attendance for employee
// GET /api/attendance
export const getAttendance = async (req, res) => {
    try {
        const session = req.session;
        const employee = await Employee.findOne({ userId: session.userId });
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const today = istDayStart();
        const { month, limit } = req.query;

        let startDate, endDate;
        let isMonthQuery = false;

        if (month && /^\d{4}-\d{2}$/.test(month)) {
            const [yearStr, monthStr] = month.split("-");
            const y = parseInt(yearStr, 10);
            const m = parseInt(monthStr, 10);
            if (m >= 1 && m <= 12) {
                const nextY = m === 12 ? y + 1 : y;
                const nextM = m === 12 ? 1 : m + 1;
                startDate = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00+05:30`);
                endDate = new Date(`${nextY}-${String(nextM).padStart(2, '0')}-01T00:00:00+05:30`);
                isMonthQuery = true;
            }
        }

        if (!isMonthQuery) {
            startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        }

        // Fill in missing ABSENT records for past working days
        const joinDate = istDayStart(employee.joinDate || employee.createdAt || new Date(0));
        const effectiveStart = new Date(Math.max(startDate.getTime(), joinDate.getTime()));
        const effectiveEnd = new Date(Math.min(endDate.getTime(), today.getTime())); // only past days before today

        if (effectiveStart < effectiveEnd) {
            const existingRecords = await Attendance.find({
                employeeId: employee._id,
                date: { $gte: effectiveStart, $lt: effectiveEnd }
            }).select("date status").lean();

            const existingDates = new Set(
                existingRecords.map(r => istDayStart(new Date(r.date)).getTime())
            );

            const approvedLeaves = await LeaveApplication.find({
                employeeId: employee._id,
                status: "APPROVED",
                startDate: { $lt: effectiveEnd },
                endDate: { $gte: effectiveStart }
            }).select("startDate endDate").lean();

            const isCoveredByLeave = (dayDate) => {
                const dStart = dayDate.getTime();
                const dEnd = dStart + 24 * 60 * 60 * 1000;
                return approvedLeaves.some(l => {
                    const lStart = new Date(l.startDate).getTime();
                    const lEnd = new Date(l.endDate).getTime();
                    return lStart < dEnd && lEnd >= dStart;
                });
            };

            const absentDocs = [];
            for (let d = new Date(effectiveStart); d < effectiveEnd; d.setDate(d.getDate() + 1)) {
                const day = istDayStart(d);
                if (isWeekend(day)) continue;
                if (existingDates.has(day.getTime())) continue;
                if (isCoveredByLeave(day)) continue;

                absentDocs.push({
                    employeeId: employee._id,
                    date: day,
                    status: "ABSENT",
                    workingHours: 0,
                    dayType: null,
                    checkIn: null,
                    checkOut: null
                });
            }

            if (absentDocs.length > 0) {
                try {
                    await Attendance.insertMany(absentDocs, { ordered: false });
                } catch (insertErr) {
                    if (insertErr.code !== 11000 && !insertErr.writeErrors?.every(e => e.code === 11000)) {
                        console.error("Failed to insert absent records:", insertErr);
                    }
                }
            }
        }

        // Query the final history
        const query = { employeeId: employee._id };
        if (isMonthQuery) {
            query.date = { $gte: startDate, $lt: endDate };
        }

        let historyQuery = Attendance.find(query).sort({ date: -1 });
        if (!isMonthQuery) {
            let lim = parseInt(limit, 10);
            if (isNaN(lim)) lim = 30;
            lim = Math.max(1, Math.min(100, lim));
            historyQuery = historyQuery.limit(lim);
        }
        const history = await historyQuery;

        const todayRecord = await Attendance.findOne({
            employeeId: employee._id,
            date: today
        }).lean();

        return res.json({
            data: history,
            todayRecord: todayRecord || null,
            employee: { isDeleted: employee.isDeleted }
        });
    } catch (error) {
        console.error("getAttendance error:", error);
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
}