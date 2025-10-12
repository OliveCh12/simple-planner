import { 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  format,
  differenceInDays,
  isSameMonth,
  parseISO,
  isAfter,
  isBefore,
  getDaysInMonth,
  addMonths,
  subMonths
} from 'date-fns';
import type { Objective } from '@/types';

/**
 * Generates a unique key for a month block.
 * Format: "YYYY-MM" for consistent indexing.
 */
export function getMonthKey(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Parses a month key back into year and month numbers.
 */
export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

/**
 * Gets the month key for today's date.
 */
export function getCurrentMonthKey(): string {
  const now = new Date();
  return getMonthKey(now.getFullYear(), now.getMonth() + 1);
}

/**
 * Determines if a given date falls within an objective's timeframe.
 * This is used for highlighting the current objective.
 */
export function isDateInObjectiveRange(
  date: Date,
  objective: Objective
): boolean {
  try {
    const start = parseISO(objective.startDate);
    const end = parseISO(objective.endDate);
    
    return isWithinInterval(date, { start, end });
  } catch {
    return false;
  }
}

/**
 * Calculates if an objective should be pinned to the top.
 * An objective is pinned if it spans the entire month.
 */
export function shouldPinObjective(
  objective: Objective,
  monthYear: number,
  monthNumber: number
): boolean {
  try {
    const start = parseISO(objective.startDate);
    const end = parseISO(objective.endDate);
    const monthStart = startOfMonth(new Date(monthYear, monthNumber - 1));
    const monthEnd = endOfMonth(new Date(monthYear, monthNumber - 1));
    
    return (
      isSameMonth(start, monthStart) &&
      isSameMonth(end, monthEnd) &&
      differenceInDays(end, start) >= 28
    );
  } catch {
    return false;
  }
}

/**
 * Sorts objectives chronologically within a month,
 * with pinned objectives always at the top.
 */
export function sortObjectivesInMonth(objectives: Objective[]): Objective[] {
  return [...objectives].sort((a, b) => {
    // Pinned objectives always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then sort by start date
    try {
      const dateA = parseISO(a.startDate);
      const dateB = parseISO(b.startDate);
      
      return dateA.getTime() - dateB.getTime();
    } catch {
      return 0;
    }
  });
}

/**
 * Checks if a month is in the past.
 */
export function isMonthPast(year: number, month: number): boolean {
  const now = new Date();
  const monthDate = new Date(year, month - 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth());
  
  return isBefore(monthDate, currentMonth);
}

/**
 * Checks if a month is the current month.
 */
export function isCurrentMonth(year: number, month: number): boolean {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month - 1;
}

/**
 * Checks if a month is in the future.
 */
export function isMonthFuture(year: number, month: number): boolean {
  const now = new Date();
  const monthDate = new Date(year, month - 1);
  const currentMonth = new Date(now.getFullYear(), now.getMonth());
  
  return isAfter(monthDate, currentMonth);
}

/**
 * Formats a month for display.
 */
export function formatMonthDisplay(year: number, month: number): string {
  const date = new Date(year, month - 1);
  return format(date, 'MMMM yyyy');
}

/**
 * Formats a date for display.
 */
export function formatDateDisplay(date: Date | string, formatString: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/**
 * Generates all month keys between start and end years.
 */
export function generateMonthKeys(startYear: number, endYear: number): string[] {
  const keys: string[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      keys.push(getMonthKey(year, month));
    }
  }
  
  return keys;
}

/**
 * Gets the number of days in a specific month.
 */
export function getDaysInMonthForDate(year: number, month: number): number {
  return getDaysInMonth(new Date(year, month - 1));
}

/**
 * Calculates the percentage of the month that has elapsed.
 */
export function getMonthProgress(year: number, month: number): number {
  if (!isCurrentMonth(year, month)) {
    return isMonthPast(year, month) ? 100 : 0;
  }
  
  const now = new Date();
  const monthStart = startOfMonth(new Date(year, month - 1));
  const daysElapsed = differenceInDays(now, monthStart) + 1;
  const totalDays = getDaysInMonth(new Date(year, month - 1));
  
  return Math.round((daysElapsed / totalDays) * 100);
}

/**
 * Gets the next month's key.
 */
export function getNextMonthKey(currentKey: string): string {
  const { year, month } = parseMonthKey(currentKey);
  const date = new Date(year, month - 1);
  const nextMonth = addMonths(date, 1);
  return getMonthKey(nextMonth.getFullYear(), nextMonth.getMonth() + 1);
}

/**
 * Gets the previous month's key.
 */
export function getPreviousMonthKey(currentKey: string): string {
  const { year, month } = parseMonthKey(currentKey);
  const date = new Date(year, month - 1);
  const prevMonth = subMonths(date, 1);
  return getMonthKey(prevMonth.getFullYear(), prevMonth.getMonth() + 1);
}

/**
 * Validates if a date string is valid ISO format.
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

/**
 * Creates an ISO date string for the start of a day.
 */
export function createISODate(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day).toISOString();
}
