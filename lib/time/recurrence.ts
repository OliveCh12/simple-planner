import { addDays, addMonths, addWeeks, addYears, startOfDay } from "date-fns";
import { formatLocal, intervalOf, isAllDay, parseLocal } from "@/lib/time/local";
import type { LocalDateTime } from "@/types";

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";

const WEEKDAYS: Weekday[] = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const FREQS: Frequency[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
const DEFAULT_LIMIT = 1000;

export interface RecurrenceRule {
  freq: Frequency;
  interval: number;
  byDay?: Weekday[];
  byMonthDay?: number[];
  count?: number;
  /** Exclusive local instant. Date-only UNTIL is the next midnight. */
  until?: Date;
}

export interface Occurrence {
  start: LocalDateTime;
  end?: LocalDateTime;
}

export class RecurrenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecurrenceError";
  }
}

function weekdayOf(date: Date): Weekday {
  return WEEKDAYS[date.getDay()]!;
}

function parseUntil(value: string): Date {
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, y, m, d] = dateOnly.map(Number);
    return new Date(y, m - 1, d + 1);
  }
  const local = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (local) {
    const [, y, m, d, h, min, s] = local.map(Number);
    return new Date(y, m - 1, d, h, min, s);
  }
  const utc = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (utc) {
    const [, y, m, d, h, min, s] = utc.map(Number);
    return new Date(Date.UTC(y, m - 1, d, h, min, s));
  }
  throw new RecurrenceError(`Invalid UNTIL value: ${value}`);
}

export function parseRRule(body: string): RecurrenceRule {
  const parts = body.split(";").filter(Boolean);
  const map = new Map<string, string>();
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq <= 0) throw new RecurrenceError(`Invalid RRULE part: ${part}`);
    map.set(part.slice(0, eq).toUpperCase(), part.slice(eq + 1));
  }

  const freqRaw = map.get("FREQ");
  if (!freqRaw || !FREQS.includes(freqRaw as Frequency)) {
    throw new RecurrenceError("RRULE requires FREQ=DAILY|WEEKLY|MONTHLY|YEARLY");
  }

  const rule: RecurrenceRule = {
    freq: freqRaw as Frequency,
    interval: 1,
  };

  const intervalRaw = map.get("INTERVAL");
  if (intervalRaw !== undefined) {
    const interval = Number(intervalRaw);
    if (!Number.isInteger(interval) || interval < 1) {
      throw new RecurrenceError(`Invalid INTERVAL: ${intervalRaw}`);
    }
    rule.interval = interval;
  }

  const byDayRaw = map.get("BYDAY");
  if (byDayRaw) {
    const days = byDayRaw.split(",").map((token) => token.trim().slice(-2)) as Weekday[];
    if (days.some((day) => !WEEKDAYS.includes(day))) {
      throw new RecurrenceError(`Invalid BYDAY: ${byDayRaw}`);
    }
    rule.byDay = days;
  }

  const byMonthDayRaw = map.get("BYMONTHDAY");
  if (byMonthDayRaw) {
    const days = byMonthDayRaw.split(",").map(Number);
    if (days.some((day) => !Number.isInteger(day) || day === 0 || day < -31 || day > 31)) {
      throw new RecurrenceError(`Invalid BYMONTHDAY: ${byMonthDayRaw}`);
    }
    rule.byMonthDay = days;
  }

  const countRaw = map.get("COUNT");
  if (countRaw !== undefined) {
    const count = Number(countRaw);
    if (!Number.isInteger(count) || count < 1) {
      throw new RecurrenceError(`Invalid COUNT: ${countRaw}`);
    }
    rule.count = count;
  }

  const untilRaw = map.get("UNTIL");
  if (untilRaw) rule.until = parseUntil(untilRaw);

  return rule;
}

function occurrenceEnd(start: LocalDateTime, template: { start: LocalDateTime; end?: LocalDateTime }): LocalDateTime | undefined {
  if (template.end === undefined) return undefined;
  const delta = parseLocal(template.end).getTime() - parseLocal(template.start).getTime();
  return formatLocal(new Date(parseLocal(start).getTime() + delta), isAllDay(template.end));
}

function inUntil(start: Date, until?: Date): boolean {
  return until === undefined || start < until;
}

