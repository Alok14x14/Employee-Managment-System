import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    // Kept only for legacy records; new authenticated events resolve email from actorId.
    actorEmail: { type: String, default: null, trim: true },
    attemptedEmail: { type: String, default: null, trim: true },
    action: { type: String, required: true, trim: true },
    resource: { type: String, required: true, trim: true },
    resourceId: { type: String, default: null, trim: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    outcome: { type: String, enum: ["SUCCESS", "FAILED"], default: "SUCCESS", index: true },
    statusCode: { type: Number, default: null },
    ip: { type: String, default: "", maxlength: 100 },
    userAgent: { type: String, default: "", maxlength: 500 },
    method: { type: String, required: true },
    path: { type: String, required: true },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
    demoKey: { type: String, default: undefined },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorEmail: 1 });
auditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
auditLogSchema.index({ demoKey: 1 }, { unique: true, sparse: true });

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
