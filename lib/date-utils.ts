import { format, getDaysInMonth, isBefore, parseISO } from "date-fns";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function getMonthKey(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, "0")}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return getMonthKey(now.getFullYear(), now.getMonth() + 1);
}

/** Day of month for today when `monthKey` is the current month, otherwise null. */
export function getTodayInMonth(monthKey: string): number | null {
  return monthKey === getCurrentMonthKey() ? new Date().getDate() : null;
}

export function isMonthPast(year: number, month: number): boolean {
  const now = new Date();
  const monthDate = new Date(year, month - 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth());

  return isBefore(monthDate, currentMonth);
}

export function formatMonthDisplay(year: number, month: number): string {
  return format(new Date(year, month - 1), "MMMM yyyy");
}

export function formatMonthName(month: number): string {
  return format(new Date(2000, month - 1, 1), "MMMM");
}

export function dayFromISO(date: string): number {
  const day = Number(date.slice(8, 10));
  return Number.isFinite(day) ? day : 1;
}

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

export function generateMonthKeys(startYear: number, endYear: number): string[] {
  const keys: string[] = [];

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      keys.push(getMonthKey(year, month));
    }
  }

  return keys;
}

export function getDaysInMonthForDate(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1));
}

/** Civil date `YYYY-MM-DD` (local calendar, no UTC shift). */
export function createISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
