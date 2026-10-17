import Holiday from "../models/Holiday.js";
import { istDayStart } from "./time.js";

/**
 * Loads a Set of IST day-start timestamps for holidays in the given date range (inclusive).
 * @param {Date|string} start 
 * @param {Date|string} end 
 * @returns {Promise<Set<number>>}
 */
export const loadHolidaySet = async (start, end) => {
  if (!start || !end) return new Set();
  const s = istDayStart(start);
  const e = istDayStart(end);
  const minDate = s < e ? s : e;
  const maxDate = s < e ? e : s;

  const holidays = await Holiday.find({
    date: { $gte: minDate, $lte: maxDate },
  }).select("date name").lean();

  return new Set(holidays.map((h) => istDayStart(h.date).getTime()));
};

export default {
  loadHolidaySet,
};
