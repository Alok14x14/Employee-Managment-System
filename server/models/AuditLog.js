import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    actorEmail: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    resourceId: { type: String, default: null, trim: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
