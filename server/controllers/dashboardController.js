import { DEPARTMENTS } from "../constants/departments.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Payslip from "../models/Payslip.js";

// Get dashboard for employee and admin
// GET /api/dashboard
export const getDashboard  = async (req, res) => {
    try {
        const session = req.session;
        if(session.role === "ADMIN"){
            const [totalEmployees, todayAttendance, pendingLeaves, recentLeaves, recentEmployees] = await Promise.all([
                Employee.countDocuments({isDeleted: { $ne: true }}),
                Attendance.countDocuments({
                    date: {
                        $gte: new Date(new Date().setHours(0,0,0,0)),
                        $lt: new Date(new Date().setHours(24,0,0,0)),
                    }
                }),
                LeaveApplication.countDocuments({status: "PENDING" }),
                LeaveApplication.find().populate("employeeId", "firstName lastName department").sort({createdAt: -1}).limit(5).lean(),
                Employee.find({isDeleted: { $ne: true }}).sort({createdAt: -1}).limit(5).lean()
            ])

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
                recentEmployees: formattedRecentEmployees
            })

        }else{
            const employee = await Employee.findOne({
                userId: session.userId,
            }).lean();
            if (!employee) return res.status(404).json({ error: "Employee not found" });

            const today = new Date();
            const [currentMonthAttendance, pendingLeaves, latestPayslip] = await Promise.all([
                Attendance.countDocuments({
                    employeeId: employee._id,
                    date: {
                        $gte: new Date(today.getFullYear(), today.getMonth(), 1),
                        $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
                       
                    }
                }),
                LeaveApplication.countDocuments({
                    employeeId: employee._id,
                    status: "PENDING",
                }),
                Payslip.findOne({ employeeId: employee._id }).sort({ createdAt: -1 }).lean(),
            ])

            return res.json({
                role: "EMPLOYEE",
                employee: {...employee, id: employee._id.toString()},
                currentMonthAttendance,
                pendingLeaves,
                latestPayslip: latestPayslip ? {...latestPayslip, id: latestPayslip._id.toString()} : null
            })
        }
    } catch (error) {
        console.error("Dashboard error:", error)
        return res.status(500).json({ error: "Failed" });
    }
}