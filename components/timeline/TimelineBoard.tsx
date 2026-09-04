"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { AddTaskItem } from "@/components/task/AddTaskItem";
import { SubHeader } from "@/components/layout/SubHeader";
import { LaneLayer } from "@/components/timeline/LaneLayer";
import { NowLine } from "@/components/timeline/NowLine";
import { RemoveDropZone } from "@/components/timeline/RemoveDropZone";
import { ScaleControl } from "@/components/timeline/ScaleControl";
import { TimelineGrid } from "@/components/timeline/TimelineGrid";
import { TimelineHeader } from "@/components/timeline/TimelineHeader";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteTask } from "@/hooks/useTaskActions";
import { useTaskPointer } from "@/hooks/useTaskPointer";
import { useTimelinePan } from "@/hooks/useTimelinePan";
import { useTimelineZoom } from "@/hooks/useTimelineZoom";
import { useVisibleRange } from "@/hooks/useVisibleRange";
import { formatDateDisplay } from "@/lib/date-utils";
import { layoutLanes, type LaneItem, type LaneTask } from "@/lib/lanes";
import { createTask, defaultTaskRange } from "@/lib/plan";
import { intervalOf, isAllDay } from "@/lib/time/local";
import { instantAt, layoutFor, xOf } from "@/lib/time/layout";
import {
  columnIndexContaining,
  defaultScaleFor,
  nearestColumnIndex,
  zoomIn,
  zoomOut,
  type TimeColumn,
} from "@/lib/time/scale";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";
import { useUIStore } from "@/store/uiStore";
import type { Plan, TimeScale } from "@/types";

const SMOOTH_SCROLL_VIEWPORTS = 4;

