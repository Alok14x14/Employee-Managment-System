import Employee from "../models/Employee.js";
import EmployeeDocument from "../models/EmployeeDocument.js";
import { isValidObjectId } from "../utils/validate.js";
import { sendDocumentAvailableEmail } from "../utils/emailService.js";

const allowedCategories = ["OFFER_LETTER", "TAX_FORM", "POLICY", "OTHER"];

export const listDocuments = async (req, res) => {
  try {
    const isAdmin = req.session.role === "ADMIN";
    const employee = isAdmin ? null : await Employee.findOne({ userId: req.session.userId }).select("_id").lean();
    if (!isAdmin && !employee) return res.status(404).json({ error: "Employee not found" });
    const filter = isAdmin
      ? (req.query.employeeId && isValidObjectId(req.query.employeeId) ? { $or: [{ audience: "ALL" }, { employeeId: req.query.employeeId }] } : {})
      : { $or: [{ audience: "ALL" }, { employeeId: employee._id }] };
    const documents = await EmployeeDocument.find(filter).select("-content").populate("employeeId", "firstName lastName email").sort({ createdAt: -1 }).lean();
    return res.json({ data: documents.map((document) => ({ ...document, id: document._id.toString() })) });
  } catch (error) {
    console.error("listDocuments error:", error);
    return res.status(500).json({ error: "Failed to fetch documents" });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Select a PDF to upload" });
    if (req.file.size > 5 * 1024 * 1024) return res.status(413).json({ error: "PDF files must be 5 MB or smaller" });
    if (req.file.mimetype !== "application/pdf" || req.file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
      return res.status(415).json({ error: "Only valid PDF files are supported" });
    }
    const { title, category, employeeId } = req.body;
    const cleanTitle = typeof title === "string" ? title.trim().slice(0, 120) : "";
    if (!cleanTitle || !allowedCategories.includes(category)) return res.status(400).json({ error: "Enter a title and valid document category" });

    let employee = null;
    let audience = "EMPLOYEE";
    if (employeeId === "ALL") {
      if (category !== "POLICY") return res.status(400).json({ error: "Only company policies can be shared with everyone" });
      audience = "ALL";
    } else {
      if (!isValidObjectId(employeeId)) return res.status(400).json({ error: "Choose an employee" });
      employee = await Employee.findOne({ _id: employeeId, isDeleted: { $ne: true } }).select("_id");
      if (!employee) return res.status(404).json({ error: "Active employee not found" });
    }

    const fileName = (req.file.originalname || "document.pdf").replace(/[\\/\r\n\u0000-\u001f]/g, "_").slice(-180);
    const document = await EmployeeDocument.create({
      employeeId: employee?._id || null,
      audience,
      category,
      title: cleanTitle,
      fileName: fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`,
      fileSize: req.file.size,
      content: req.file.buffer,
      uploadedBy: req.session.userId,
    });
    const recipients = audience === "ALL"
      ? await Employee.find({ isDeleted: { $ne: true } }).populate("userId", "role").lean()
      : [employee.toObject()];
    const emailResults = await Promise.allSettled(recipients
      .filter((recipient) => recipient.email && recipient.userId?.role !== "ADMIN")
      .map((recipient) => sendDocumentAvailableEmail(recipient.email, recipient.firstName, cleanTitle, category)));
    const failedEmails = emailResults.filter((result) => result.status === "rejected").length;
    if (failedEmails) console.error(`Failed to email ${failedEmails} document recipient(s)`);
    return res.status(201).json({ success: true, data: { id: document._id, title: document.title } });
  } catch (error) {
    console.error("uploadDocument error:", error);
    return res.status(500).json({ error: "Failed to upload document" });
  }
};

const canAccessDocument = async (req, document) => {
  if (req.session.role === "ADMIN") return true;
  if (document.audience === "ALL") return true;
  const employee = await Employee.findOne({ userId: req.session.userId }).select("_id").lean();
  return Boolean(employee && document.employeeId?.toString() === employee._id.toString());
};

export const getDocumentContent = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid document ID" });
    // Hydrate the document so Mongoose converts the BSON binary field back to a Node Buffer.
    const document = await EmployeeDocument.findById(req.params.id).select("+content fileName audience employeeId");
    if (!document) return res.status(404).json({ error: "Document not found" });
    if (!await canAccessDocument(req, document)) return res.status(404).json({ error: "Document not found" });
    const safeName = document.fileName.replace(/[^a-zA-Z0-9._ -]/g, "_");
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `${req.query.download === "1" ? "attachment" : "inline"}; filename="${safeName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    return res.send(document.content);
  } catch (error) {
    console.error("getDocumentContent error:", error);
    return res.status(500).json({ error: "Failed to retrieve document" });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid document ID" });
    const document = await EmployeeDocument.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ error: "Document not found" });
    return res.json({ success: true });
  } catch (error) {
    console.error("deleteDocument error:", error);
    return res.status(500).json({ error: "Failed to delete document" });
  }
};
