import { Inngest } from "inngest";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import { 
    sendCheckOutReminderEmail, 
    sendLeaveApplicationAdminReminder, 
    sendAttendanceReminderEmail 
} from "../utils/emailService.js";
import { istDayStart, istDayEnd, isWeekend } from "../utils/time.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "fullstack-ems" });

// Auto Check-out for employees
const autoCheckOut = inngest.createFunction(
  { id: "auto-check-out", triggers: [{event: "employee/check-in"}] }, 
  async ({ event, step }) => {
    const {employeeId, attendanceId} = event.data;

    // Wait for 9 hours
    await step.sleep("wait-9-hours", "9h");

    // Check attendance data
    let attendance = await Attendance.findById(attendanceId);
    if (!attendance || attendance.checkOut) return;

    // Check employee data
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.isDeleted) return;

    // Send reminder email
    await sendCheckOutReminderEmail(
        employee.email, 
        employee.firstName, 
        employee.department, 
        attendance.checkIn
    );

    // Wait for 1 hour
    await step.sleep("wait-1-hour", "1h");

    attendance = await Attendance.findById(attendanceId);
    if (!attendance || attendance.checkOut) return;

    const employeeCheck = await Employee.findById(employeeId);
    if (!employeeCheck || employeeCheck.isDeleted) return;

    attendance.checkOut = new Date(new Date(attendance.checkIn).getTime() + 4 * 60 * 60 * 1000);
    attendance.workingHours = 4;
    attendance.dayType = "Half Day";
    attendance.autoCheckedOut = true;
    await attendance.save();
  },
);


// Send Email to admin, If admin doesn't take action on leave application within 24 hours
const leaveApplicationReminder = inngest.createFunction(
  { id: "leave-application-reminder", triggers: [{event: "leave/pending"}] }, 
    async ({ event, step }) => {
        const { leaveApplicationId } = event.data;

        // wait for 24 hours
        await step.sleep("wait-24-hours", "24h");

        const leaveApplication = await LeaveApplication.findById(leaveApplicationId)

         if (leaveApplication?.status === "PENDING"){
            const employee = await Employee.findById(leaveApplication.employeeId)

            // Send reminder email to admin to take action on leave application
            await sendLeaveApplicationAdminReminder(
                process.env.ADMIN_EMAIL,
                employee.department,
                leaveApplication?.startDate
            );
         }

    }
);


// Cron: Check attendance at 11:30 AM IST (06:00 UTC) Mon-Fri and email absent employees
const attendanceReminderCron = inngest.createFunction(
  { id: "attendance-reminder-cron", triggers: [{cron: "TZ=Asia/Kolkata 30 11 * * 1-5"}] }, 
    async ({ step }) => {
        // Step 1: Skip if today is a weekend in IST
        const isWeekendToday = await step.run("check-weekend", () => isWeekend());
        if (isWeekendToday) {
            return { skipped: "Weekend - no attendance reminders sent" };
        }

        // Step 2: Get today's date range (IST)
        const today = await step.run("get-today-date", ()=>{
            const startUTC = istDayStart();
            const endUTC = istDayEnd();
            return {startUTC: startUTC.toISOString(), endUTC: endUTC.toISOString()}
        })

        // Step 3: Get all active, non-deleted employees
        const activeEmployees = await step.run("get-active-employees", async ()=>{
            const employees = await Employee.find({
                isDeleted: false,
                employmentStatus: "ACTIVE",
            }).lean();
            return employees.map((e)=>({_id: e._id.toString(),firstName: e.firstName, lastName: e.lastName, email: e.email, department: e.department}))
        })

        // Step 4: Get employee IDs on approved leave today
        const onLeaveIds = await step.run("get-on-leave-ids", async () => {
            const leaves = await LeaveApplication.find({
                status: "APPROVED",
                startDate: { $lte: new Date(today.endUTC) },
                endDate: { $gte: new Date(today.startUTC) },
            }).lean();
            return leaves.map((l)=>l.employeeId.toString())
        })

        // Step 5: Get employee IDs who already checked in today
        const checkedInIds = await step.run("get-checked-in-ids", async ()=>{
            const attendances = await Attendance.find({
                date: { $gte: new Date(today.startUTC), $lt: new Date(today.endUTC) },
            }).lean();
            return attendances.map((a)=> a.employeeId.toString())
        })

        // Step 6: Filter absent employees (not on leave & not checked in)
        const absentEmployees = activeEmployees.filter((emp)=> !onLeaveIds.includes(emp._id) && !checkedInIds.includes(emp._id))

        // Step 7: Send reminder emails
        if(absentEmployees.length > 0){
            await step.run("send-reminder-emails", async ()=>{
                const emailPromises = absentEmployees.map((emp)=> {
                    return sendAttendanceReminderEmail(
                        emp.email,
                        emp.firstName,
                        emp.department
                    );
                });
                const results = await Promise.allSettled(emailPromises);
                results.forEach((res, index) => {
                    if (res.status === "rejected") {
                        console.error(`Failed to send reminder email to ${absentEmployees[index].email}:`, res.reason);
                    }
                });
                const sentCount = results.filter(r => r.status === "fulfilled").length;
                return { emailsSent: sentCount, total: absentEmployees.length };
            })
        }

        
        return {totalActive: activeEmployees.length, onLeave: onLeaveIds.length, checkedIn: checkedInIds.length, absent: absentEmployees.length}
    }
);


// Create an empty array where we'll export future Inngest functions
export const functions = [
    autoCheckOut, 
    leaveApplicationReminder,
    attendanceReminderCron
];