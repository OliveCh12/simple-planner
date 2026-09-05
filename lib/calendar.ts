import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { compareByTime, isScheduled } from "@/lib/domain/items";
import { expandRecurrence } from "@/lib/time/recurrence";
import { formatLocalDate, intervalOf, intersects, isAllDay, parseLocal, type Interval } from "@/lib/time/local";
import type { Category, ItemKind, ItemStatus, LocalDateTime, PlanItem, TimeScale } from "@/types";

export interface PackedSpan {
  id: string;
  lane: number;
  /** 0–1 within the range. */
  startFrac: number;
  /** 0–1 within the range, exclusive. */
  endFrac: number;
}

export interface PackedRange {
  spans: PackedSpan[];
  laneCount: number;
}

const MIN_FRAC = 0.02;

/**
 * Packs intervals that intersect `[range.start, range.end)` into lanes,
 * with positions as fractions of the range. Used by the calendar views.
 */
export function packInRange(
  items: { id: string; interval: Interval }[],
  range: Interval
): PackedRange {
  const spanMs = range.end.getTime() - range.start.getTime();
  if (spanMs <= 0) return { spans: [], laneCount: 0 };

  const clipped: PackedSpan[] = [];
  for (const item of items) {
    const start = Math.max(item.interval.start.getTime(), range.start.getTime());
    const end = Math.min(item.interval.end.getTime(), range.end.getTime());
    if (end <= start) continue;
    const startFrac = (start - range.start.getTime()) / spanMs;
    const endFrac = Math.max(startFrac + MIN_FRAC, (end - range.start.getTime()) / spanMs);
    clipped.push({
      id: item.id,
      lane: 0,
      startFrac,
      endFrac: Math.min(1, endFrac),
    });
  }

  clipped.sort((a, b) => {
    const byStart = a.startFrac - b.startFrac;
    if (byStart !== 0) return byStart;
    const byDur = b.endFrac - b.startFrac - (a.endFrac - a.startFrac);
    if (byDur !== 0) return byDur;
    return a.id.localeCompare(b.id);
  });

  const laneEnds: number[] = [];
  for (const span of clipped) {
    let lane = laneEnds.findIndex((end) => end <= span.startFrac + 1e-9);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(span.endFrac);
    } else {
      laneEnds[lane] = span.endFrac;
    }
    span.lane = lane;
  }

  return { spans: clipped, laneCount: laneEnds.length };
}

export interface CalendarOccurrence {
  id: string;
  itemId: string;
  title: string;
  kind: ItemKind;
  status: ItemStatus;
  categoryId?: string;
  categoryColor?: string;
  start: LocalDateTime;
  end?: LocalDateTime;
  allDay: boolean;
  /** A deadline marker for a task or project, not the work itself. */
  due?: boolean;
}

export const DUE_SUFFIX = "::due";

export function isDueOccurrenceId(occurrenceId: string): boolean {
  return occurrenceId.endsWith(DUE_SUFFIX);
}

export function isCalendarActive(status: ItemStatus): boolean {
  return status !== "completed" && status !== "cancelled";
}

export function occurrenceInterval(occurrence: Pick<CalendarOccurrence, "start" | "end">): Interval {
  return intervalOf({ start: occurrence.start, end: occurrence.end });
}

export function occurrencesInRange(
  items: PlanItem[],
  range: Interval,
  categories: Category[] = []
): CalendarOccurrence[] {
  const colorById = new Map(categories.map((category) => [category.id, category.color]));
  const out: CalendarOccurrence[] = [];

  for (const item of items) {
    // Deadlines show as a marker on their day, whatever the work is scheduled for.
    if (item.due && item.kind !== "event" && intersects(intervalOf({ start: item.due }), range)) {
      const marker: CalendarOccurrence = {
        id: `${item.id}${DUE_SUFFIX}`,
        itemId: item.id,
        title: item.title,
        kind: item.kind,
        status: item.status,
        start: item.due,
        allDay: true,
        due: true,
      };
      if (item.categoryId) {
        marker.categoryId = item.categoryId;
        const color = colorById.get(item.categoryId);
        if (color) marker.categoryColor = color;
      }
      out.push(marker);
    }
    if (!isScheduled(item)) continue;
    let occurrences;
    try {
      occurrences = expandRecurrence(item, range);
    } catch {
      const interval = intervalOf(item);
      if (!intersects(interval, range)) continue;
      occurrences = item.end === undefined ? [{ start: item.start }] : [{ start: item.start, end: item.end }];
    }

    for (const occurrence of occurrences) {
      const next: CalendarOccurrence = {
        id: item.recurrence ? `${item.id}::${occurrence.start}` : item.id,
        itemId: item.id,
        title: item.title,
        kind: item.kind,
        status: item.status,
        start: occurrence.start,
        allDay: isAllDay(occurrence.start),
      };
      if (occurrence.end !== undefined) next.end = occurrence.end;
      if (item.categoryId) {
        next.categoryId = item.categoryId;
        const color = colorById.get(item.categoryId);
        if (color) next.categoryColor = color;
      }
      out.push(next);
    }
  }

  out.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  return out;
}

