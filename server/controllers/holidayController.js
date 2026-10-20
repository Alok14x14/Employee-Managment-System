import Holiday from "../models/Holiday.js";
import { istDayStart, istParts } from "../utils/time.js";
import { isValidObjectId, parseDate } from "../utils/validate.js";
import Employee from "../models/Employee.js";
import { sendHolidayAnnouncementEmail } from "../utils/emailService.js";

// GET /api/holidays?year=YYYY
export const getHolidays = async (req, res) => {
  try {
    const rawYear = req.query.year;
    let year = parseInt(rawYear, 10);
    if (isNaN(year) || year < 1970 || year > 2100) {
      year = parseInt(istParts().year, 10);
    }

    const yearStart = new Date(`${year}-01-01T00:00:00+05:30`);
    const yearEnd = new Date(`${year}-12-31T23:59:59.999+05:30`);

    const where = {
      date: { $gte: yearStart, $lte: yearEnd },
    };
    if (req.query.search?.trim()) {
      where.name = { $regex: req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }
    const paginated = req.query.page !== undefined || req.query.limit !== undefined;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const total = paginated ? await Holiday.countDocuments(where) : null;
    let query = Holiday.find(where).sort({ date: 1 });
    if (paginated) query = query.skip((page - 1) * limit).limit(limit);
    const holidays = await query.lean();

    const data = holidays.map((h) => ({
      ...h,
      id: h._id.toString(),
    }));

    return res.json(paginated ? { success: true, year, data, total, page, limit, totalPages: Math.ceil(total / limit) } : { success: true, year, data });
  } catch (error) {
    console.error("getHolidays error:", error);
    return res.status(500).json({ error: "Failed to fetch holidays" });
  }
};

// POST /api/holidays
export const createHoliday = async (req, res) => {
  try {
    const { date, name } = req.body;
    if (!date || !name) {
      return res.status(400).json({ error: "Date and holiday name are required" });
    }

    const trimmedName = typeof name === "string" ? name.trim().slice(0, 100) : "";
    if (!trimmedName) {
      return res.status(400).json({ error: "Holiday name cannot be empty" });
    }

    const parsedDate = parseDate(date);
    if (!parsedDate) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const normalizedDate = istDayStart(parsedDate);

    // Check duplicate date
    const existing = await Holiday.findOne({ date: normalizedDate });
    if (existing) {
      return res.status(409).json({ error: "A holiday is already scheduled on this date" });
    }

    const holiday = await Holiday.create({
      date: normalizedDate,
      name: trimmedName,
      createdBy: req.session?.userId,
    });

    const employees = await Employee.find({ isDeleted: { $ne: true } }).populate("userId", "role").lean();
    const emailResults = await Promise.allSettled(employees
      .filter((employee) => employee.email && employee.userId?.role !== "ADMIN")
      .map((employee) => sendHolidayAnnouncementEmail(employee.email, employee.firstName, trimmedName, normalizedDate)));
    const failedEmails = emailResults.filter((result) => result.status === "rejected").length;
    if (failedEmails) console.error(`Failed to email ${failedEmails} holiday announcement recipient(s)`);

    return res.status(201).json({
      success: true,
      data: {
        ...holiday.toObject(),
        id: holiday._id.toString(),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "A holiday is already scheduled on this date" });
    }
    console.error("createHoliday error:", error);
    return res.status(500).json({ error: "Failed to create holiday" });
  }
};

// DELETE /api/holidays/:id
export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid holiday ID" });
    }

    const holiday = await Holiday.findByIdAndDelete(id);
    if (!holiday) {
      return res.status(404).json({ error: "Holiday not found" });
    }

    return res.json({ success: true, message: "Holiday removed successfully" });
  } catch (error) {
    console.error("deleteHoliday error:", error);
    return res.status(500).json({ error: "Failed to delete holiday" });
  }
};
