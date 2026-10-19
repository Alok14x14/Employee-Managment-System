import { Inngest } from "inngest";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import LeaveApplication from "../models/LeaveApplication.js";
import User from "../models/User.js";
import { 
    sendCheckOutReminderEmail, 
    sendLeaveApplicationAdminReminder, 
    sendAttendanceReminderEmail,
    sendLeaveStatusEmail
} from "../utils/emailService.js";
import { istDayStart, istDayEnd, isWeekend, isHoliday } from "../utils/time.js";
import { loadHolidaySet } from "../utils/holidays.js";
import { autoRejectExpiredLeaves } from "../utils/leaveAutoReject.js";

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

    // Send reminder email safely without blocking auto check-out on email transport failure
    try {
        await sendCheckOutReminderEmail(
            employee.email, 
            employee.firstName, 
            employee.department, 
            attendance.checkIn
        );
    } catch (emailErr) {
        console.error("Failed to send check-out reminder email:", emailErr);
    }

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
            if (!employee) return;
            if (!process.env.ADMIN_EMAIL) return;

            // Send reminder email to admin to take action on leave application
            await sendLeaveApplicationAdminReminder(
                process.env.ADMIN_EMAIL,
                employee.department,
                leaveApplication?.startDate
            );
         }

    }
);

// Auto-reject leave application when its start date and time passes
const autoRejectLeave = inngest.createFunction(
  { id: "auto-reject-leave", triggers: [{ event: "leave/pending" }] },
  async ({ event, step }) => {
    const { leaveApplicationId } = event.data;
    const leave = await LeaveApplication.findById(leaveApplicationId);
    if (!leave || leave.status !== "PENDING") return;

    const start = new Date(leave.startDate);
    const created = new Date(leave.createdAt || leave.startDate);
    const isSameDayApplication = istDayStart(start).getTime() === istDayStart(created).getTime();
    const expiryDate = isSameDayApplication ? istDayEnd(start) : start;

    if (expiryDate.getTime() > Date.now()) {
      await step.sleepUntil("wait-until-start-time", expiryDate);
    }

    await step.run("auto-reject-if-pending", async () => {
      const currentLeave = await LeaveApplication.findById(leaveApplicationId);
      if (!currentLeave || currentLeave.status !== "PENDING") return;

      currentLeave.status = "REJECTED";
      currentLeave.autoRejected = true;
      currentLeave.rejectReason = "Auto Rejected";
      await currentLeave.save();

      try {
        const emp = await Employee.findById(currentLeave.employeeId);
        if (emp && emp.email) {
          await sendLeaveStatusEmail(
            emp.email,
            emp.firstName,
            "REJECTED",
            currentLeave.type,
            currentLeave.startDate,
            currentLeave.endDate,
            currentLeave.reason,
            "Auto Rejected"
          );
        }
      } catch (mailErr) {
        console.error("Failed to send auto-reject email in Inngest:", mailErr);
      }
    });
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

        // Step 1b: Skip if today is a holiday in IST
        const isHolidayToday = await step.run("check-holiday", async () => {
            const todayStart = istDayStart();
            const holidaySet = await loadHolidaySet(todayStart, todayStart);
            return isHoliday(todayStart, holidaySet);
        });
        if (isHolidayToday) {
            return { skipped: "Holiday - no attendance reminders sent" };
        }

        // Step 2: Get today's date range (IST)
        const today = await step.run("get-today-date", ()=>{
            const startUTC = istDayStart();
            const endUTC = istDayEnd();
            return {startUTC: startUTC.toISOString(), endUTC: endUTC.toISOString()}
        })

        // Step 3: Get all active, non-deleted employees (excluding admins)
        const activeEmployees = await step.run("get-active-employees", async () => {
            const adminUsers = await User.find({ role: "ADMIN" }).select("_id").lean();
            const adminUserIds = adminUsers.map((u) => u._id);

            const employees = await Employee.find({
                isDeleted: { $ne: true },
                employmentStatus: "ACTIVE",
                userId: { $nin: adminUserIds },
            }).select("_id firstName lastName email department joinDate createdAt").lean();
            return employees.map((e) => ({
                _id: e._id.toString(),
                firstName: e.firstName,
                lastName: e.lastName,
                email: e.email,
                department: e.department,
                joinDate: e.joinDate ? new Date(e.joinDate).toISOString() : null,
                createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
            }));
        });

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

        // Step 6: Filter absent employees (not on leave & not checked in, and joined on or before today)
        const absentEmployees = activeEmployees.filter((emp) => {
            const id = emp._id.toString();
            const join = istDayStart(emp.joinDate || emp.createdAt || new Date(0));
            return join <= new Date(today.startUTC) && !onLeaveIds.includes(id) && !checkedInIds.includes(id);
        });

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


// Cron: Mark absent records at 23:59 IST (18:29 UTC) Mon-Fri for any employee not clocked in & not on leave
const markAbsentCron = inngest.createFunction(
  { id: "mark-absent-cron", triggers: [{ cron: "TZ=Asia/Kolkata 59 23 * * 1-5" }] },
  async ({ step }) => {
    const isWeekendToday = await step.run("check-weekend", () => isWeekend());
    if (isWeekendToday) {
      return { skipped: "Weekend - no absent records marked" };
    }

    const isHolidayToday = await step.run("check-holiday", async () => {
      const todayStart = istDayStart();
      const holidaySet = await loadHolidaySet(todayStart, todayStart);
      return isHoliday(todayStart, holidaySet);
    });
    if (isHolidayToday) {
      return { skipped: "Holiday - no absent records marked" };
    }

    const today = await step.run("get-today-date", () => {
      const startUTC = istDayStart();
      const endUTC = istDayEnd();
      return { startUTC: startUTC.toISOString(), endUTC: endUTC.toISOString() };
    });

    const activeEmployees = await step.run("get-active-employees", async () => {
      const adminUsers = await User.find({ role: "ADMIN" }).select("_id").lean();
      const adminUserIds = adminUsers.map((u) => u._id);

      const employees = await Employee.find({
        isDeleted: { $ne: true },
        employmentStatus: "ACTIVE",
        userId: { $nin: adminUserIds },
      }).select("_id joinDate createdAt").lean();

      return employees.map((emp) => ({
        _id: emp._id.toString(),
        joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString() : null,
        createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString() : null,
      }));
    });

    const onLeaveIds = await step.run("get-on-leave-ids", async () => {
      const leaves = await LeaveApplication.find({
        status: "APPROVED",
        startDate: { $lte: new Date(today.endUTC) },
        endDate: { $gte: new Date(today.startUTC) },
      }).lean();
      return leaves.map((l) => l.employeeId.toString());
    });

    const checkedInIds = await step.run("get-checked-in-ids", async () => {
      const attendances = await Attendance.find({
        date: { $gte: new Date(today.startUTC), $lt: new Date(today.endUTC) },
      }).lean();
      return attendances.map((a) => a.employeeId.toString());
    });

    const absentEmployees = activeEmployees.filter((emp) => {
      const id = emp._id.toString();
      const join = istDayStart(emp.joinDate || emp.createdAt || new Date(0));
      return join <= new Date(today.startUTC) && !onLeaveIds.includes(id) && !checkedInIds.includes(id);
    });

    if (absentEmployees.length > 0) {
      await step.run("insert-absent-records", async () => {
        const docs = absentEmployees.map((emp) => ({
          employeeId: emp._id,
          date: new Date(today.startUTC),
          status: "ABSENT",
          workingHours: 0,
        }));
        try {
          await Attendance.insertMany(docs, { ordered: false });
        } catch {
          // Ignore duplicate key errors if already present
        }
      });
    }

    // Auto-checkout any employees who clocked in today or earlier but never clocked out
    const autoClosedCount = await step.run("auto-checkout-unclosed-shifts", async () => {
      const unclosed = await Attendance.find({
        date: { $lte: new Date(today.startUTC) },
        checkIn: { $ne: null },
        checkOut: null,
      });

      for (const record of unclosed) {
        record.checkOut = new Date(new Date(record.checkIn).getTime() + 4 * 60 * 60 * 1000);
        record.workingHours = 4;
        record.dayType = "Half Day";
        record.autoCheckedOut = true;
        await record.save();
      }
      return unclosed.length;
    });

    // Auto-reject any pending leaves whose start date and time has passed
    await step.run("auto-reject-expired-leaves", async () => {
      return await autoRejectExpiredLeaves();
    });

    return { markedAbsent: absentEmployees.length, autoClosed: autoClosedCount };
  }
);

// Cron: Hourly auto-reject for any pending leaves whose start date has passed
const autoRejectLeavesCron = inngest.createFunction(
  { id: "auto-reject-leaves-cron", triggers: [{ cron: "TZ=Asia/Kolkata 0 * * * *" }] },
  async ({ step }) => {
    const count = await step.run("auto-reject-expired-leaves", async () => {
      return await autoRejectExpiredLeaves();
    });
    return { autoRejected: count };
  }
);

// Create an empty array where we'll export future Inngest functions
export const functions = [
    autoCheckOut, 
    leaveApplicationReminder,
    autoRejectLeave,
    autoRejectLeavesCron,
    attendanceReminderCron,
    markAbsentCron
];