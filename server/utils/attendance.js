import { istDayEnd } from "./time.js";

/**
 * Computes dayType based on working hours.
 * >= 8 hrs: "Full Day"
 * >= 6 hrs: "Three Quarter Day"
 * >= 4 hrs: "Half Day"
 * < 4 hrs:  "Short Day"
 *
 * @param {number} workingHours
 * @returns {string}
 */
export const computeDayType = (workingHours) => {
  if (workingHours >= 8) return "Full Day";
  if (workingHours >= 6) return "Three Quarter Day";
  if (workingHours >= 4) return "Half Day";
  return "Short Day";
};

/**
 * Computes checkout details for auto-checkout without penalizing
 * the employee with a flat half-day.
 * Awards Full Day, Three Quarter Day, Half Day, or Short Day
 * based on the time difference between check-in and auto-checkout time.
 *
 * @param {Date|string} checkIn
 * @param {Date} [currentTime=new Date()]
 * @param {Date|string} [recordDate=null]
 * @returns {{ checkOut: Date, workingHours: number, dayType: string, autoCheckedOut: boolean }}
 */
export const calculateAutoCheckOutDetails = (checkIn, currentTime = new Date(), recordDate = null) => {
  const checkInTime = new Date(checkIn);
  const now = currentTime instanceof Date ? currentTime : new Date(currentTime);

  let targetCheckOutTime = now;

  // Determine end of the target shift day in IST
  const targetDayEnd = istDayEnd(recordDate || checkInTime);

  // If calculating after the shift date has passed (e.g. retroactive auto-close):
  if (now.getTime() > targetDayEnd.getTime()) {
    // Normal auto-checkout occurs 10 hours after check-in, capped at the end of that day (23:59:59.999)
    const expectedAutoCheckOutMs = checkInTime.getTime() + 10 * 60 * 60 * 1000;
    const cappedMs = Math.min(expectedAutoCheckOutMs, targetDayEnd.getTime() - 1000);
    targetCheckOutTime = new Date(cappedMs);
  } else {
    // If running within the day, do not exceed end of day
    if (targetCheckOutTime.getTime() > targetDayEnd.getTime()) {
      targetCheckOutTime = new Date(targetDayEnd.getTime() - 1000);
    }
  }

  // Ensure checkout is never earlier than checkin
  if (targetCheckOutTime.getTime() < checkInTime.getTime()) {
    targetCheckOutTime = checkInTime;
  }

  const diffMs = targetCheckOutTime.getTime() - checkInTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const workingHours = parseFloat(diffHours.toFixed(2));
  const dayType = computeDayType(workingHours);

  return {
    checkOut: targetCheckOutTime,
    workingHours,
    dayType,
    autoCheckedOut: true,
  };
};
