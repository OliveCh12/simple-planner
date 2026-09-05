import { useEffect, useState } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";
import {
  HOUR_PX,
  resizeAllDay,
  resizeTimed,
  scheduleLabel,
  shiftToDay,
  slotFromClick,
  slotFromDrag,
  snapMinutes,
  type GridHit,
} from "@/lib/calendar-snap";
import { formatLocalDate, parseLocal } from "@/lib/time/local";
import type { ItemKind } from "@/types";

const DRAG_THRESHOLD = 5;
const CLICK_GUARD_MS = 400;

export interface CalendarDragPreview {
  itemId: string;
  occurrenceId: string;
  start: string;
  end?: string;
  allDay: boolean;
  label: string;
  creating?: boolean;
  /** Carried from the card so the ghost keeps the item's colour and identity. */
  color?: string;
  title?: string;
  kind?: ItemKind;
  mode: "move" | "resize" | "create";
}

export interface CalendarCommit {
  itemId: string;
  occurrenceId: string;
  occurrenceStart: string;
  start: string;
  end?: string;
}

type Mode = "move" | "resize-start" | "resize-end" | "create";

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

/**
 * Map a pointer position to a day and a snapped minute. Columns are measured
 * on the element that actually lays them out (`data-cal-columns`), never on
 * the scroller, so a scrollbar gutter cannot skew the day.
 */
function hitTest(grid: HTMLElement, clientX: number, clientY: number): GridHit | null {
  const allDay = grid.querySelector<HTMLElement>("[data-cal-allday]");
  const timed = grid.querySelector<HTMLElement>("[data-cal-timed]");
  const columns = grid.querySelector<HTMLElement>("[data-cal-columns]") ?? timed;
  const gutter = gutterWidth(grid);
  const days = dayCount(grid);
  const origin = originDay(grid);

  const allDayRect = allDay?.getBoundingClientRect();
  const inAllDay = Boolean(allDayRect && clientY >= allDayRect.top && clientY <= allDayRect.bottom);
  const area = inAllDay ? allDay : columns;
  if (!area) return null;
  const rect = area.getBoundingClientRect();
  if (clientX < rect.left || clientX > rect.right) return null;
  const x = clientX - rect.left - (inAllDay ? 0 : gutter);
  if (!inAllDay && x < 0) return null;
  const width = rect.width - (inAllDay ? 0 : gutter);
  if (width <= 0) return { zone: inAllDay ? "allDay" : "timed", day: origin, minutes: 0 };
  const col = Math.min(days - 1, Math.max(0, Math.floor((x / width) * days)));
  const day = addDays(origin, col);
  if (inAllDay) return { zone: "allDay", day, minutes: 0 };
  const scrollTop = timed?.scrollTop ?? 0;
  const top = (timed ?? area).getBoundingClientRect().top;
  const y = clientY - top + scrollTop;
  const minutes = snapMinutes((y / HOUR_PX) * 60);
  return { zone: "timed", day, minutes };
}

function suppressNextClick() {
  const guard = (click: Event) => {
    click.preventDefault();
    click.stopPropagation();
  };
  window.addEventListener("click", guard, true);
  window.setTimeout(() => window.removeEventListener("click", guard, true), CLICK_GUARD_MS);
}

interface CardMeta {
  color?: string;
  title?: string;
  kind?: ItemKind;
}

function previewFrom(
  itemId: string,
  occurrenceId: string,
  start: string,
  end: string | undefined,
  mode: CalendarDragPreview["mode"],
  meta: CardMeta = {}
): CalendarDragPreview {
  const allDay = !start.includes("T");
  return {
    itemId,
    occurrenceId,
    start,
    end,
    allDay,
    label: scheduleLabel(start, end),
    creating: mode === "create",
    mode,
    ...meta,
  };
}

