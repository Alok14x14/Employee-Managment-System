import sendEmail from "../config/nodemailer.js";

export const sendWelcomeEmail = async (email, firstName, joinDate) => {
    const subject = "Welcome to StaffFlow!";
    const body = `<div style="max-width: 600px; font-family: Arial, sans-serif;">
                    <h2>Hi ${firstName},</h2>
                    <p style="font-size: 16px;">Welcome to <strong>StaffFlow</strong>! You have been successfully registered on SaffFlow by the Admin on ${new Date(joinDate).toLocaleDateString()}.</p>
                    <p style="font-size: 16px;">You can now log in to manage all your employment details, including:</p>
                    <ul style="font-size: 16px; line-height: 1.5;">
                        <li>Daily check-ins and check-outs</li>
                        <li>Leave applications</li>
                        <li>Viewing your profile details</li>
                    </ul>
                    <p style="font-size: 16px;">Please use your registered email and the password provided by the Admin to log in.</p>
                    <br />
                    <p style="font-size: 16px;">Best Regards,</p>
                    <p style="font-size: 16px;"><strong>The StaffFlow Team</strong></p>
                </div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendLeaveStatusEmail = async (email, firstName, status, type, startDate, endDate, reason, rejectReason) => {
    const isApproved = status === "APPROVED";
    const color = isApproved ? "#10b981" : "#ef4444";
    const subject = `Leave Request ${status.charAt(0) + status.slice(1).toLowerCase()} - StaffFlow`;
    
    const body = `<div style="max-width: 600px; font-family: Arial, sans-serif;">
                    <h2>Hi ${firstName}, 👋</h2>
                    <p style="font-size: 16px;">Your leave request has been <strong style="color: ${color};">${status.toLowerCase()}</strong> by the Admin.</p>
                    
                    <h3 style="margin-top: 20px;">Leave Details:</h3>
                    <ul style="font-size: 16px; line-height: 1.6; background: #f8fafc; padding: 15px 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <li><strong>Type:</strong> ${type}</li>
                        <li><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</li>
                        <li><strong>End Date:</strong> ${new Date(endDate).toLocaleDateString()}</li>
                        <li><strong>Reason:</strong> ${reason}</li>
                        <li><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${status}</span></li>
                        ${status === "REJECTED" && rejectReason ? `<li><strong style="color: #ef4444;">Rejection Reason:</strong> ${rejectReason}</li>` : ""}
                    </ul>
                    
                    <p style="font-size: 16px; margin-top: 20px;">You can log in to StaffFlow to view more details.</p>
                    <br />
                    <p style="font-size: 16px;">Best Regards,</p>
                    <p style="font-size: 16px;"><strong>The StaffFlow Team</strong></p>
                </div>`;
                
    return sendEmail({ to: email, subject, body });
};

export const sendCheckOutReminderEmail = async (email, firstName, department, checkInTime) => {
    const subject = "Attendence Check-Out Remainder";
    const body = `<div style="max-width: 600px;">
                    <h2>Hi ${firstName}, 👋</h2>
                    <p style="font-size: 16px;">You have a check-in in ${department} today:</p>
                    <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">${new Date(checkInTime).toLocaleTimeString()}</p>
                    <p style="font-size: 16px;">Please make sure to check-out in one hour.</p>
                    <p style="font-size: 16px;">If you have any questions, please contact your admin.</p>
                    <br />
                    <p style="font-size: 16px;">Best Regards,</p>
                    <p style="font-size: 16px;">EMS</p>
                </div>`;
    return sendEmail({ to: email, subject, body });
};

export const sendLeaveApplicationAdminReminder = async (adminEmail, department, startDate) => {
    const subject = `Leave Application Reminder`;
    const body = `<div style="max-width: 600px;">
                <h2>Hi Admin, 👋</h2>
                <p style="font-size: 16px;">You have a pending leave application in ${department} starting on:</p>
                <p style="font-size: 18px; font-weight: bold; color: #007bff; margin: 8px 0;">${new Date(startDate).toLocaleDateString()}</p>
                <p style="font-size: 16px;">Please make sure to take action on this leave application.</p>
                <br />
                <p style="font-size: 16px;">Best Regards,</p>
                <p style="font-size: 16px;">EMS</p>
            </div>`;
    return sendEmail({ to: adminEmail, subject, body });
};

export const sendAttendanceReminderEmail = async (email, firstName, department) => {
    const subject = `Attendance Reminder — Please Mark Your Attendance`;
    const body = `<div style="max-width: 600px; font-family: Arial, sans-serif;">
                    <h2>Hi ${firstName}, 👋</h2>
                    <p style="font-size: 16px;">We noticed you haven't marked your attendance yet today.</p>
                    <p style="font-size: 16px;">The deadline was <strong>11:30 AM</strong> and your attendance is still missing.</p>
                    <p style="font-size: 16px;">Please check in as soon as possible or contact your admin if you're facing any issues.</p>
                    <br />
                    <p style="font-size: 14px; color: #666;">Department: ${department}</p>
                    <br />
                    <p style="font-size: 16px;">Best Regards,</p>
                    <p style="font-size: 16px;"><strong>QuickEMS</strong></p>
                </div>`;
    return sendEmail({ to: email, subject, body });
};