function monthDay(date: Date, day: number): Date | null {
  if (day > 0) {
    const next = new Date(date.getFullYear(), date.getMonth(), day);
    if (next.getMonth() !== date.getMonth()) return null;
    return next;
  }
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const next = new Date(date.getFullYear(), date.getMonth(), last.getDate() + day + 1);
  if (next.getMonth() !== date.getMonth()) return null;
  return next;
}

function copyTime(from: Date, to: Date): Date {
  return new Date(
    to.getFullYear(),
    to.getMonth(),
    to.getDate(),
    from.getHours(),
    from.getMinutes(),
    from.getSeconds(),
    from.getMilliseconds()
  );
}

/**
 * Expand a recurring item into occurrences that intersect `[rangeStart, rangeEnd)`.
 * The original `start` is always the first candidate (RFC 5545 DTSTART).
 */
export function expandRecurrence(
  item: { start: LocalDateTime; end?: LocalDateTime; recurrence?: string; recurrenceExceptions?: LocalDateTime[] },
  range: { start: Date; end: Date },
  limit = DEFAULT_LIMIT
): Occurrence[] {
  if (!item.recurrence) {
    const interval = intervalOf(item);
    if (interval.end <= range.start || interval.start >= range.end) return [];
    return item.end === undefined ? [{ start: item.start }] : [{ start: item.start, end: item.end }];
  }

  const rule = parseRRule(item.recurrence);
  const exceptions = new Set(item.recurrenceExceptions ?? []);
  const dtstart = parseLocal(item.start);
  const allDay = isAllDay(item.start);
  const out: Occurrence[] = [];
  let generated = 0;

  const emit = (date: Date) => {
    if (date < dtstart && date.getTime() !== dtstart.getTime()) return false;
    if (!inUntil(date, rule.until)) return false;
    generated += 1;
    if (rule.count !== undefined && generated > rule.count) return true;
    const start = formatLocal(date, allDay);
    if (exceptions.has(start)) return false;
    const end = occurrenceEnd(start, item);
    const interval = intervalOf({ start, end });
    if (interval.end > range.start && interval.start < range.end) {
      out.push(end === undefined ? { start } : { start, end });
    }
    return false;
  };

  const stop = (date: Date) => {
    if (generated >= limit) return true;
    if (rule.count !== undefined && generated >= rule.count) return true;
    if (rule.until && date >= rule.until) return true;
    if (date >= range.end) return true;
    return false;
  };

  if (rule.freq === "DAILY") {
    let cursor = dtstart;
    while (!stop(cursor)) {
      if (emit(cursor)) break;
      cursor = addDays(cursor, rule.interval);
    }
    return out;
  }

  if (rule.freq === "WEEKLY") {
    const days = [...(rule.byDay ?? [weekdayOf(dtstart)])].sort(
      (a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b)
    );
    let weekStart = addDays(startOfDay(dtstart), -dtstart.getDay());
    while (!stop(weekStart)) {
      for (const day of days) {
        const occurrence = copyTime(dtstart, addDays(weekStart, WEEKDAYS.indexOf(day)));
        if (occurrence < dtstart) continue;
        if (emit(occurrence)) return out;
      }
      weekStart = addWeeks(weekStart, rule.interval);
    }
    return out;
  }

  if (rule.freq === "MONTHLY") {
    let month = new Date(dtstart.getFullYear(), dtstart.getMonth(), 1);
    while (!stop(month)) {
      const days = rule.byMonthDay ?? [dtstart.getDate()];
      for (const day of days) {
        const base = monthDay(month, day);
        if (!base) continue;
        const occurrence = copyTime(dtstart, base);
        if (occurrence < dtstart) continue;
        if (emit(occurrence)) return out;
      }
      month = addMonths(month, rule.interval);
    }
    return out;
  }

  let year = new Date(dtstart.getFullYear(), 0, 1);
  while (!stop(year)) {
    const days = rule.byMonthDay ?? [dtstart.getDate()];
    for (const day of days) {
      const base = monthDay(new Date(year.getFullYear(), dtstart.getMonth(), 1), day);
      if (!base) continue;
      const occurrence = copyTime(dtstart, base);
      if (occurrence < dtstart) continue;
      if (emit(occurrence)) return out;
    }
    year = addYears(year, rule.interval);
  }
  return out;
}
