import { inngest } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Holiday from "../models/Holiday.js";
import { istParts, istDayStart, istDayEnd, isLate, isWeekend, isHoliday } from "../utils/time.js";
import { loadHolidaySet } from "../utils/holidays.js";
import { computeDayType, calculateAutoCheckOutDetails } from "../utils/attendance.js";

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
            // Validation: Employees cannot clock in on weekends, public holidays, or during approved leave
            if (isWeekend(today)) {
                return res.status(400).json({ error: "Cannot clock in on weekends." });
            }

            const holiday = await Holiday.findOne({ date: today }).select("name").lean();
            if (holiday) {
                return res.status(400).json({
                    error: `Cannot clock in on a public holiday (${holiday.name}).`,
                });
            }

            const approvedLeave = await LeaveApplication.findOne({
                employeeId: employee._id,
                status: "APPROVED",
                startDate: { $lte: today },
                endDate: { $gte: today },
            }).select("type").lean();

            if (approvedLeave) {
                const leaveType = approvedLeave.type.charAt(0) + approvedLeave.type.slice(1).toLowerCase();
                return res.status(400).json({
                    error: `Cannot clock in while on approved ${leaveType} leave.`,
                });
            }

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

            // Compute working hours and day type
            const workingHours = parseFloat(diffHours.toFixed(2))
            const dayType = computeDayType(workingHours);

            const checkedOut = await Attendance.findOneAndUpdate(
                { _id: existing._id, checkOut: null },
                { $set: { checkOut: now, workingHours, dayType } },
                { returnDocument: "after" }
            );
            if (checkedOut) {
                return res.json({ success: true, type: "CHECK_OUT", data: checkedOut });
            }

            // An automatic checkout may have completed while this request was running.
            const latest = await Attendance.findById(existing._id);
            return res.json({ success: true, type: "CHECK_OUT", data: latest || existing });
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
        const paginated = !month && (req.query.page !== undefined || limit !== undefined);
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);

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

        // Auto-close any past unclosed shifts for this employee (prior to today)
        const unclosedPastRecords = await Attendance.find({
            employeeId: employee._id,
            date: { $lt: today },
            checkIn: { $ne: null },
            checkOut: null,
        });

        if (unclosedPastRecords.length > 0) {
            for (const record of unclosedPastRecords) {
                const details = calculateAutoCheckOutDetails(record.checkIn, new Date(), record.date);
                record.checkOut = details.checkOut;
                record.workingHours = details.workingHours;
                record.dayType = details.dayType;
                record.autoCheckedOut = true;
                await record.save();
            }
        }

        // Fill in missing ABSENT records for past working days
        const joinDate = istDayStart(employee.joinDate || employee.createdAt || new Date(0));
        const effectiveStart = new Date(Math.max(startDate.getTime(), joinDate.getTime()));
        const effectiveEnd = new Date(Math.min(endDate.getTime(), today.getTime())); // only past days before today

        if (effectiveStart < effectiveEnd) {
            const [existingRecords, approvedLeaves, holidaySet] = await Promise.all([
                Attendance.find({
                    employeeId: employee._id,
                    date: { $gte: effectiveStart, $lt: effectiveEnd }
                }).select("date status").lean(),
                LeaveApplication.find({
                    employeeId: employee._id,
                    status: "APPROVED",
                    startDate: { $lt: effectiveEnd },
                    endDate: { $gte: effectiveStart }
                }).select("startDate endDate").lean(),
                loadHolidaySet(effectiveStart, effectiveEnd)
            ]);

            const existingDates = new Set(
                existingRecords.map(r => istDayStart(new Date(r.date)).getTime())
            );

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
                if (isWeekend(day) || holidaySet.has(day.getTime())) continue;
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
            if (isNaN(lim)) lim = 10;
            lim = Math.max(1, Math.min(100, lim));
            if (paginated) historyQuery = historyQuery.skip((page - 1) * lim);
            historyQuery = historyQuery.limit(lim);
        }
        const [history, historyTotal] = await Promise.all([
            historyQuery,
            paginated ? Attendance.countDocuments(query) : Promise.resolve(null),
        ]);

        const [todayRecord, isWeekendToday, holidayToday, approvedLeaveToday] = await Promise.all([
            Attendance.findOne({
                employeeId: employee._id,
                date: today
            }).lean(),
            isWeekend(today),
            Holiday.findOne({ date: today }).select("name").lean(),
            LeaveApplication.findOne({
                employeeId: employee._id,
                status: "APPROVED",
                startDate: { $lte: today },
                endDate: { $gte: today },
            }).select("type").lean(),
        ]);

        let restriction = null;
        if (isWeekendToday) {
            restriction = "Weekend (Non-working day)";
        } else if (holidayToday) {
            restriction = `Public Holiday (${holidayToday.name})`;
        } else if (approvedLeaveToday) {
            const leaveType = approvedLeaveToday.type.charAt(0) + approvedLeaveToday.type.slice(1).toLowerCase();
            restriction = `On Approved ${leaveType} Leave`;
        }

        return res.json({
            data: history,
            ...(paginated ? { total: historyTotal, page, limit: parseInt(limit, 10) || 10, totalPages: Math.ceil(historyTotal / (parseInt(limit, 10) || 10)) } : {}),
            todayRecord: todayRecord || null,
            employee: { isDeleted: employee.isDeleted },
            restriction,
        });
    } catch (error) {
        console.error("getAttendance error:", error);
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
}

