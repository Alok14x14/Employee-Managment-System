export function getWorkingHoursDisplay(record) {
  if (record?.workingHours != null && record.workingHours > 0) {
    const hrs = Math.floor(record.workingHours);
    const mins = Math.round((record.workingHours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  }
  // If still checked in (no checkout), compute live hours only if it's for today
  if (record?.checkIn && !record?.checkOut) {
    const recordDate = new Date(record.date || record.checkIn);
    const now = new Date();
    const isRecordToday =
      recordDate.getFullYear() === now.getFullYear() &&
      recordDate.getMonth() === now.getMonth() &&
      recordDate.getDate() === now.getDate();

    if (isRecordToday) {
      const diffMs = Date.now() - new Date(record.checkIn).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const hrs = Math.floor(diffHours);
      const mins = Math.round((diffHours - hrs) * 60);
      return `${hrs}h ${mins}m (ongoing)`;
    }
    return "Not checked out";
  }
  return "—";
}

export function getDayTypeDisplay(record) {
  if (record?.dayType) {
    const map = {
      "Full Day": "badge-success",
      "Three Quarter Day": "badge-accent",
      "Half Day": "badge-warning",
      "Short Day": "badge-danger",
    };
    return {
      label: record.dayType,
      className: map[record.dayType] || "badge-accent",
    };
  }
  if (record?.checkIn && !record?.checkOut) {
    const recordDate = new Date(record.date || record.checkIn);
    const now = new Date();
    const isRecordToday =
      recordDate.getFullYear() === now.getFullYear() &&
      recordDate.getMonth() === now.getMonth() &&
      recordDate.getDate() === now.getDate();

    return {
      label: isRecordToday ? "In Progress" : "Unclosed",
      className: isRecordToday ? "badge-accent" : "badge-warning",
    };
  }
  return { label: "—", className: "" };
}
