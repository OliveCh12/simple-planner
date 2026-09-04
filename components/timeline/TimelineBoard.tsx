"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { SubHeader } from "@/components/layout/SubHeader";
import type { TaskDragData } from "@/components/task/TaskItem";
import { ALL_DAY_PREFIX, AllDayBand } from "@/components/timeline/AllDayBand";
import { RemoveDropZone } from "@/components/timeline/RemoveDropZone";
import { ScaleControl } from "@/components/timeline/ScaleControl";
import { TimeColumn } from "@/components/timeline/TimeColumn";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteTask } from "@/hooks/useTaskActions";
import { useTimelinePan } from "@/hooks/useTimelinePan";
import { useTimelineZoom } from "@/hooks/useTimelineZoom";
import { useVirtualColumns } from "@/hooks/useVirtualColumns";
import { formatDateDisplay } from "@/lib/date-utils";
import { isAllDay, parseLocal, shiftTask } from "@/lib/time/local";
import {
  COLUMN_GAP,
  COLUMN_WIDTH,
  columnIndexContaining,
  columnsFor,
  defaultScaleFor,
  instantAtX,
  nearestColumnIndex,
  xOfInstant,
  zoomIn,
  zoomOut,
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

interface Anchor {
  instant: Date;
  /** Distance from the board's left edge, in px, where `instant` should land. */
  offset: number;
}

interface DropSlot {
  scale: TimeScale;
  index: number;
}

interface TimelineBoardProps {
  plan: Plan;
}

export function TimelineBoard({ plan }: TimelineBoardProps) {
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const dateFormat = useUIStore((s) => s.settings.dateFormat);
  const updatePlan = usePlanStore((s) => s.updatePlan);
  const updateTask = usePlanStore((s) => s.updateTask);
  const deleteTask = useDeleteTask();

  const [scale, setScaleState] = useState<TimeScale>(
    () => plan.scale ?? defaultScaleFor(plan.start, plan.end)
  );
  const width = COLUMN_WIDTH[scale];
  const pitch = width + COLUMN_GAP;
  const columns = useMemo(
    () => columnsFor(scale, plan.start, plan.end, { weekStartsOn }),
    [scale, plan.start, plan.end, weekStartsOn]
  );
  const hourly = scale === "hour";
  const days = useMemo(
    () => (hourly ? columnsFor("day", plan.start, plan.end, { weekStartsOn }) : []),
    [hourly, plan.start, plan.end, weekStartsOn]
  );
  const columnTasks = useMemo(
    () => (hourly ? plan.tasks.filter((task) => !isAllDay(task.start)) : plan.tasks),
    [hourly, plan.tasks]
  );
  const allDayTasks = useMemo(
    () => (hourly ? plan.tasks.filter((task) => isAllDay(task.start)) : []),
    [hourly, plan.tasks]
  );

  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { panning, panReady } = useTimelinePan(boardEl, !isDragging);
  const { from, to } = useVirtualColumns(boardEl, columns.length, pitch);

  const now = new Date();
  const todayIndex = columnIndexContaining(columns, now);
  const homeIndex = todayIndex >= 0 ? todayIndex : 0;
  const effectiveKey = selectedKey ?? columns[homeIndex]?.key ?? null;
  const planStart = parseLocal(plan.start);
  const dayIndexOf = useCallback(
    (date: Date) => differenceInCalendarDays(date, planStart),
    [planStart]
  );

  const scrollToColumn = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (!boardEl) return;
      const left = paddingLeft(boardEl) + index * pitch + width / 2 - boardEl.clientWidth / 2;
      boardEl.scrollTo({ left, behavior });
    },
    [boardEl, pitch, width]
  );

  const instantAtOffset = useCallback(
    (offset: number) => {
      if (!boardEl || columns.length === 0) return null;
      return instantAtX(columns, boardEl.scrollLeft + offset - paddingLeft(boardEl), pitch);
    },
    [boardEl, columns, pitch]
  );

  const centeredIndex = useCallback(() => {
    if (!boardEl) return -1;
    const instant = instantAtOffset(boardEl.clientWidth / 2);
    return instant ? nearestColumnIndex(columns, instant) : -1;
  }, [boardEl, columns, instantAtOffset]);

  const initialised = useRef(false);
  useEffect(() => {
    if (!boardEl || initialised.current) return;
    initialised.current = true;
    const frame = window.requestAnimationFrame(() => scrollToColumn(homeIndex, "auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [boardEl, homeIndex, scrollToColumn]);

  const anchorRef = useRef<Anchor | null>(null);
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !boardEl) return;
    anchorRef.current = null;
    boardEl.scrollTo({
      left: xOfInstant(columns, anchor.instant, pitch) + paddingLeft(boardEl) - anchor.offset,
      behavior: "instant",
    });
  }, [boardEl, columns, pitch]);

  const setScale = useCallback(
    (next: TimeScale | null, clientX?: number) => {
      if (!next || next === scale) return;
      if (boardEl) {
        const offset =
          clientX === undefined
            ? boardEl.clientWidth / 2
            : clientX - boardEl.getBoundingClientRect().left;
        const instant = instantAtOffset(offset);
        if (instant) anchorRef.current = { instant, offset };
      }
      setSelectedKey(null);
      setScaleState(next);
      void updatePlan({ scale: next });
    },
    [boardEl, instantAtOffset, scale, updatePlan]
  );

  useTimelineZoom(boardEl, (direction, clientX) => {
    setScale(direction > 0 ? zoomIn(scale) : zoomOut(scale), clientX);
  });

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
      selectColumn(Math.min(columns.length - 1, Math.max(0, current + delta)));
    },
    [centeredIndex, columns, effectiveKey, selectColumn]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          shiftColumn(1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          shiftColumn(-1);
          break;
        case "+":
        case "=":
          event.preventDefault();
          setScale(zoomIn(scale));
          break;
        case "-":
          event.preventDefault();
          setScale(zoomOut(scale));
          break;
        case "t":
        case "T":
          event.preventDefault();
          selectColumn(homeIndex);
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [homeIndex, scale, selectColumn, setScale, shiftColumn]);

  const resolveDrop = (targetId: string): DropSlot | null => {
    if (targetId.startsWith(ALL_DAY_PREFIX)) {
      const index = Number(targetId.slice(ALL_DAY_PREFIX.length));
      return Number.isInteger(index) ? { scale: "day", index } : null;
    }
    const column = columns.find((item) => item.key === targetId);
    return column ? { scale: column.scale, index: column.index } : null;
  };

  const dayOf = (slot: DropSlot): number =>
    slot.scale === "day" && hourly ? slot.index : dayIndexOf(columns[slot.index].start);

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false);
    if (event.canceled) return;

    const { source, target } = event.operation;
    if (!source || !target) return;

    const data = source.data as Partial<TaskDragData> | undefined;
    if (!data || data.planId !== plan.id || typeof data.taskId !== "string") return;
    if (data.scale === undefined || data.index === undefined) return;
    const task = plan.tasks.find((item) => item.id === data.taskId);
    if (!task) return;

    const targetId = String(target.id);
    if (targetId === "remove-zone") {
      void deleteTask(task);
      return;
    }

    const dropped = resolveDrop(targetId);
    if (!dropped) return;
    const origin: DropSlot = { scale: data.scale, index: data.index };
    const moved =
      dropped.scale === origin.scale
        ? shiftTask(task, dropped.scale, dropped.index - origin.index)
        : shiftTask(task, "day", dayOf(dropped) - dayOf(origin));
    if (moved === task) return;
    void updateTask(task.id, { start: moved.start, end: moved.end });
  };

  const range = `${formatDateDisplay(plan.start, dateFormat)} – ${formatDateDisplay(plan.end, dateFormat)}`;
  const leading = from > 0 ? from * pitch - COLUMN_GAP : 0;
  const trailing = to < columns.length - 1 ? (columns.length - 1 - to) * pitch - COLUMN_GAP : 0;
  const dayFrom = hourly && columns[from] ? dayIndexOf(columns[from].start) : 0;
  const dayTo = hourly && columns[to] ? dayIndexOf(columns[to].start) : -1;
  const todayDayIndex = todayIndex >= 0 ? dayIndexOf(columns[todayIndex].start) : -1;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubHeader backUrl="/" title={plan.title} subtitle={range}>
        <p
          className={cn(
            "hidden items-center gap-1.5 text-xs transition-colors lg:flex",
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
        <ScaleControl value={scale} onChange={(next) => setScale(next)} />
        <ButtonGroup className="hidden md:flex">
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => selectColumn(homeIndex)}>
                <CalendarDays />
                Today
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Jump to now <Kbd>T</Kbd>
            </TooltipContent>
          </Tooltip>
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
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Today"
          className="md:hidden"
          onClick={() => selectColumn(homeIndex)}
        >
          <CalendarDays />
        </Button>
      </SubHeader>

      <div className="relative min-h-0 flex-1">
        <DragDropProvider onDragStart={() => setIsDragging(true)} onDragEnd={handleDragEnd}>
          <div
            ref={setBoardEl}
            style={{ "--column-w": `${width}px`, "--column-gap": `${COLUMN_GAP}px` } as React.CSSProperties}
            className={cn(
              "timeline-board flex h-full min-h-[24rem] overflow-x-auto overflow-y-hidden",
              panning && "is-panning",
              panReady && "is-pan-ready"
            )}
          >
            <div className="flex h-full min-w-max flex-col gap-3">
              {hourly && (
                <AllDayBand
                  days={days}
                  from={dayFrom}
                  to={dayTo}
                  pitch={pitch}
                  gap={COLUMN_GAP}
                  tasks={allDayTasks}
                  planId={plan.id}
                  todayIndex={todayDayIndex}
                />
              )}
              <div className="flex min-h-0 flex-1 items-stretch" style={{ gap: COLUMN_GAP }}>
                {leading > 0 && <div aria-hidden className="shrink-0" style={{ width: leading }} />}
                {columns.slice(from, to + 1).map((column) => (
                  <TimeColumn
                    key={column.key}
                    column={column}
                    tasks={columnTasks}
                    planId={plan.id}
                    selected={column.key === effectiveKey}
                    current={column.index === todayIndex}
                    past={column.end <= now}
                    onSelect={() => selectColumn(column.index)}
                  />
                ))}
                {trailing > 0 && <div aria-hidden className="shrink-0" style={{ width: trailing }} />}
              </div>
            </div>
          </div>
          <RemoveDropZone isDragging={isDragging} />
        </DragDropProvider>
      </div>
    </div>
  );
}