function paddingLeft(el: HTMLElement): number {
  return parseFloat(getComputedStyle(el).paddingLeft) || 0;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function visibleUnits(units: TimeColumn[], layout: ReturnType<typeof layoutFor>, fromX: number, toX: number) {
  return units.filter((unit) => {
    const start = xOf(layout, unit.start);
    const end = xOf(layout, unit.end);
    return end >= fromX && start <= toX;
  });
}

function visibleItems(items: LaneItem[], fromX: number, toX: number) {
  return items.filter(
    (item) => item.x <= toX && item.x + Math.max(item.width, item.labelWidth) >= fromX
  );
}

interface Anchor {
  instant: Date;
  offset: number;
}

interface TimelineBoardProps {
  plan: Plan;
}

export function TimelineBoard({ plan }: TimelineBoardProps) {
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const dateFormat = useUIStore((s) => s.settings.dateFormat);
  const updatePlan = usePlanStore((s) => s.updatePlan);
  const addTask = usePlanStore((s) => s.addTask);
  const updateTask = usePlanStore((s) => s.updateTask);
  const deleteTask = useDeleteTask();

  const [scale, setScaleState] = useState<TimeScale>(
    () => plan.scale ?? defaultScaleFor(plan.start, plan.end)
  );

  const layout = useMemo(
    () => layoutFor(scale, plan.start, plan.end, { weekStartsOn }),
    [scale, plan.start, plan.end, weekStartsOn]
  );

  const laneTasks = useMemo<LaneTask[]>(
    () =>
      plan.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        interval: intervalOf(task),
        allDay: isAllDay(task.start),
      })),
    [plan.tasks]
  );
  const lanes = useMemo(() => layoutLanes(laneTasks, (date) => xOf(layout, date)), [laneTasks, layout]);
  const tasksById = useMemo(() => new Map(plan.tasks.map((task) => [task.id, task])), [plan.tasks]);

  const [boardEl, setBoardEl] = useState<HTMLDivElement | null>(null);

  const onCommitDates = useCallback(
    (taskId: string, start: string, end: string) => {
      void updateTask(taskId, { start, end });
    },
    [updateTask]
  );
  const onCreateRange = useCallback(
    (start: string, end: string) => {
      void addTask(createTask({ title: "New task", start, end }));
    },
    [addTask]
  );

  const { preview, dragging, overRemove } = useTaskPointer({
    boardEl,
    layout,
    scale,
    weekStartsOn,
    enabled: true,
    tasksById,
    onCommit: onCommitDates,
    onDelete: deleteTask,
    onCreate: onCreateRange,
  });
  const { panning, panReady } = useTimelinePan(boardEl, !dragging);
  const { fromX, toX, visibleFrom } = useVisibleRange(boardEl, layout.totalWidth);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const nowX = xOf(layout, now);
  const todayIndex = columnIndexContaining(layout.units, now);
  const homeIndex = todayIndex >= 0 ? todayIndex : 0;
  const todayKey = layout.units[todayIndex]?.key ?? null;

  const headerUnits = useMemo(
    () => visibleUnits(layout.units, layout, fromX, toX),
    [layout, fromX, toX]
  );
  const headerMajor = useMemo(
    () => visibleUnits(layout.majorUnits, layout, fromX, toX),
    [layout, fromX, toX]
  );
  const allDayItems = useMemo(() => visibleItems(lanes.allDay.items, fromX, toX), [lanes, fromX, toX]);
  const timedItems = useMemo(() => visibleItems(lanes.timed.items, fromX, toX), [lanes, fromX, toX]);

  const scrollToX = useCallback(
    (x: number, behavior: ScrollBehavior = "smooth") => {
      if (!boardEl) return;
      const left = paddingLeft(boardEl) + x - boardEl.clientWidth / 2;
      const far = Math.abs(left - boardEl.scrollLeft) > SMOOTH_SCROLL_VIEWPORTS * boardEl.clientWidth;
      boardEl.scrollTo({ left, behavior: far ? "instant" : behavior });
    },
    [boardEl]
  );

  const scrollToUnit = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const unit = layout.units[index];
      if (!unit) return;
      scrollToX((xOf(layout, unit.start) + xOf(layout, unit.end)) / 2, behavior);
    },
    [layout, scrollToX]
  );

  const instantAtOffset = useCallback(
    (offset: number) => {
      if (!boardEl || layout.totalWidth === 0) return null;
      return instantAt(layout, boardEl.scrollLeft + offset - paddingLeft(boardEl));
    },
    [boardEl, layout]
  );

  const centeredIndex = useCallback(() => {
    if (!boardEl) return -1;
    const instant = instantAtOffset(boardEl.clientWidth / 2);
    return instant ? nearestColumnIndex(layout.units, instant) : -1;
  }, [boardEl, layout.units, instantAtOffset]);

  const initialised = useRef(false);
  useEffect(() => {
    if (!boardEl || initialised.current) return;
    initialised.current = true;
    const frame = window.requestAnimationFrame(() => {
      if (todayIndex >= 0) scrollToX(nowX, "auto");
      else scrollToUnit(homeIndex, "auto");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [boardEl, homeIndex, nowX, scrollToUnit, scrollToX, todayIndex]);

  const anchorRef = useRef<Anchor | null>(null);
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || !boardEl) return;
    anchorRef.current = null;
    boardEl.scrollTo({
      left: xOf(layout, anchor.instant) + paddingLeft(boardEl) - anchor.offset,
      behavior: "instant",
    });
  }, [boardEl, layout]);

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
      setScaleState(next);
      void updatePlan({ scale: next });
    },
    [boardEl, instantAtOffset, scale, updatePlan]
  );

  useTimelineZoom(boardEl, (direction, clientX) => {
    setScale(direction > 0 ? zoomIn(scale) : zoomOut(scale), clientX);
  });

  const shiftUnit = useCallback(
    (delta: number) => {
      if (layout.units.length === 0) return;
      const centered = centeredIndex();
      const current = centered >= 0 ? centered : homeIndex;
      scrollToUnit(Math.min(layout.units.length - 1, Math.max(0, current + delta)));
    },
    [centeredIndex, homeIndex, layout.units.length, scrollToUnit]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          shiftUnit(1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          shiftUnit(-1);
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
          if (todayIndex >= 0) scrollToX(nowX);
          else scrollToUnit(homeIndex);
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [homeIndex, nowX, scale, scrollToUnit, scrollToX, setScale, shiftUnit, todayIndex]);

  const createAtCenter = useCallback(
    (title: string) => {
      const index = centeredIndex();
      const unit = layout.units[index >= 0 ? index : homeIndex];
      if (!unit) return;
      void addTask(createTask({ title, ...defaultTaskRange(unit) }));
    },
    [addTask, centeredIndex, homeIndex, layout.units]
  );

  const range = `${formatDateDisplay(plan.start, dateFormat)} – ${formatDateDisplay(plan.end, dateFormat)}`;
  const pastWidth = Math.min(layout.totalWidth, Math.max(0, nowX));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SubHeader backUrl="/" title={plan.title} subtitle={range}>
        <div className="hidden w-44 min-w-0 md:block">
          <AddTaskItem onCreate={createAtCenter} />
        </div>
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
                onClick={() => shiftUnit(-1)}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => (todayIndex >= 0 ? scrollToX(nowX) : scrollToUnit(homeIndex))}
              >
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
                onClick={() => shiftUnit(1)}
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
          onClick={() => (todayIndex >= 0 ? scrollToX(nowX) : scrollToUnit(homeIndex))}
        >
          <CalendarDays />
        </Button>
      </SubHeader>

      <div className="relative min-h-0 flex-1">
        <div
          ref={setBoardEl}
          style={{ "--unit-w": `${layout.pxPerUnit}px` } as React.CSSProperties}
          className={cn(
            "timeline-board h-full min-h-[24rem] overflow-x-auto overflow-y-hidden",
            panning && "is-panning",
            panReady && "is-pan-ready"
          )}
        >
          <div className="relative flex h-full flex-col" style={{ width: layout.totalWidth }}>
            <TimelineHeader
              layout={layout}
              units={headerUnits}
              majorUnits={headerMajor}
              now={now}
              nowX={nowX}
              todayKey={todayKey}
              onSelectUnit={scrollToUnit}
            />
            <div className="relative flex min-h-0 flex-1 flex-col">
              <TimelineGrid layout={layout} units={headerUnits} majorUnits={headerMajor} />
              {pastWidth > 0 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 bg-background/40"
                  style={{ width: pastWidth }}
                />
              )}
              <NowLine x={nowX} totalWidth={layout.totalWidth} />
              {preview?.kind === "create" && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute top-2 z-30 h-7 rounded-md border border-dashed border-primary bg-primary/20"
                  style={{ left: preview.x, width: preview.width }}
                />
              )}
              <LaneLayer
                stack={lanes.allDay}
                items={allDayItems}
                tasksById={tasksById}
                variant="allDay"
                scale={scale}
                fromX={visibleFrom}
                preview={preview}
              />
              <div data-timed-scroll className="relative min-h-0 flex-1 overflow-y-auto">
                <LaneLayer
                  stack={lanes.timed}
                  items={timedItems}
                  tasksById={tasksById}
                  variant="timed"
                  scale={scale}
                  fromX={visibleFrom}
                  preview={preview}
                />
              </div>
            </div>
          </div>
        </div>
        <RemoveDropZone active={dragging} hot={overRemove} />
      </div>
    </div>
  );
}
