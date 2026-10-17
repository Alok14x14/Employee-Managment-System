// server/utils/time.js
const TZ = "Asia/Kolkata";

export const istParts = (d = new Date()) =>
  Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value])
  );

export const istDayStart = (d = new Date()) => {
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return new Date(`${d}T00:00:00+05:30`);
  }
  const dateObj = d instanceof Date ? d : new Date(d);
  const { year, month, day } = istParts(dateObj);
  return new Date(`${year}-${month}-${day}T00:00:00+05:30`);
};

export const istDayEnd = (d = new Date()) => {
  return new Date(istDayStart(d).getTime() + 24 * 60 * 60 * 1000);
};

export const isLate = (d = new Date()) => {
  const { hour, minute } = istParts(d);
  return +hour > 9 || (+hour === 9 && +minute > 0);
};

export const isWeekend = (d = new Date()) => {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(d);
  return weekday === "Sat" || weekday === "Sun";
};

export const isHoliday = (d = new Date(), holidaySet) => {
  if (!holidaySet || typeof holidaySet.has !== "function") return false;
  return holidaySet.has(istDayStart(d).getTime());
};

export default {
  TZ,
  istParts,
  istDayStart,
  istDayEnd,
  isLate,
  isWeekend,
  isHoliday,
};
