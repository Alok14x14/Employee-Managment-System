import mongoose from "mongoose";

const attendanceCorrectionSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance", required: true },
  field: { type: String, enum: ["checkIn", "checkOut"], required: true },
  requestedTime: { type: Date, required: true },
  reason: { type: String, required: true, maxlength: 500 },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  reviewNote: { type: String, maxlength: 500, default: "" },
}, { timestamps: true });

attendanceCorrectionSchema.index({ employeeId: 1, createdAt: -1 });
attendanceCorrectionSchema.index({ status: 1, createdAt: -1 });
attendanceCorrectionSchema.index({ attendanceId: 1, field: 1, status: 1 });
attendanceCorrectionSchema.index({ attendanceId: 1, field: 1 }, { unique: true, partialFilterExpression: { status: "PENDING" } });

const AttendanceCorrection = mongoose.models.AttendanceCorrection || mongoose.model("AttendanceCorrection", attendanceCorrectionSchema);
export default AttendanceCorrection;
