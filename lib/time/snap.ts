import { addMinutes } from "date-fns";
import type { Task, TimeScale } from "@/types";
import { addUnits, formatLocal, isAllDay, parseLocal } from "@/lib/time/local";
import { startOfUnit, type ScaleOptions } from "@/lib/time/scale";
import type { TimeLayout } from "@/lib/time/layout";

export const HOUR_SNAP_MINUTES = 15;

/** Unit used when dragging a task at `scale`. All-day bars snap to days at hour scale. */
export function snapUnit(scale: TimeScale, allDay: boolean): TimeScale | "minutes" {
  if (allDay && scale === "hour") return "day";
  if (scale === "hour") return "minutes";
  return scale;
}

export function pxPerSnap(layout: TimeLayout, scale: TimeScale, allDay: boolean): number {
  const unit = snapUnit(scale, allDay);
  if (unit === "minutes") return layout.pxPerMs * HOUR_SNAP_MINUTES * 60_000;
  if (unit === "day" && scale === "hour") return layout.pxPerMs * 86_400_000;
  return layout.pxPerUnit;
}

export function snapInstant(
  date: Date,
  scale: TimeScale,
  allDay: boolean,
  options: ScaleOptions
): Date {
  const unit = snapUnit(scale, allDay);
  if (unit === "minutes") {
    const minutes = date.getMinutes();
    const snapped = Math.round(minutes / HOUR_SNAP_MINUTES) * HOUR_SNAP_MINUTES;
    const next = new Date(date);
    next.setSeconds(0, 0);
    if (snapped === 60) {
      next.setHours(next.getHours() + 1);
      next.setMinutes(0);
    } else {
      next.setMinutes(snapped);
    }
    return next;
  }
  return startOfUnit(date, unit, options);
}

export function shiftBySnap<T extends Pick<Task, "start" | "end">>(
  task: T,
  scale: TimeScale,
  delta: number
): T {
  if (delta === 0) return task;
  const allDay = isAllDay(task.start);
  const unit = snapUnit(scale, allDay);
  if (unit === "minutes") {
    const minutes = delta * HOUR_SNAP_MINUTES;
    return {
      ...task,
      start: formatLocal(addMinutes(parseLocal(task.start), minutes), false),
      end: formatLocal(addMinutes(parseLocal(task.end), minutes), false),
    };
  }
  return {
    ...task,
    start: formatLocal(addUnits(parseLocal(task.start), unit, delta), allDay),
    end: formatLocal(addUnits(parseLocal(task.end), unit, delta), allDay),
  };
}

export function resizeTask(
  task: Pick<Task, "start" | "end">,
  edge: "start" | "end",
  instant: Date
): { start: string; end: string } {
  const allDay = isAllDay(task.start);
  const next = formatLocal(instant, allDay);
  if (edge === "start") {
    const end = task.end < next ? next : task.end;
    return { start: next, end };
  }
  const start = next < task.start ? next : task.start;
  return { start, end: next };
}
