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
  const { year, month, day } = istParts(d);
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

export default {
  TZ,
  istParts,
  istDayStart,
  istDayEnd,
  isLate,
  isWeekend,
};
