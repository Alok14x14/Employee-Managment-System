import { istDayStart, istParts, isWeekend, isHoliday } from "./time.js";

/**
 * Counts working days (excluding weekends and holidays) in an inclusive date range.
 * Incoming dates are normalized to IST day start.
 * 
 * @param {Date|string} start 
 * @param {Date|string} end 
 * @param {Set<number>} holidaySet - Set of IST day-start timestamps
 * @returns {number}
 */
export const countWorkingDays = (start, end, holidaySet) => {
  if (!start || !end) return 0;
  let cur = istDayStart(start);
  const targetEnd = istDayStart(end);
  if (cur.getTime() > targetEnd.getTime()) return 0;

  let count = 0;
  while (cur.getTime() <= targetEnd.getTime()) {
    if (!isWeekend(cur) && !isHoliday(cur, holidaySet)) {
      count++;
    }
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return count;
};

/**
 * Splits working days by calendar year so leaves crossing Dec 31 -> Jan 1
 * are charged to each respective year's quota.
 * 
 * @param {Date|string} start 
 * @param {Date|string} end 
 * @param {Set<number>} holidaySet - Set of IST day-start timestamps
 * @returns {Record<string, number>} - e.g. { "2026": 2, "2027": 1 }
 */
export const splitDaysByYear = (start, end, holidaySet) => {
  if (!start || !end) return {};
  let cur = istDayStart(start);
  const targetEnd = istDayStart(end);
  if (cur.getTime() > targetEnd.getTime()) return {};

  const result = {};
  while (cur.getTime() <= targetEnd.getTime()) {
    if (!isWeekend(cur) && !isHoliday(cur, holidaySet)) {
      const year = istParts(cur).year;
      result[year] = (result[year] || 0) + 1;
    }
    cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
  }
  return result;
};

export default {
  countWorkingDays,
  splitDaysByYear,
};
