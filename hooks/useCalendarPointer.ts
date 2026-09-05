import { useEffect, useState } from "react";
import { addDays, differenceInCalendarDays } from "date-fns";
import {
  centeredSlot,
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
import { captureRectOf, gsap, MOTION, prefersReducedMotion } from "@/lib/motion";
import { formatLocalDate, parseLocal } from "@/lib/time/local";
import type { ItemKind } from "@/types";

const DRAG_THRESHOLD = 5;
const CLICK_GUARD_MS = 400;
const LIFT_SCALE = 1.02;

export type GhostMode = "move" | "resize" | "create" | "hover";

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
  mode: GhostMode;
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
  if (!timed || clientY < timed.getBoundingClientRect().top) return null;
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
  mode: GhostMode,
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
    creating: mode === "create" || mode === "hover",
    mode,
    ...meta,
  };
}

function samePreview(a: CalendarDragPreview | null, b: CalendarDragPreview | null): boolean {
  if (!a || !b) return a === b;
  return a.start === b.start && a.end === b.end && a.mode === b.mode;
}

function minutesOf(value: string): number {
  const date = parseLocal(value);
  return date.getHours() * 60 + date.getMinutes();
}

/** Lift a card off the grid while it is dragged. */
function lift(card: HTMLElement) {
  card.dataset.lifted = "true";
  document.body.classList.add("cal-dragging");
  if (!prefersReducedMotion()) gsap.to(card, { scale: LIFT_SCALE, duration: 0.1, ease: "power3.out" });
}

/** Put a card back: either it settles elsewhere through FLIP, or it glides home. */
function drop(card: HTMLElement, home: boolean) {
  delete card.dataset.lifted;
  document.body.classList.remove("cal-dragging");
  gsap.killTweensOf(card);
  if (home && !prefersReducedMotion()) {
    gsap.to(card, { x: 0, y: 0, scale: 1, ...MOTION.settle, clearProps: "transform" });
    return;
  }
  gsap.set(card, { clearProps: "transform" });
}

export interface PointerOptions {
  /** Show a placement ghost under the mouse over empty time. */
  hoverPreview?: boolean;
}

