import Holiday from "../models/Holiday.js";
import { istDayStart, istParts } from "../utils/time.js";
import { isValidObjectId, parseDate } from "../utils/validate.js";

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

    const holidays = await Holiday.find({
      date: { $gte: yearStart, $lte: yearEnd },
    })
      .sort({ date: 1 })
      .lean();

    const data = holidays.map((h) => ({
      ...h,
      id: h._id.toString(),
    }));

    return res.json({ success: true, year, data });
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
