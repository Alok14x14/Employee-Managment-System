import Announcement from "../models/Announcement.js";
import Employee from "../models/Employee.js";
import { isValidObjectId } from "../utils/validate.js";
import { sendAnnouncementEmail } from "../utils/emailService.js";

export const listAnnouncements = async (req, res) => {
  try {
    const filter = req.session.role === "ADMIN"
      ? {}
      : { $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }] };
    const paginated = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const total = paginated ? await Announcement.countDocuments(filter) : null;
    let query = Announcement.find(filter).sort({ createdAt: -1 });
    if (paginated) query = query.skip((page - 1) * limit).limit(limit);
    else query = query.limit(200);
    const announcements = await query.lean();
    const data = announcements.map((announcement) => ({ ...announcement, id: announcement._id.toString() }));
    return res.json(paginated ? { data, total, page, limit, totalPages: Math.ceil(total / limit) } : { data });
  } catch (error) {
    console.error("listAnnouncements error:", error);
    return res.status(500).json({ error: "Failed to fetch announcements" });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const title = typeof req.body.title === "string" ? req.body.title.trim().slice(0, 140) : "";
    const message = typeof req.body.message === "string" ? req.body.message.trim().slice(0, 4000) : "";
    if (title.length < 3 || message.length < 5) return res.status(400).json({ error: "Enter a title and announcement message" });

    let expiresAt = null;
    if (req.body.expiresAt) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.expiresAt)) return res.status(400).json({ error: "Expiration date is invalid" });
      expiresAt = new Date(`${req.body.expiresAt}T23:59:59.999+05:30`);
      if (Number.isNaN(expiresAt.getTime()) || expiresAt < new Date()) return res.status(400).json({ error: "Expiration date must be today or later" });
    }

    const announcement = await Announcement.create({ title, message, expiresAt, createdBy: req.session.userId });
    const employees = await Employee.find({ isDeleted: { $ne: true }, employmentStatus: "ACTIVE" }).populate("userId", "role").lean();
    const emailResults = await Promise.allSettled(employees
      .filter((employee) => employee.email && employee.userId?.role !== "ADMIN")
      .map((employee) => sendAnnouncementEmail(employee.email, employee.firstName, title, message)));
    const failedEmails = emailResults.filter((result) => result.status === "rejected").length;
    if (failedEmails) console.error(`Failed to email ${failedEmails} announcement recipient(s)`);

    return res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error("createAnnouncement error:", error);
    return res.status(500).json({ error: "Failed to publish announcement" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid announcement ID" });
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Announcement not found" });
    return res.json({ success: true });
  } catch (error) {
    console.error("deleteAnnouncement error:", error);
    return res.status(500).json({ error: "Failed to delete announcement" });
  }
};
