import mongoose from "mongoose";

const employeeDocumentSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null, index: true },
  audience: { type: String, enum: ["EMPLOYEE", "ALL"], default: "EMPLOYEE", index: true },
  category: { type: String, enum: ["OFFER_LETTER", "TAX_FORM", "POLICY", "OTHER"], required: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  fileName: { type: String, required: true, maxlength: 180 },
  fileSize: { type: Number, required: true },
  content: { type: Buffer, required: true, select: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

employeeDocumentSchema.index({ employeeId: 1, createdAt: -1 });
employeeDocumentSchema.index({ audience: 1, category: 1, createdAt: -1 });

const EmployeeDocument = mongoose.models.EmployeeDocument || mongoose.model("EmployeeDocument", employeeDocumentSchema);
export default EmployeeDocument;
