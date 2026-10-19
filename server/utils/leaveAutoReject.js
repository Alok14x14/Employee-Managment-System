import LeaveApplication from "../models/LeaveApplication.js";
import Employee from "../models/Employee.js";
import { sendLeaveStatusEmail } from "./emailService.js";
import { istDayStart, istDayEnd } from "./time.js";

/**
 * Checks whether a leave request's start date and time has passed current time.
 * - If the leave was submitted with a specific time (not day-start), it passes once that time arrives.
 * - If applied on the same day as the start date (date-only), it expires at the end of that day (23:59:59 IST).
 * - If applied in advance, it passes once the start date arrives (midnight IST).
 *
 * @param {Object} leave - LeaveApplication document or object with startDate and createdAt
 * @param {Date} [now=new Date()]
 * @returns {boolean}
 */
export const isLeavePassed = (leave, now = new Date()) => {
  if (!leave || !leave.startDate) return false;
  const start = new Date(leave.startDate);
  const nowTime = now.getTime();

  // If the date has an explicit non-midnight time in IST, compare directly
  const hasSpecificTime = start.getTime() !== istDayStart(start).getTime();
  if (hasSpecificTime) {
    return nowTime >= start.getTime();
  }

  // If applied on the same day as the start date, it is valid through the end of that day
  const created = new Date(leave.createdAt || leave.startDate);
  const isSameDayApplication = istDayStart(start).getTime() === istDayStart(created).getTime();

  if (isSameDayApplication) {
    return nowTime >= istDayEnd(start).getTime();
  }

  // Advance application: passes once the start date/time arrives
  return nowTime >= start.getTime();
};

/**
 * Automatically rejects any PENDING leave applications whose start date and time has passed.
 * Sets status to "REJECTED", autoRejected to true, and rejectReason to "Auto Rejected".
 * Sends an email notification to the employee.
 *
 * @param {string|mongoose.Types.ObjectId} [employeeId=null] - Optional employee filter
 * @param {Date} [now=new Date()]
 * @returns {Promise<number>} number of leaves auto-rejected
 */
export const autoRejectExpiredLeaves = async (employeeId = null, now = new Date()) => {
  try {
    const filter = { status: "PENDING" };
    if (employeeId) {
      filter.employeeId = employeeId;
    }

    const pendingLeaves = await LeaveApplication.find(filter);
    if (!pendingLeaves || pendingLeaves.length === 0) return 0;

    let count = 0;
    for (const leave of pendingLeaves) {
      if (isLeavePassed(leave, now)) {
        const updated = await LeaveApplication.findOneAndUpdate(
          { _id: leave._id, status: "PENDING" },
          {
            $set: {
              status: "REJECTED",
              autoRejected: true,
              rejectReason: "Auto Rejected",
            },
          },
          { returnDocument: "after" }
        );

        if (updated) {
          count++;
          try {
            const employee = await Employee.findById(updated.employeeId);
            if (employee && employee.email) {
              await sendLeaveStatusEmail(
                employee.email,
                employee.firstName,
                "REJECTED",
                updated.type,
                updated.startDate,
                updated.endDate,
                updated.reason,
                "Auto Rejected"
              );
            }
          } catch (emailErr) {
            console.error("Failed to send auto-reject leave status email:", emailErr);
          }
        }
      }
    }

    return count;
  } catch (err) {
    console.error("autoRejectExpiredLeaves error:", err);
    return 0;
  }
};

export default {
  isLeavePassed,
  autoRejectExpiredLeaves,
};