// Get today's or past date's attendance for admin overview
// GET /api/attendance/admin/today?department=&date=YYYY-MM-DD
export const getTodayAttendanceAdmin = async (req, res) => {
    try {
        const { department, date, search, status, page: rawPage, limit: rawLimit } = req.query;
        const paginated = rawPage !== undefined || rawLimit !== undefined;
        const page = Math.max(1, parseInt(rawPage, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 10));

        // Current today in IST
        const currentTodayStart = istDayStart();
        const { year: curY, month: curM, day: curD } = istParts();
        const todayStr = `${curY}-${curM}-${curD}`;

        let dateStr = todayStr;
        let targetStart = currentTodayStart;

        // Validate date parameter if supplied
        if (date) {
            if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json({ error: "Invalid date format. Expected YYYY-MM-DD" });
            }

            const [y, m, d] = date.split("-").map(Number);
            const parsedCheck = new Date(Date.UTC(y, m - 1, d));
            if (
                isNaN(parsedCheck.getTime()) ||
                parsedCheck.getUTCFullYear() !== y ||
                parsedCheck.getUTCMonth() !== m - 1 ||
                parsedCheck.getUTCDate() !== d
            ) {
                return res.status(400).json({ error: "Invalid calendar date" });
            }

            targetStart = istDayStart(date);
            if (targetStart.getTime() > currentTodayStart.getTime()) {
                return res.status(400).json({ error: "Date cannot be in the future" });
            }
            dateStr = date;
        }

        const isToday = targetStart.getTime() === currentTodayStart.getTime();
        const targetEnd = istDayEnd(targetStart);

        // Determine dayInfo: WORKING, WEEKEND, or HOLIDAY
        let dayInfo = { type: "WORKING" };
        if (isWeekend(targetStart)) {
            dayInfo = { type: "WEEKEND" };
        } else {
            const holiday = await Holiday.findOne({
                date: { $gte: targetStart, $lt: targetEnd },
            }).select("name").lean();
            if (holiday) {
                dayInfo = { type: "HOLIDAY", holidayName: holiday.name };
            }
        }

        // Query employees: non-deleted, joined on or before targetStart, optional department filter
        const empQuery = {
            isDeleted: false,
        };
        if (isToday) {
            empQuery.employmentStatus = "ACTIVE";
        }
        if (department) {
            empQuery.department = department;
        }

        const allMatchingEmployees = await Employee.find(empQuery)
            .select("_id firstName lastName email department position joinDate createdAt")
            .lean();

        const employees = allMatchingEmployees.filter((emp) => {
            const join = istDayStart(emp.joinDate || emp.createdAt || new Date(0));
            return join.getTime() <= targetStart.getTime();
        });

        // Query attendance records for the target day in IST
        const attendanceRecords = await Attendance.find({
            date: { $gte: targetStart, $lt: targetEnd },
            checkIn: { $ne: null },
            status: { $ne: "ABSENT" },
        }).lean();

        // Map matching active employees by id
        const empMap = new Map();
        for (const emp of employees) {
            empMap.set(emp._id.toString(), emp);
        }

        // Merge check-in data in memory
        const data = [];
        const checkedInEmpIds = new Set();
        for (const att of attendanceRecords) {
            const emp = empMap.get(att.employeeId.toString());
            if (emp) {
                checkedInEmpIds.add(emp._id.toString());
                data.push({
                    employee: {
                        id: emp._id,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        email: emp.email,
                        department: emp.department,
                        position: emp.position,
                    },
                    checkIn: att.checkIn,
                    checkOut: att.checkOut,
                    status: att.status,
                    workingHours: att.workingHours,
                    dayType: att.dayType,
                    autoCheckedOut: att.autoCheckedOut ?? false,
                });
            }
        }

        // Query approved leaves covering that date
        const employeeIds = Array.from(empMap.keys());
        const approvedLeaves = await LeaveApplication.find({
            employeeId: { $in: employeeIds },
            status: "APPROVED",
            startDate: { $lte: targetEnd },
            endDate: { $gte: targetStart },
        }).select("employeeId type").lean();

        const leaveMap = new Map();
        for (const l of approvedLeaves) {
            leaveMap.set(l.employeeId.toString(), l);
        }

        // Include onLeave employees as rows in data
        for (const emp of employees) {
            const empId = emp._id.toString();
            if (!checkedInEmpIds.has(empId) && leaveMap.has(empId)) {
                const leave = leaveMap.get(empId);
                data.push({
                    employee: {
                        id: emp._id,
                        firstName: emp.firstName,
                        lastName: emp.lastName,
                        email: emp.email,
                        department: emp.department,
                        position: emp.position,
                    },
                    checkIn: null,
                    checkOut: null,
                    status: "ON_LEAVE",
                    leaveType: leave.type,
                    workingHours: null,
                    dayType: null,
                    autoCheckedOut: false,
                });
            }
        }

        // Only show absences on days when employees are expected to work.
        if (dayInfo.type === "WORKING") {
            for (const emp of employees) {
                const empId = emp._id.toString();
                if (!checkedInEmpIds.has(empId) && !leaveMap.has(empId)) {
                    data.push({
                        employee: {
                            id: emp._id,
                            firstName: emp.firstName,
                            lastName: emp.lastName,
                            email: emp.email,
                            department: emp.department,
                            position: emp.position,
                        },
                        checkIn: null,
                        checkOut: null,
                        status: "ABSENT",
                        leaveType: null,
                        workingHours: null,
                        dayType: null,
                        autoCheckedOut: false,
                    });
                }
            }
        }

        // Sort data: checked-in rows by checkIn ascending, then ON_LEAVE, then ABSENT alphabetically by name
        data.sort((a, b) => {
            if (a.checkIn && b.checkIn) {
                return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
            }
            if (a.checkIn) return -1;
            if (b.checkIn) return 1;

            if (a.status === "ON_LEAVE" && b.status !== "ON_LEAVE") return -1;
            if (b.status === "ON_LEAVE" && a.status !== "ON_LEAVE") return 1;

            const nameA = `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`;
            const nameB = `${b.employee?.firstName || ''} ${b.employee?.lastName || ''}`;
            return nameA.localeCompare(nameB);
        });

        let filteredData = data;
        if (status === "PRESENT") filteredData = filteredData.filter((row) => row.status === "PRESENT" || row.status === "LATE");
        else if (status === "LATE") filteredData = filteredData.filter((row) => row.status === "LATE");
        else if (status === "ON_LEAVE" || status === "ABSENT") filteredData = filteredData.filter((row) => row.status === status);
        if (search?.trim()) {
            const term = search.trim().toLocaleLowerCase();
            filteredData = filteredData.filter((row) => `${row.employee.firstName} ${row.employee.lastName} ${row.employee.email || ""} ${row.employee.position || ""}`.toLocaleLowerCase().includes(term));
        }
        const total = filteredData.length;
        const pageData = paginated ? filteredData.slice((page - 1) * limit, page * limit) : data;

        // Calculate summary counts
        const totalActive = employees.length;
        const present = checkedInEmpIds.size;
        const late = data.filter((d) => d.status === "LATE").length;
        const stillWorking = data.filter((d) => d.checkIn && !d.checkOut).length;
        const checkedOut = data.filter((d) => d.checkIn && d.checkOut).length;
        // Count employees represented as ON_LEAVE in the attendance data. Approved leave
        // records for employees who still checked in must not inflate this metric.
        const summaryRows = search?.trim()
            ? data.filter((row) => `${row.employee.firstName} ${row.employee.lastName} ${row.employee.email || ""} ${row.employee.position || ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
            : data;
        const onLeave = summaryRows.filter((row) => row.status === "ON_LEAVE").length;
        const notCheckedIn = Math.max(0, totalActive - present);
        const absent = dayInfo.type === "WORKING"
            ? Math.max(0, totalActive - present - onLeave)
            : 0;

        return res.json({
            date: dateStr,
            isToday,
            dayInfo,
            summary: {
                totalActive,
                present,
                late,
                stillWorking,
                checkedOut,
                notCheckedIn,
                onLeave,
                absent,
            },
            data: pageData,
            ...(paginated ? { total, page, limit, totalPages: Math.ceil(total / limit) } : {}),
        });
    } catch (error) {
        console.error("getTodayAttendanceAdmin error:", error);
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
};