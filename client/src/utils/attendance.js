export function getWorkingHoursDisplay(record) {
  if (record?.workingHours != null && record.workingHours > 0) {
    const hrs = Math.floor(record.workingHours);
    const mins = Math.round((record.workingHours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  }
  // If still checked in (no checkout), compute live hours
  if (record?.checkIn && !record?.checkOut) {
    const diffMs = Date.now() - new Date(record.checkIn).getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const hrs = Math.floor(diffHours);
    const mins = Math.round((diffHours - hrs) * 60);
    return `${hrs}h ${mins}m (ongoing)`;
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
    return { label: "In Progress", className: "badge-accent" };
  }
  return { label: "—", className: "" };
}
