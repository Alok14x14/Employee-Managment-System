import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";
import { istDayStart, istDayEnd, istParts } from "../utils/time.js";

// Get dashboard for employee and admin
// GET /api/dashboard
export const getDashboard  = async (req, res) => {
    try {
        const session = req.session;
        if(session.role === "ADMIN"){
            const todayStart = istDayStart();
            const todayEnd = istDayEnd();

            const [totalEmployees, todayAttendance, pendingLeaves, recentLeaves, recentEmployees, deptHeadcount, leaveDistribution] = await Promise.all([
                Employee.countDocuments({isDeleted: { $ne: true }}),
                Attendance.countDocuments({
                    date: {
                        $gte: todayStart,
                        $lt: todayEnd,
                    }
                }),
                LeaveApplication.countDocuments({status: "PENDING" }),
                LeaveApplication.find().populate("employeeId", "firstName lastName department").sort({createdAt: -1}).limit(5).lean(),
                Employee.find({isDeleted: { $ne: true }}).sort({createdAt: -1}).limit(5).lean(),
                Employee.aggregate([
                    { $match: { isDeleted: { $ne: true } } },
                    { $group: { _id: "$department", headcount: { $sum: 1 } } },
                    { $project: { name: "$_id", headcount: 1, _id: 0 } }
                ]),
                LeaveApplication.aggregate([
                    { $group: { _id: "$type", value: { $sum: 1 } } },
                    { $project: { name: "$_id", value: 1, _id: 0 } }
                ])
            ])

            // Calculate past 5 days attendance trend
            const past5Days = Array.from({length: 5}, (_, i) => {
                return new Date(todayStart.getTime() - (4 - i) * 24 * 60 * 60 * 1000);
            });

            const attendancePromises = past5Days.map(async (day) => {
                const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
                const present = await Attendance.countDocuments({
                    date: { $gte: day, $lt: nextDay }
                });
                return {
                    name: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
                    present,
                    absent: Math.max(0, totalEmployees - present)
                };
            });
            const attendanceData = await Promise.all(attendancePromises);

            // Map the IDs for the frontend
            const formattedRecentLeaves = recentLeaves.map(leave => ({
                ...leave,
                id: leave._id.toString(),
                employee: leave.employeeId,
                employeeId: leave.employeeId?._id?.toString()
            }));
            
            const formattedRecentEmployees = recentEmployees.map(emp => ({
                ...emp,
                id: emp._id.toString()
            }));

            return res.json({
                role: "ADMIN",
                totalEmployees,
                totalDepartments: DEPARTMENTS.length,
                todayAttendance,
                pendingLeaves,
                recentLeaves: formattedRecentLeaves,
                recentEmployees: formattedRecentEmployees,
                deptData: deptHeadcount,
                leaveData: leaveDistribution,
                attendanceData
            })

        }else{
            const employee = await Employee.findOne({
                userId: session.userId,
            }).lean();
            if (!employee) return res.status(404).json({ error: "Employee not found" });

            const today = istDayStart();
            const tomorrow = istDayEnd();

            const { year, month } = istParts();
            const startOfMonth = new Date(`${year}-${month}-01T00:00:00+05:30`);
            const nextMonthNum = +month === 12 ? 1 : +month + 1;
            const nextYearNum = +month === 12 ? +year + 1 : +year;
            const startOfNextMonth = new Date(`${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-01T00:00:00+05:30`);

            const [currentMonthAttendance, pendingLeaves, approvedLeaves, latestPayslip, todayRecord, recentAttendance, recentLeaves] = await Promise.all([
                Attendance.countDocuments({
                    employeeId: employee._id,
                    date: {
                        $gte: startOfMonth,
                        $lt: startOfNextMonth,
                    }
                }),
                LeaveApplication.countDocuments({
                    employeeId: employee._id,
                    status: "PENDING",
                }),
                LeaveApplication.countDocuments({
                    employeeId: employee._id,
                    status: "APPROVED",
                }),
                Payslip.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean(),
                Attendance.findOne({
                    employeeId: employee._id,
                    date: { $gte: today, $lt: tomorrow }
                }).lean(),
                Attendance.find({ employeeId: employee._id }).sort({ date: -1 }).limit(5).lean(),
                LeaveApplication.find({ employeeId: employee._id }).sort({ createdAt: -1 }).limit(5).lean(),
            ]);

            // Calculate past 7 days logged hours for employee
            const past7Days = Array.from({ length: 7 }, (_, i) => {
                return new Date(today.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            });

            const weeklyAttendancePromises = past7Days.map(async (day) => {
                const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
                const record = await Attendance.findOne({
                    employeeId: employee._id,
                    date: { $gte: day, $lt: nextDay }
                }).lean();
                return {
                    day: day.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'Asia/Kolkata' }),
                    date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' }),
                    hours: record && record.workingHours ? Number(record.workingHours.toFixed(1)) : 0,
                    status: record ? record.status : 'ABSENT',
                };
            });
            const weeklyHours = await Promise.all(weeklyAttendancePromises);

            const formattedAttendance = recentAttendance.map(a => ({
                ...a,
                id: a._id.toString()
            }));

            const formattedLeaves = recentLeaves.map(l => ({
                ...l,
                id: l._id.toString()
            }));

            return res.json({
                role: "EMPLOYEE",
                employee: {...employee, id: employee._id.toString()},
                currentMonthAttendance,
                pendingLeaves,
                approvedLeaves,
                latestPayslip: latestPayslip ? {...latestPayslip, id: latestPayslip._id.toString()} : null,
                todayRecord: todayRecord ? {...todayRecord, id: todayRecord._id.toString()} : null,
                weeklyHours,
                recentAttendance: formattedAttendance,
                recentLeaves: formattedLeaves,
            })
        }
    } catch (error) {
        console.error("Dashboard error:", error)
        return res.status(500).json({ error: "Failed" });
    }
}