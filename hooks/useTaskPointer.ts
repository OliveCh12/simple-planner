import { useEffect, useState } from "react";
import { addMinutes } from "date-fns";
import { addUnits, formatLocal, isAllDay } from "@/lib/time/local";
import { instantAt, type TimeLayout } from "@/lib/time/layout";
import { pxPerSnap, resizeTask, shiftBySnap, snapInstant, snapUnit } from "@/lib/time/snap";
import type { Task, TimeScale } from "@/types";

const DRAG_THRESHOLD = 4;

export interface DragPreview {
  kind: "move" | "resize" | "create";
  taskId?: string;
  x: number;
  width: number;
}

function paddingLeft(el: HTMLElement): number {
  return parseFloat(getComputedStyle(el).paddingLeft) || 0;
}

function overRemove(clientX: number, clientY: number): boolean {
  const zone = document.querySelector("[data-dropzone=remove-zone]");
  if (!(zone instanceof HTMLElement) || zone.getAttribute("aria-hidden") === "true") return false;
  const rect = zone.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

interface UseTaskPointerOptions {
  boardEl: HTMLDivElement | null;
  layout: TimeLayout;
  scale: TimeScale;
  weekStartsOn: 0 | 1;
  enabled: boolean;
  tasksById: Map<string, Task>;
  onCommit: (taskId: string, start: string, end: string) => void;
  onDelete: (task: Task) => void;
  onCreate: (start: string, end: string) => void;
}

export function useTaskPointer({
  boardEl,
  layout,
  scale,
  weekStartsOn,
  enabled,
  tasksById,
  onCommit,
  onDelete,
  onCreate,
}: UseTaskPointerOptions): { preview: DragPreview | null; dragging: boolean; overRemove: boolean } {
  const [preview, setPreview] = useState<DragPreview | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hot, setHot] = useState(false);

  useEffect(() => {
    if (!boardEl || !enabled || layout.totalWidth === 0) return;

    let pointerId: number | null = null;
    let startClientX = 0;
    let originCanvasX = 0;
    let moved = false;
    let suppressClick = false;
    let mode: "move" | "resize-start" | "resize-end" | "create" | null = null;
    let task: Task | null = null;
    let allDay = false;
    let barX = 0;
    let barWidth = 0;

    const canvasX = (clientX: number) => {
      const rect = boardEl.getBoundingClientRect();
      return boardEl.scrollLeft - paddingLeft(boardEl) + (clientX - rect.left);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (boardEl.classList.contains("is-pan-ready") || boardEl.classList.contains("is-panning")) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest("input, textarea, [data-slot=popover-content]")) return;

      const handle = target.closest("[data-resize]");
      const bar = target.closest("[data-task-bar]");
      const layer = target.closest("[data-lane-layer]");
      originCanvasX = canvasX(event.clientX);
      startClientX = event.clientX;
      moved = false;
      pointerId = event.pointerId;

      if (handle && bar) {
        const id = bar.getAttribute("data-task-bar");
        const found = id ? tasksById.get(id) : undefined;
        if (!found) return;
        task = found;
        allDay = isAllDay(found.start);
        mode = handle.getAttribute("data-resize") === "start" ? "resize-start" : "resize-end";
        barX = Number(bar.getAttribute("data-bar-x")) || originCanvasX;
        barWidth = Number(bar.getAttribute("data-bar-width")) || 8;
        return;
      }

      if (bar) {
        const id = bar.getAttribute("data-task-bar");
        const found = id ? tasksById.get(id) : undefined;
        if (!found) return;
        task = found;
        allDay = isAllDay(found.start);
        mode = "move";
        barX = Number(bar.getAttribute("data-bar-x")) || originCanvasX;
        barWidth = Number(bar.getAttribute("data-bar-width")) || 8;
        return;
      }

      if (layer && !target.closest("[data-cluster-bar]")) {
        allDay = layer.getAttribute("data-lane-layer") === "allDay";
        mode = "create";
        task = null;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || !mode) return;
      const dx = event.clientX - startClientX;
      if (!moved) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        moved = true;
        setDragging(true);
        try {
          boardEl.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }

      const x = canvasX(event.clientX);
      const step = pxPerSnap(layout, scale, allDay);
      const delta = Math.round((x - originCanvasX) / step);
      setHot(overRemove(event.clientX, event.clientY));

      if (mode === "move" && task) {
        setPreview({ kind: "move", taskId: task.id, x: barX + delta * step, width: barWidth });
      } else if (mode === "resize-start" && task) {
        const nextX = barX + delta * step;
        const width = Math.max(step, barX + barWidth - nextX);
        setPreview({ kind: "resize", taskId: task.id, x: barX + barWidth - width, width });
      } else if (mode === "resize-end" && task) {
        setPreview({
          kind: "resize",
          taskId: task.id,
          x: barX,
          width: Math.max(step, barWidth + delta * step),
        });
      } else if (mode === "create") {
        const left = Math.min(originCanvasX, x);
        const right = Math.max(originCanvasX, x);
        setPreview({
          kind: "create",
          x: left,
          width: Math.max(step, right - left),
        });
      }
    };

    const finish = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      const currentMode = mode;
      const currentTask = task;
      const currentAllDay = allDay;
      const origin = originCanvasX;
      const didMove = moved;
      if (didMove) suppressClick = true;
      mode = null;
      task = null;
      moved = false;
      setDragging(false);
      setPreview(null);
      setHot(false);
      if (!didMove || !currentMode) return;

      if (currentTask && overRemove(event.clientX, event.clientY)) {
        onDelete(currentTask);
        return;
      }

      const x = canvasX(event.clientX);
      const step = pxPerSnap(layout, scale, currentAllDay);
      const delta = Math.round((x - origin) / step);
      const options = { weekStartsOn };

      if (currentMode === "move" && currentTask) {
        const next = shiftBySnap(currentTask, scale, delta);
        if (next.start !== currentTask.start || next.end !== currentTask.end) {
          onCommit(currentTask.id, next.start, next.end);
        }
        return;
      }

      if ((currentMode === "resize-start" || currentMode === "resize-end") && currentTask) {
        const instant = snapInstant(
          instantAt(layout, x) ?? new Date(),
          scale,
          currentAllDay,
          options
        );
        const next = resizeTask(
          currentTask,
          currentMode === "resize-start" ? "start" : "end",
          instant
        );
        if (next.start !== currentTask.start || next.end !== currentTask.end) {
          onCommit(currentTask.id, next.start, next.end);
        }
        return;
      }

      if (currentMode === "create") {
        const first = snapInstant(instantAt(layout, origin) ?? new Date(), scale, currentAllDay, options);
        const second = snapInstant(instantAt(layout, x) ?? new Date(), scale, currentAllDay, options);
        const start = first <= second ? first : second;
        let end = first <= second ? second : first;
        const unit = snapUnit(scale, currentAllDay);
        if (end.getTime() === start.getTime()) {
          end = unit === "minutes" ? addMinutes(start, 15) : addUnits(start, unit, 1);
          if (currentAllDay) end = addUnits(end, "day", -1);
        }
        onCreate(formatLocal(start, currentAllDay), formatLocal(end, currentAllDay));
      }
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    boardEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    boardEl.addEventListener("click", onClickCapture, true);

    return () => {
      boardEl.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      boardEl.removeEventListener("click", onClickCapture, true);
    };
  }, [boardEl, enabled, layout, onCommit, onCreate, onDelete, scale, tasksById, weekStartsOn]);

  return { preview, dragging, overRemove: hot };
}
