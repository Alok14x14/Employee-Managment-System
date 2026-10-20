import Attendance from "../models/Attendance.js";
import AttendanceCorrection from "../models/AttendanceCorrection.js";
import Employee from "../models/Employee.js";
import { istDayStart, isLate } from "../utils/time.js";
import { computeDayType } from "../utils/attendance.js";
import { isValidObjectId } from "../utils/validate.js";
import { sendAttendanceCorrectionStatusEmail } from "../utils/emailService.js";

const toISTTimestamp = (date, time) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || "")) return null;
  const timestamp = new Date(`${date}T${time}:00+05:30`);
  if (Number.isNaN(timestamp.getTime())) return null;
  const normalizedDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(timestamp);
  return normalizedDate === date ? timestamp : null;
};

export const getCorrectionRequests = async (req, res) => {
  try {
    const isAdmin = req.session.role === "ADMIN";
    const status = req.query.status;
    const employee = isAdmin ? null : await Employee.findOne({ userId: req.session.userId }).select("_id");
    if (!isAdmin && !employee) return res.status(404).json({ error: "Employee not found" });
    const filter = isAdmin ? {} : { employeeId: employee._id };
    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) filter.status = status;
    const requests = await AttendanceCorrection.find(filter)
      .populate("employeeId", "firstName lastName email department")
      .populate("attendanceId", "date checkIn checkOut")
      .sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ data: requests.map((item) => ({ ...item, id: item._id.toString() })) });
  } catch (error) {
    console.error("getCorrectionRequests error:", error);
    return res.status(500).json({ error: "Failed to fetch correction requests" });
  }
};

export const createCorrectionRequest = async (req, res) => {
  try {
    const { date, field, time, reason } = req.body;
    if (!["checkIn", "checkOut"].includes(field)) return res.status(400).json({ error: "Choose check-in or check-out" });
    const requestedTime = toISTTimestamp(date, time);
    const day = requestedTime && istDayStart(requestedTime);
    const today = istDayStart();
    if (!requestedTime || !day || day >= today || today.getTime() - day.getTime() > 30 * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: "Choose a valid date within the past 30 days" });
    }
    const cleanReason = typeof reason === "string" ? reason.trim().slice(0, 500) : "";
    if (cleanReason.length < 5) return res.status(400).json({ error: "Please provide a reason (at least 5 characters)" });

    const employee = await Employee.findOne({ userId: req.session.userId });
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    let attendance = await Attendance.findOne({ employeeId: employee._id, date: day });
    if (!attendance) attendance = await Attendance.create({ employeeId: employee._id, date: day, status: "ABSENT" });
    if (field === "checkIn" ? attendance.checkIn : attendance.checkOut) {
      return res.status(409).json({ error: `This attendance record already has a ${field === "checkIn" ? "check-in" : "check-out"}` });
    }
    if (field === "checkOut" && !attendance.checkIn) return res.status(400).json({ error: "A check-in must exist before requesting a check-out" });
    const pending = await AttendanceCorrection.findOne({ attendanceId: attendance._id, field, status: "PENDING" });
    if (pending) return res.status(409).json({ error: "A correction for this time is already awaiting review" });

    const request = await AttendanceCorrection.create({ employeeId: employee._id, attendanceId: attendance._id, field, requestedTime, reason: cleanReason });
    return res.status(201).json({ success: true, data: request });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "A correction for this time is already awaiting review" });
    console.error("createCorrectionRequest error:", error);
    return res.status(500).json({ error: "Failed to submit correction request" });
  }
};

export const reviewCorrectionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote = "" } = req.body;
    if (!isValidObjectId(id)) return res.status(400).json({ error: "Invalid request ID" });
    if (!["APPROVED", "REJECTED"].includes(status)) return res.status(400).json({ error: "Choose approve or reject" });
    const request = await AttendanceCorrection.findOne({ _id: id, status: "PENDING" });
    if (!request) return res.status(404).json({ error: "Pending correction request not found" });

    if (status === "APPROVED") {
      const attendance = await Attendance.findOne({ _id: request.attendanceId, employeeId: request.employeeId });
      if (!attendance) return res.status(404).json({ error: "Attendance record not found" });
      if (attendance[request.field]) return res.status(409).json({ error: "The attendance time has already been recorded" });
      attendance[request.field] = request.requestedTime;
      if (request.field === "checkIn") {
        attendance.status = isLate(request.requestedTime) ? "LATE" : "PRESENT";
        if (attendance.checkOut) {
          const hours = (new Date(attendance.checkOut).getTime() - request.requestedTime.getTime()) / 3600000;
          if (hours < 0) return res.status(400).json({ error: "Requested check-in is after check-out" });
          attendance.workingHours = Number(hours.toFixed(2));
          attendance.dayType = computeDayType(attendance.workingHours);
        }
      } else {
        const hours = (request.requestedTime.getTime() - new Date(attendance.checkIn).getTime()) / 3600000;
        if (hours < 0) return res.status(400).json({ error: "Requested check-out is before check-in" });
        attendance.workingHours = Number(hours.toFixed(2));
        attendance.dayType = computeDayType(attendance.workingHours);
      }
      await attendance.save();
    }

    request.status = status;
    request.reviewedBy = req.session.userId;
    request.reviewedAt = new Date();
    request.reviewNote = typeof reviewNote === "string" ? reviewNote.trim().slice(0, 500) : "";
    await request.save();
    try {
      const employee = await Employee.findById(request.employeeId).select("email firstName").lean();
      if (employee?.email) {
        await sendAttendanceCorrectionStatusEmail(employee.email, employee.firstName, status, request.field, request.requestedTime, request.reviewNote);
      }
    } catch (emailError) {
      console.error("Failed to send attendance correction email:", emailError);
    }
    return res.json({ success: true, data: request });
  } catch (error) {
    console.error("reviewCorrectionRequest error:", error);
    return res.status(500).json({ error: "Failed to review correction request" });
  }
};
