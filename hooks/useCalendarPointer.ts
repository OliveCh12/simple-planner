import { useEffect, useState } from "react";
import { addDays } from "date-fns";
import { HOUR_PX } from "@/components/calendar/CalendarWeek";
import {
  resizeAllDay,
  resizeTimed,
  scheduleLabel,
  shiftToDay,
  snapMinutes,
} from "@/lib/calendar-snap";
import { formatLocalDate } from "@/lib/time/local";

const DRAG_THRESHOLD = 5;

export interface CalendarDragPreview {
  itemId: string;
  occurrenceId: string;
  start: string;
  end?: string;
  allDay: boolean;
  label: string;
}

export interface CalendarCommit {
  itemId: string;
  occurrenceStart: string;
  start: string;
  end?: string;
}

type Zone = "allDay" | "timed";
type Mode = "move" | "resize-start" | "resize-end";

interface Hit {
  zone: Zone;
  day: Date;
  minutes: number;
}

function gutterWidth(grid: HTMLElement): number {
  return parseFloat(grid.getAttribute("data-cal-gutter") || "56") || 56;
}

function dayCount(grid: HTMLElement): number {
  return Number(grid.getAttribute("data-cal-days") || 1) || 1;
}

function originDay(grid: HTMLElement): Date {
  const raw = grid.getAttribute("data-cal-origin");
  if (!raw) return new Date();
  const [y, m, d] = raw.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function hitTest(grid: HTMLElement, clientX: number, clientY: number): Hit | null {
  const allDay = grid.querySelector<HTMLElement>("[data-cal-allday]");
  const timed = grid.querySelector<HTMLElement>("[data-cal-timed]");
  const gutter = gutterWidth(grid);
  const days = dayCount(grid);
  const origin = originDay(grid);

  const inAllDay = allDay && clientY >= allDay.getBoundingClientRect().top && clientY <= allDay.getBoundingClientRect().bottom;
  const area = inAllDay ? allDay : timed;
  if (!area) return null;
  const rect = area.getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right) return null;
  const x = clientX - rect.left - (inAllDay ? 0 : gutter);
  const width = rect.width - (inAllDay ? 0 : gutter);
  if (width <= 0) return { zone: inAllDay ? "allDay" : "timed", day: origin, minutes: 0 };
  const col = Math.min(days - 1, Math.max(0, Math.floor((x / width) * days)));
  const day = addDays(origin, col);
  if (inAllDay) return { zone: "allDay", day, minutes: 0 };
  const scrollTop = timed?.scrollTop ?? 0;
  const y = clientY - timed!.getBoundingClientRect().top + scrollTop;
  const minutes = snapMinutes((y / HOUR_PX) * 60);
  return { zone: "timed", day, minutes };
}

export function useCalendarPointer(
  gridEl: HTMLElement | null,
  onCommit: (commit: CalendarCommit) => void
): { preview: CalendarDragPreview | null; draggingId: string | null } {
  const [preview, setPreview] = useState<CalendarDragPreview | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!gridEl) return;

    let pointerId: number | null = null;
    let mode: Mode | null = null;
    let moved = false;
    let startClientX = 0;
    let startClientY = 0;
    let itemId = "";
    let occurrenceId = "";
    let occurrenceStart = "";
    let originStart = "";
    let originEnd: string | undefined;
    let originAllDay = false;
    let current: CalendarDragPreview | null = null;

    const applyHit = (hit: Hit): CalendarDragPreview => {
      let next: { start: string; end?: string };
      if (mode === "move") {
        next = shiftToDay(originStart, originEnd, hit.day, hit.zone === "timed" ? hit.minutes : undefined);
      } else if (originAllDay && hit.zone === "allDay") {
        next = resizeAllDay(originStart, originEnd, mode === "resize-start" ? "start" : "end", hit.day);
      } else {
        next = resizeTimed(originStart, originEnd, mode === "resize-start" ? "start" : "end", hit.day, hit.minutes);
      }
      const allDay = !next.start.includes("T");
      return {
        itemId,
        occurrenceId,
        start: next.start,
        end: next.end,
        allDay,
        label: scheduleLabel(next.start, next.end),
      };
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-expand], input, textarea, button[aria-label^='Subtask']")) return;
      const handle = target.closest("[data-cal-resize]");
      const card = target.closest("[data-cal-item]");
      if (!card) return;
      itemId = card.getAttribute("data-item-id") || "";
      occurrenceId = card.getAttribute("data-cal-item") || "";
      occurrenceStart = card.getAttribute("data-occurrence-start") || "";
      originStart = card.getAttribute("data-start") || occurrenceStart;
      originEnd = card.getAttribute("data-end") || undefined;
      originAllDay = card.getAttribute("data-all-day") === "true";
      if (!itemId || !originStart) return;
      mode = handle
        ? handle.getAttribute("data-cal-resize") === "start"
          ? "resize-start"
          : "resize-end"
        : "move";
      pointerId = event.pointerId;
      startClientX = event.clientX;
      startClientY = event.clientY;
      moved = false;
    };

    const onMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || !mode) return;
      const dx = event.clientX - startClientX;
      const dy = event.clientY - startClientY;
      if (!moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        moved = true;
        setDraggingId(itemId);
        try {
          gridEl.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
      const hit = hitTest(gridEl, event.clientX, event.clientY);
      if (!hit) return;
      current = applyHit(hit);
      setPreview(current);
    };

    const finish = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const didMove = moved;
      if (didMove && current) {
        event.preventDefault();
        event.stopPropagation();
        const clickGuard = (click: Event) => {
          click.preventDefault();
          click.stopPropagation();
          window.removeEventListener("click", clickGuard, true);
        };
        window.addEventListener("click", clickGuard, true);
        window.setTimeout(() => window.removeEventListener("click", clickGuard, true), 0);
        if (current.start !== originStart || current.end !== originEnd) {
          onCommit({
            itemId,
            occurrenceStart,
            start: current.start,
            end: current.end,
          });
        }
      }
      pointerId = null;
      mode = null;
      moved = false;
      current = null;
      setPreview(null);
      setDraggingId(null);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !mode) return;
      pointerId = null;
      mode = null;
      moved = false;
      current = null;
      setPreview(null);
      setDraggingId(null);
    };

    gridEl.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("keydown", onKey);
    return () => {
      gridEl.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("keydown", onKey);
    };
  }, [gridEl, onCommit]);

  return { preview, draggingId };
}

export function dayFromOrigin(origin: Date, index: number): string {
  return formatLocalDate(addDays(origin, index));
}
