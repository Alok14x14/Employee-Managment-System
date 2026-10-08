import sendEmail from "../config/nodemailer.js";

export const sendWelcomeEmail = async (email, firstName, joinDate) => {
    const subject = "Welcome to StaffFlow";
    const body = `<div style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${firstName},</h2>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Welcome to <strong>StaffFlow</strong>. Your account was registered on ${new Date(joinDate).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}.</p>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">You can log in to manage your employment records:</p>
                    <ul style="font-size: 14px; line-height: 1.6; color: #3f3f46;">
                        <li>Daily attendance check-ins and check-outs</li>
                        <li>Leave requests and balance tracking</li>
                        <li>Payroll records and payslip downloads</li>
                    </ul>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Please use your registered email and the initial password provided by your administrator to sign in.</p>
                    <br />
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 4px;">StaffFlow Operations</p>
                </div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendLeaveStatusEmail = async (email, firstName, status, type, startDate, endDate, reason, rejectReason) => {
    const isApproved = status === "APPROVED";
    const color = isApproved ? "#15803d" : "#b91c1c";
    const subject = `Leave Request ${status.charAt(0) + status.slice(1).toLowerCase()} - StaffFlow`;
    
    const body = `<div style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${firstName},</h2>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Your leave request has been marked as <strong style="color: ${color};">${status.toLowerCase()}</strong>.</p>
                    
                    <h3 style="margin-top: 20px; font-size: 14px; font-weight: 600;">Request Details:</h3>
                    <ul style="font-size: 14px; line-height: 1.6; background: #f4f4f5; padding: 12px 24px; border-radius: 6px; border: 1px solid #e4e4e7; color: #3f3f46;">
                        <li><strong>Type:</strong> ${type}</li>
                        <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}</li>
                        <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}</li>
                        <li><strong>Reason:</strong> ${reason}</li>
                        <li><strong>Status:</strong> <span style="color: ${color}; font-weight: 600;">${status}</span></li>
                        ${status === "REJECTED" && rejectReason ? `<li><strong style="color: #b91c1c;">Rejection Reason:</strong> ${rejectReason}</li>` : ""}
                    </ul>
                    
                    <p style="font-size: 14px; margin-top: 16px; color: #3f3f46;">Sign in to StaffFlow to review your updated leave balance.</p>
                    <br />
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 4px;">StaffFlow Operations</p>
                </div>`;
                
    return sendEmail({ to: email, subject, body });
};

export const sendCheckOutReminderEmail = async (email, firstName, department, checkInTime) => {
    const subject = "Attendance Check-Out Reminder";
    const body = `<div style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${firstName},</h2>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Your attendance check-in for department ${department} was recorded at:</p>
                    <p style="font-size: 16px; font-weight: 600; color: #2563eb; margin: 8px 0;">${new Date(checkInTime).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })}</p>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Please remember to log your check-out upon completing your shift.</p>
                    <br />
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 4px;">StaffFlow Operations</p>
                </div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendLeaveApplicationAdminReminder = async (adminEmail, department, startDate) => {
    const subject = "Leave Application Review Required";
    const body = `<div style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
                <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello Administrator,</h2>
                <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">A pending leave request has been submitted for department ${department} starting on:</p>
                <p style="font-size: 16px; font-weight: 600; color: #2563eb; margin: 8px 0;">${new Date(startDate).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}</p>
                <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Please log in to the administrator portal to review and approve or reject this request.</p>
                <br />
                <p style="font-size: 14px; color: #71717a; margin-bottom: 4px;">StaffFlow Operations</p>
            </div>`;
    return sendEmail({ to: adminEmail, subject, body });
};

export const sendAttendanceReminderEmail = async (email, firstName, department) => {
    const subject = "Attendance Reminder - Check-In Required";
    const body = `<div style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${firstName},</h2>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Your daily attendance record has not yet been marked for today.</p>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Standard check-in cutoff is 11:30 AM.</p>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Please record your check-in through the employee portal or notify your administrator if you are unable to do so.</p>
                    <br />
                    <p style="font-size: 12px; color: #71717a;">Department: ${department}</p>
                    <br />
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 4px;">StaffFlow Operations</p>
                </div>`;
    return sendEmail({ to: email, subject, body });
};

