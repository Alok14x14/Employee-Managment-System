import { format } from "date-fns";

export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export const formatDate = (date, formatStr = "dd MMM yyyy") => {
  if (!date) return "—";
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    return format(d, formatStr);
  } catch {
    return "—";
  }
};

export const formatTime = (date, formatStr = "hh:mm a") => {
  if (!date) return "—";
  try {
    const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    return format(d, formatStr);
  } catch {
    return "—";
  }
};