function dayInterval(day: Date): Interval {
  const start = startOfDay(day);
  return { start, end: addDays(start, 1) };
}

/**
 * Whether an occurrence should be listed on this civil day in month/agenda views.
 * Events occupy every day they cover; tasks sit on their start day. Objectives
 * are not listed per day: the calendar shows them in the objectives strip.
 */
export function occupiesMonthDay(occurrence: CalendarOccurrence, day: Date): boolean {
  const range = dayInterval(day);
  const interval = occurrenceInterval(occurrence);
  if (!intersects(interval, range)) return false;

  if (occurrence.kind === "event") return true;

  return isSameDay(parseLocal(occurrence.start), day);
}

/**
 * Objectives and projects that matter in the range, for the strip and the
 * plan pane: dated ones whose span touches it, plus undated ones that are
 * still open, so a goal without dates is never invisible.
 */
export function objectivesInRange(items: PlanItem[], range: Interval): PlanItem[] {
  return items
    .filter((item) => {
      if (item.kind !== "objective" && item.kind !== "project") return false;
      if (!isScheduled(item)) return item.due ? intersects(intervalOf({ start: item.due }), range) || item.due >= formatLocalDate(range.start) : true;
      return intersects(intervalOf(item), range);
    })
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "objective" ? -1 : 1) || compareByTime(a, b) || a.title.localeCompare(b.title));
}

export function occurrencesOnDay(occurrences: CalendarOccurrence[], day: Date): CalendarOccurrence[] {
  return occurrences.filter((occurrence) => occupiesMonthDay(occurrence, day));
}

export function periodLabel(scale: TimeScale, focus: Date, weekStartsOn: 0 | 1): string {
  switch (scale) {
    case "year":
      return format(focus, "yyyy");
    case "month":
      return format(focus, "MMMM yyyy");
    case "week": {
      const start = startOfWeek(focus, { weekStartsOn });
      const end = addDays(start, 6);
      if (start.getFullYear() !== end.getFullYear()) {
        return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
      }
      if (start.getMonth() !== end.getMonth()) {
        return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`;
      }
      return `${format(start, "d")} – ${format(end, "d MMM yyyy")}`;
    }
    case "day":
    case "hour":
      return format(focus, "EEEE d MMMM yyyy");
  }
}

export function visibleCalendarRange(scale: TimeScale, focus: Date, weekStartsOn: 0 | 1): Interval {
  if (scale === "year") {
    const start = startOfYear(focus);
    return { start, end: addMonths(start, 12) };
  }
  if (scale === "month") {
    const monthStart = startOfMonth(focus);
    const start = startOfWeek(monthStart, { weekStartsOn });
    const last = startOfDay(endOfWeek(endOfMonth(monthStart), { weekStartsOn }));
    return { start, end: addDays(last, 1) };
  }
  if (scale === "week") {
    const start = startOfWeek(focus, { weekStartsOn });
    return { start, end: addDays(start, 7) };
  }
  const start = startOfDay(focus);
  return { start, end: addDays(start, 1) };
}

export function timedLabel(occurrence: CalendarOccurrence): string | undefined {
  if (occurrence.allDay) return undefined;
  const start = format(parseLocal(occurrence.start), "HH:mm");
  if (!occurrence.end) return start;
  const end = format(parseLocal(occurrence.end), "HH:mm");
  if (end === start) return start;
  return `${start}–${end}`;
}

export function dayKey(date: Date): string {
  return formatLocalDate(date);
}
