"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { SubHeader } from "@/components/layout/SubHeader";
import type { TaskDragData } from "@/components/task/TaskItem";
import { RemoveDropZone } from "@/components/timeline/RemoveDropZone";
import { TimeColumn } from "@/components/timeline/TimeColumn";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteTask } from "@/hooks/useTaskActions";
import { useTimelinePan } from "@/hooks/useTimelinePan";
import { formatDateDisplay } from "@/lib/date-utils";
import { shiftTask } from "@/lib/time/local";
import {
  COLUMN_GAP,
  COLUMN_WIDTH,
  columnIndexContaining,
  columnsFor,
  instantAtX,
  nearestColumnIndex,
} from "@/lib/time/scale";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";
import { useUIStore } from "@/store/uiStore";
import type { Plan, TimeScale } from "@/types";

function paddingLeft(el: HTMLElement): number {
  return parseFloat(getComputedStyle(el).paddingLeft) || 0;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

interface TimelineBoardProps {
  plan: Plan;
}

export function TimelineBoard({ plan }: TimelineBoardProps) {
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const dateFormat = useUIStore((s) => s.settings.dateFormat);
  const updateTask = usePlanStore((s) => s.updateTask);
  const deleteTask = useDeleteTask();

  const scale: TimeScale = "month";
  const width = COLUMN_WIDTH[scale];
  const pitch = width + COLUMN_GAP;
  const columns = useMemo(
    () => columnsFor(scale, plan.start, plan.end, { weekStartsOn }),
    [scale, plan.start, plan.end, weekStartsOn]
  );

  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { panning, panReady } = useTimelinePan(boardEl, !isDragging);

  const now = new Date();
  const todayIndex = columnIndexContaining(columns, now);
  const homeIndex = todayIndex >= 0 ? todayIndex : 0;
  const effectiveKey = selectedKey ?? columns[homeIndex]?.key ?? null;

  const scrollToColumn = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (!boardEl) return;
      const left = paddingLeft(boardEl) + index * pitch + width / 2 - boardEl.clientWidth / 2;
      boardEl.scrollTo({ left, behavior });
    },
    [boardEl, pitch, width]
  );

  const centeredIndex = useCallback(() => {
    if (!boardEl || columns.length === 0) return -1;
    const x = boardEl.scrollLeft + boardEl.clientWidth / 2 - paddingLeft(boardEl);
    const instant = instantAtX(columns, x, pitch);
    return instant ? nearestColumnIndex(columns, instant) : -1;
  }, [boardEl, columns, pitch]);

  const initialisedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!boardEl || initialisedFor.current === plan.id) return;
    initialisedFor.current = plan.id;
    const frame = window.requestAnimationFrame(() => scrollToColumn(homeIndex, "auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [boardEl, plan.id, homeIndex, scrollToColumn]);

  const selectColumn = useCallback(
    (index: number) => {
      const column = columns[index];
      if (!column) return;
      setSelectedKey(column.key);
      scrollToColumn(index);
    },
    [columns, scrollToColumn]
  );

  const shiftColumn = useCallback(
    (delta: number) => {
      if (columns.length === 0) return;
      const centered = centeredIndex();
      const current =
        centered >= 0 ? centered : columns.findIndex((column) => column.key === effectiveKey);
      const next = Math.min(columns.length - 1, Math.max(0, current + delta));
      selectColumn(next);
    },
    [centeredIndex, columns, effectiveKey, selectColumn]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        shiftColumn(1);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        shiftColumn(-1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shiftColumn]);

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    if (event.canceled) return;

    const { source, target } = event.operation;
    if (!source || !target) return;

    const data = source.data as Partial<TaskDragData> | undefined;
    if (!data || data.planId !== plan.id || typeof data.taskId !== "string") return;
    const task = plan.tasks.find((item) => item.id === data.taskId);
    if (!task) return;

    const targetId = String(target.id);
    if (targetId === "remove-zone") {
      void deleteTask(task);
      return;
    }

    const targetColumn = columns.find((column) => column.key === targetId);
    if (!targetColumn || data.columnIndex === undefined) return;
    const delta = targetColumn.index - data.columnIndex;
    if (delta === 0) return;
    const moved = shiftTask(task, scale, delta);
    void updateTask(task.id, { start: moved.start, end: moved.end });
  };

  const range = `${formatDateDisplay(plan.start, dateFormat)} – ${formatDateDisplay(plan.end, dateFormat)}`;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubHeader backUrl="/" title={plan.title} subtitle={range}>
        <p
          className={cn(
            "hidden items-center gap-1.5 text-xs transition-colors md:flex",
            panReady ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {panReady ? "Drag to pan" : "Hold"}
          <Kbd
            aria-pressed={panReady}
            className={cn("transition-colors", panReady && "bg-foreground text-background")}
          >
            Space
          </Kbd>
          {!panReady && "to pan"}
        </p>
        <ButtonGroup>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`Previous ${scale}`}
                onClick={() => shiftColumn(-1)}
              >
                <ChevronLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Previous {scale} <Kbd>←</Kbd>
            </TooltipContent>
          </Tooltip>
          <Button variant="outline" size="sm" onClick={() => selectColumn(homeIndex)}>
            <CalendarDays />
            Today
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label={`Next ${scale}`}
                onClick={() => shiftColumn(1)}
              >
                <ChevronRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Next {scale} <Kbd>→</Kbd>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </SubHeader>

      <div className="relative min-h-0 flex-1">
        <DragDropProvider onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
          <div
            ref={setBoardEl}
            style={{ "--column-w": `${width}px`, "--column-gap": `${COLUMN_GAP}px` } as React.CSSProperties}
            className={cn(
              "timeline-board flex h-full min-h-[24rem] items-stretch overflow-x-auto overflow-y-hidden",
              panning && "is-panning",
              panReady && "is-pan-ready"
            )}
          >
            {columns.map((column) => (
              <TimeColumn
                key={column.key}
                column={column}
                tasks={plan.tasks}
                planId={plan.id}
                selected={column.key === effectiveKey}
                current={column.index === todayIndex}
                past={column.end <= now}
                onSelect={() => selectColumn(column.index)}
              />
            ))}
          </div>
          <RemoveDropZone isDragging={isDragging} />
        </DragDropProvider>
      </div>
    </div>
  );
}
