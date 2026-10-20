import sendEmail from "../config/nodemailer.js";

const escapeHtml = (str) => {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
};

export const sendWelcomeEmail = async (email, firstName, joinDate) => {
    const subject = "Welcome to StaffFlow";
    const body = `<div style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${escapeHtml(firstName)},</h2>
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
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${escapeHtml(firstName)},</h2>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Your leave request has been marked as <strong style="color: ${color};">${status.toLowerCase()}</strong>.</p>
                    
                    <h3 style="margin-top: 20px; font-size: 14px; font-weight: 600;">Request Details:</h3>
                    <ul style="font-size: 14px; line-height: 1.6; background: #f4f4f5; padding: 12px 24px; border-radius: 6px; border: 1px solid #e4e4e7; color: #3f3f46;">
                        <li><strong>Type:</strong> ${type}</li>
                        <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}</li>
                        <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" })}</li>
                        <li><strong>Reason:</strong> ${escapeHtml(reason)}</li>
                        <li><strong>Status:</strong> <span style="color: ${color}; font-weight: 600;">${status}</span></li>
                        ${status === "REJECTED" && rejectReason ? `<li><strong style="color: #b91c1c;">Rejection Reason:</strong> ${escapeHtml(rejectReason)}</li>` : ""}
                    </ul>
                    
                    <p style="font-size: 14px; margin-top: 16px; color: #3f3f46;">Sign in to StaffFlow to review your updated leave balance.</p>
                    <br />
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 4px;">StaffFlow Operations</p>
                </div>`;
                
    return sendEmail({ to: email, subject, body });
};

export const sendPayslipAvailableEmail = async (email, firstName, month, year) => {
    const period = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(Date.UTC(year, month - 1, 1)));
    const subject = `Your ${period} payslip is ready - StaffFlow`;
    const body = `<div style="max-width:600px;font-family:Arial,sans-serif;color:#18181b"><h2>Hello ${escapeHtml(firstName || "there")},</h2><p>Your <strong>${escapeHtml(period)}</strong> payslip is now available in your StaffFlow employee portal.</p><p>Sign in and open Payslips to review or download it.</p><p style="color:#71717a">StaffFlow Operations</p></div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendHolidayAnnouncementEmail = async (email, firstName, holidayName, holidayDate) => {
    const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(new Date(holidayDate));
    const subject = `Public holiday added: ${holidayName} - StaffFlow`;
    const body = `<div style="max-width:600px;font-family:Arial,sans-serif;color:#18181b"><h2>Hello ${escapeHtml(firstName || "there")},</h2><p>A public holiday has been added to the StaffFlow calendar: <strong>${escapeHtml(holidayName)}</strong> on <strong>${escapeHtml(date)}</strong>.</p><p>You can review holidays in the employee portal.</p><p style="color:#71717a">StaffFlow Operations</p></div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendDocumentAvailableEmail = async (email, firstName, title, category) => {
    const subject = "A new document is available - StaffFlow";
    const body = `<div style="max-width:600px;font-family:Arial,sans-serif;color:#18181b"><h2>Hello ${escapeHtml(firstName || "there")},</h2><p>A new ${escapeHtml(category)} document, <strong>${escapeHtml(title)}</strong>, is available in your StaffFlow employee portal.</p><p>Sign in and open Employee documents to view or download it.</p><p style="color:#71717a">StaffFlow Operations</p></div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendAttendanceCorrectionStatusEmail = async (email, firstName, status, field, requestedTime, reviewNote) => {
    const label = field === "checkIn" ? "check-in" : "check-out";
    const time = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(requestedTime));
    const subject = `Attendance correction ${status.toLowerCase()} - StaffFlow`;
    const body = `<div style="max-width:600px;font-family:Arial,sans-serif;color:#18181b"><h2>Hello ${escapeHtml(firstName || "there")},</h2><p>Your request to correct the ${label} time for <strong>${escapeHtml(time)}</strong> was <strong>${status.toLowerCase()}</strong>.</p>${reviewNote ? `<p>Manager note: ${escapeHtml(reviewNote)}</p>` : ""}<p>Sign in to StaffFlow to review your attendance.</p><p style="color:#71717a">StaffFlow Operations</p></div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendAnnouncementEmail = async (email, firstName, title, message) => {
    const subject = `Company announcement: ${String(title).replace(/[\r\n]/g, " ").slice(0, 140)}`;
    const paragraphs = escapeHtml(message).split(/\r?\n/).map((line) => line || "&nbsp;").join("<br />");
    const body = `<div style="max-width:600px;font-family:Arial,sans-serif;color:#18181b"><h2>Hello ${escapeHtml(firstName || "there")},</h2><h3>${escapeHtml(title)}</h3><p style="line-height:1.6">${paragraphs}</p><p style="color:#71717a">StaffFlow Operations</p></div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendCheckOutReminderEmail = async (email, firstName, department, checkInTime) => {
    const subject = "Attendance Check-Out Reminder";
    const body = `<div style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${escapeHtml(firstName)},</h2>
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
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${escapeHtml(firstName)},</h2>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Your check-in has not been recorded yet today.</p>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Please record your check-in through the employee portal or notify your administrator if you are unable to do so.</p>
                    <br />
                    <p style="font-size: 12px; color: #71717a;">Department: ${department}</p>
                    <br />
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 4px;">StaffFlow Operations</p>
                </div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendPasswordResetEmail = async (email, firstName, resetUrl) => {
    const subject = "Reset Your Password - StaffFlow";
    const name = firstName || "there";
    const body = `<div style="max-width: 600px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
                    <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Hello ${escapeHtml(name)},</h2>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">We received a request to reset your password for your StaffFlow account.</p>
                    <p style="font-size: 14px; line-height: 1.5; color: #3f3f46;">Click the button below to set a new password:</p>
                    <div style="margin: 24px 0;">
                        <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
                    </div>
                    <p style="font-size: 13px; line-height: 1.5; color: #71717a;">Or copy and paste this link into your browser:<br /><a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a></p>
                    <p style="font-size: 13px; line-height: 1.5; color: #71717a; margin-top: 16px;">This link will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
                    <br />
                    <p style="font-size: 14px; color: #71717a; margin-bottom: 4px;">StaffFlow Security</p>
                </div>`;
    return sendEmail({ to: email, subject, body });
};

