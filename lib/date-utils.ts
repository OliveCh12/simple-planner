import { format, getDaysInMonth, parseISO } from "date-fns";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  if (DATE_ONLY.test(date)) {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return parseISO(date);
}

export function formatDateDisplay(
  date: Date | string,
  formatString: string = "MMM d, yyyy"
): string {
  return format(toDate(date), formatString);
}

export function getDaysInMonthForDate(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1));
}

/** Civil date `YYYY-MM-DD` (local calendar, no UTC shift). */
export function createISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