export function useCalendarPointer(
  gridEl: HTMLElement | null,
  onCommit: (commit: CalendarCommit) => void,
  onCreate?: (start: string, end: string) => void,
  options: PointerOptions = {}
): { preview: CalendarDragPreview | null; draggingId: string | null; hover: CalendarDragPreview | null } {
  const [preview, setPreview] = useState<CalendarDragPreview | null>(null);
  const [hover, setHover] = useState<CalendarDragPreview | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const hoverPreview = options.hoverPreview ?? true;

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
    let card: HTMLElement | null = null;
    let slot: HTMLElement | null = null;
    let slotTop = "";
    let slotHeight = "";
    let hoverCurrent: CalendarDragPreview | null = null;
    let hoverFrame = 0;
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

    /** Live geometry for a resize that stays on its own day: the card itself grows. */
    const applyLiveResize = (next: CalendarDragPreview) => {
      if (!slot || originAllDay || !next.end) return;
      const sameDay = next.start.slice(0, 10) === originStart.slice(0, 10) && next.end.slice(0, 10) === originStart.slice(0, 10);
      if (!sameDay) {
        slot.style.top = slotTop;
        slot.style.height = slotHeight;
        return;
      }
      const startMin = minutesOf(next.start);
      const endMin = minutesOf(next.end);
      slot.style.top = `${(startMin / 60) * HOUR_PX}px`;
      slot.style.height = `${Math.max(20, ((endMin - startMin) / 60) * HOUR_PX)}px`;
    };

    const reset = () => {
      pointerId = null;
      pointerType = "";
      mode = null;
      moved = false;
      startHit = null;
      current = null;
      meta = {};
      card = null;
      slot = null;
      setPreview(null);
      setDraggingId(null);
    };

    const setHoverIfChanged = (next: CalendarDragPreview | null) => {
      if (samePreview(hoverCurrent, next)) return;
      hoverCurrent = next;
      setHover(next);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("[data-expand], input, textarea, button[aria-label^='Subtask']")) return;
      const handle = target.closest("[data-cal-resize]");
      const found = target.closest<HTMLElement>("[data-cal-item]");
      pointerId = event.pointerId;
      pointerType = event.pointerType;
      startClientX = event.clientX;
      startClientY = event.clientY;
      moved = false;
      current = null;
      setHoverIfChanged(null);
      if (found) {
        card = found;
        slot = found.closest<HTMLElement>("[data-cal-slot]");
        slotTop = slot?.style.top ?? "";
        slotHeight = slot?.style.height ?? "";
        itemId = found.getAttribute("data-item-id") || "";
        occurrenceId = found.getAttribute("data-cal-item") || "";
        occurrenceStart = found.getAttribute("data-occurrence-start") || "";
        originStart = found.getAttribute("data-start") || occurrenceStart;
        originEnd = found.getAttribute("data-end") || undefined;
        originAllDay = found.getAttribute("data-all-day") === "true";
        meta = {
          color: found.getAttribute("data-cat") || undefined,
          title: found.getAttribute("data-title") || undefined,
          kind: (found.getAttribute("data-kind") as ItemKind | null) ?? undefined,
        };
        if (!itemId || !originStart) {
          pointerId = null;
          card = null;
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
        if (card) lift(card);
        try {
          gridEl.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (mode === "create" && pointerType !== "mouse") return;
      if (mode === "move" && card) gsap.set(card, { x: dx, y: dy });
      const hit = hitTest(gridEl, event.clientX, event.clientY);
      if (!hit) return;
      if (mode === "create" && startHit && hit.zone !== startHit.zone) return;
      const next = applyHit(hit);
      if (current && current.start === next.start && current.end === next.end) return;
      current = next;
      if (mode === "resize-start" || mode === "resize-end") applyLiveResize(next);
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
      const draggedCard = card;
      const draggedSlot = slot;
      const restoreTop = slotTop;
      const restoreHeight = slotHeight;
      reset();
      if (creating) {
        if (!onCreate || !origin) return;
        if (didMove && type !== "mouse") return;
        suppressNextClick();
        // A plain click lands where the hover ghost stood: centred on the pointer for a mouse.
        const slotRange =
          didMove && next
            ? { start: next.start, end: next.end ?? next.start }
            : type === "mouse"
              ? centeredSlot(origin)
              : slotFromClick(origin);
        onCreate(slotRange.start, slotRange.end);
        return;
      }
      const changed = Boolean(didMove && next && (next.start !== commitOriginStart || next.end !== commitOriginEnd));
      if (draggedCard) {
        if (changed) {
          // Remember the lifted position: the settle animation starts from here.
          captureRectOf(commitOccurrenceId, draggedCard.getBoundingClientRect());
          drop(draggedCard, false);
        } else {
          drop(draggedCard, true);
        }
      }
      if (draggedSlot && !changed) {
        draggedSlot.style.top = restoreTop;
        draggedSlot.style.height = restoreHeight;
      }
      if (didMove && next) {
        event.preventDefault();
        event.stopPropagation();
        suppressNextClick();
        if (changed) {
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

    const cancel = () => {
      if (card) drop(card, true);
      if (slot) {
        slot.style.top = slotTop;
        slot.style.height = slotHeight;
      }
      reset();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !mode) return;
      cancel();
    };

    const onHover = (event: PointerEvent) => {
      if (!hoverPreview || !onCreate || mode || event.pointerType !== "mouse") return;
      if (hoverFrame) return;
      hoverFrame = window.requestAnimationFrame(() => {
        hoverFrame = 0;
        const target = event.target;
        if (!(target instanceof Element) || target.closest("[data-cal-item], [data-cal-ghost=landing]")) {
          setHoverIfChanged(null);
          return;
        }
        const hit = hitTest(gridEl, event.clientX, event.clientY);
        if (!hit || hit.zone !== "timed") {
          setHoverIfChanged(null);
          return;
        }
        const next = centeredSlot(hit);
        setHoverIfChanged(previewFrom("", "", next.start, next.end, "hover"));
      });
    };

    const onLeave = () => {
      if (hoverFrame) {
        window.cancelAnimationFrame(hoverFrame);
        hoverFrame = 0;
      }
      setHoverIfChanged(null);
    };

    gridEl.addEventListener("pointerdown", onDown);
    gridEl.addEventListener("pointermove", onHover);
    gridEl.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    window.addEventListener("keydown", onKey);
    return () => {
      if (hoverFrame) window.cancelAnimationFrame(hoverFrame);
      document.body.classList.remove("cal-dragging");
      gridEl.removeEventListener("pointerdown", onDown);
      gridEl.removeEventListener("pointermove", onHover);
      gridEl.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      window.removeEventListener("keydown", onKey);
    };
  }, [gridEl, hoverPreview, onCommit, onCreate]);

  return { preview, draggingId, hover };
}

export function dayFromOrigin(origin: Date, index: number): string {
  return formatLocalDate(addDays(origin, index));
}
