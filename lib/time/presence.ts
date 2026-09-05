import { addDays, startOfDay, startOfMonth } from "date-fns";
import { intervalOf, isAllDay, parseLocal, type Interval } from "@/lib/time/local";

/** Visible range includes this instant (half-open `[start, end)`). */
export function containsNow(range: Interval, now: Date): boolean {
  return now >= range.start && now < range.end;
}

export function isElapsedDay(day: Date, now: Date): boolean {
  return startOfDay(day) < startOfDay(now);
}

export function isElapsedMonth(month: Date, now: Date): boolean {
  return startOfMonth(month) < startOfMonth(now);
}

export function isElapsedInterval(interval: Interval, now: Date): boolean {
  return interval.end <= now;
}

export function isElapsedOccurrence(
  occurrence: { start: string; end?: string },
  now: Date
): boolean {
  if (isAllDay(occurrence.start)) {
    const last = parseLocal((occurrence.end ?? occurrence.start).slice(0, 10));
    return addDays(last, 1) <= now;
  }
  return isElapsedInterval(intervalOf(occurrence), now);
}