export function useCalendarPointer(
  gridEl: HTMLElement | null,
  onCommit: (commit: CalendarCommit) => void,
  onCreate?: (start: string, end: string) => void
): { preview: CalendarDragPreview | null; draggingId: string | null } {
  const [preview, setPreview] = useState<CalendarDragPreview | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (!gridEl) return;

    let pointerId: number | null = null;
    let pointerType = "";
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
    let meta: CardMeta = {};
    let startHit: GridHit | null = null;
    let current: CalendarDragPreview | null = null;
    // Where inside the card the pointer grabbed it, so a move keeps that
    // point under the pointer instead of snapping the start to it.
    let grabDayOffset = 0;
    let grabMinuteOffset = 0;

    const applyHit = (hit: GridHit): CalendarDragPreview => {
      if (mode === "create") {
        const next = startHit ? slotFromDrag(startHit, hit) : slotFromClick(hit);
        return previewFrom("", "", next.start, next.end, "create");
      }
      let next: { start: string; end?: string };
      if (mode === "move") {
        const day = addDays(hit.day, -grabDayOffset);
        const minutes = hit.zone === "timed" ? snapMinutes(hit.minutes - grabMinuteOffset) : undefined;
        next = shiftToDay(originStart, originEnd, day, minutes);
      } else if (originAllDay && hit.zone === "allDay") {
        next = resizeAllDay(originStart, originEnd, mode === "resize-start" ? "start" : "end", hit.day);
      } else {
        next = resizeTimed(originStart, originEnd, mode === "resize-start" ? "start" : "end", hit.day, hit.minutes);
      }
      return previewFrom(itemId, occurrenceId, next.start, next.end, mode === "move" ? "move" : "resize", meta);
    };

    const reset = () => {
      pointerId = null;
      pointerType = "";
      mode = null;
      moved = false;
      startHit = null;
      current = null;
      meta = {};
      setPreview(null);
      setDraggingId(null);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-expand], input, textarea, button[aria-label^='Subtask']")) return;
      const handle = target.closest("[data-cal-resize]");
      const card = target.closest<HTMLElement>("[data-cal-item]");
      pointerId = event.pointerId;
      pointerType = event.pointerType;
      startClientX = event.clientX;
      startClientY = event.clientY;
      moved = false;
      current = null;
      if (card) {
        itemId = card.getAttribute("data-item-id") || "";
        occurrenceId = card.getAttribute("data-cal-item") || "";
        occurrenceStart = card.getAttribute("data-occurrence-start") || "";
        originStart = card.getAttribute("data-start") || occurrenceStart;
        originEnd = card.getAttribute("data-end") || undefined;
        originAllDay = card.getAttribute("data-all-day") === "true";
        meta = {
          color: card.getAttribute("data-cat") || undefined,
          title: card.getAttribute("data-title") || undefined,
          kind: (card.getAttribute("data-kind") as ItemKind | null) ?? undefined,
        };
        if (!itemId || !originStart) {
          pointerId = null;
          return;
        }
        mode = handle
          ? handle.getAttribute("data-cal-resize") === "start"
            ? "resize-start"
            : "resize-end"
          : "move";
        grabDayOffset = 0;
        grabMinuteOffset = 0;
        if (mode === "move") {
          const grab = hitTest(gridEl, event.clientX, event.clientY);
          const origin = parseLocal(originStart);
          if (grab) {
            grabDayOffset = differenceInCalendarDays(grab.day, origin);
            if (grab.zone === "timed" && !originAllDay) {
              grabMinuteOffset = grab.minutes - (origin.getHours() * 60 + origin.getMinutes());
            }
          }
        }
        return;
      }
      if (!onCreate) {
        pointerId = null;
        return;
      }
      const hit = hitTest(gridEl, event.clientX, event.clientY);
      if (!hit) {
        pointerId = null;
        return;
      }
      mode = "create";
      startHit = hit;
      itemId = "";
      occurrenceId = "";
      originStart = "";
      originEnd = undefined;
    };

    const onMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || !mode) return;
      const dx = event.clientX - startClientX;
      const dy = event.clientY - startClientY;
      if (!moved) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        moved = true;
        if (mode === "create" && pointerType !== "mouse") return;
        if (mode !== "create") setDraggingId(itemId);
        try {
          gridEl.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (mode === "create" && pointerType !== "mouse") return;
      const hit = hitTest(gridEl, event.clientX, event.clientY);
      if (!hit) return;
      if (mode === "create" && startHit && hit.zone !== startHit.zone) return;
      const next = applyHit(hit);
      if (current && current.start === next.start && current.end === next.end) return;
      current = next;
      setPreview(current);
    };

    const finish = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const didMove = moved;
      const creating = mode === "create";
      const origin = startHit;
      const next = current;
      const type = pointerType;
      const commitItemId = itemId;
      const commitOccurrenceId = occurrenceId;
      const commitOccurrence = occurrenceStart;
      const commitOriginStart = originStart;
      const commitOriginEnd = originEnd;
      reset();
      if (creating) {
        if (!onCreate || !origin) return;
        if (didMove && type !== "mouse") return;
        suppressNextClick();
        const slot = didMove && next ? { start: next.start, end: next.end ?? next.start } : slotFromClick(origin);
        onCreate(slot.start, slot.end);
        return;
      }
      if (didMove && next) {
        event.preventDefault();
        event.stopPropagation();
        suppressNextClick();
        if (next.start !== commitOriginStart || next.end !== commitOriginEnd) {
          onCommit({
            itemId: commitItemId,
            occurrenceId: commitOccurrenceId,
            occurrenceStart: commitOccurrence,
            start: next.start,
            end: next.end,
          });
        }
      }
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !mode) return;
      reset();
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
  }, [gridEl, onCommit, onCreate]);

  return { preview, draggingId };
}

export function dayFromOrigin(origin: Date, index: number): string {
  return formatLocalDate(addDays(origin, index));
}
