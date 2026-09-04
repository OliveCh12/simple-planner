"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarBoard } from "@/components/calendar/CalendarBoard";
import { CalendarCreateButton } from "@/components/calendar/CalendarCreateButton";
import { QuickAdd } from "@/components/item/QuickAdd";
import { TaskDetailsPanel } from "@/components/item/TaskDetailsPanel";
import { LaneLayer } from "@/components/timeline/LaneLayer";
import { NowLine } from "@/components/timeline/NowLine";
import { RemoveDropZone } from "@/components/timeline/RemoveDropZone";
import { ScaleControl } from "@/components/timeline/ScaleControl";
import { TimelineGrid } from "@/components/timeline/TimelineGrid";
import { TimelineHeader } from "@/components/timeline/TimelineHeader";
import { ViewToggle } from "@/components/timeline/ViewToggle";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteTask } from "@/hooks/useItemActions";
import { useTaskPointer } from "@/hooks/useTaskPointer";
import { useTimelinePan } from "@/hooks/useTimelinePan";
import { useTimelineZoom } from "@/hooks/useTimelineZoom";
import { useVisibleRange } from "@/hooks/useVisibleRange";
import { periodLabel } from "@/lib/calendar";
import { formatDateDisplay } from "@/lib/date-utils";
import { createItem } from "@/lib/domain/items";
import { layoutLanes, type LaneItem, type LaneTask } from "@/lib/lanes";
import { createTask, defaultTaskRange } from "@/lib/plan";
import type { QuickAddResult } from "@/lib/quickadd";
import { addUnits, formatLocalDate, formatLocalDateTime, intervalOf, isAllDay, parseLocal } from "@/lib/time/local";
import { instantAt, layoutFor, xOf } from "@/lib/time/layout";
import {
  CALENDAR_SCALES,
  columnIndexContaining,
  defaultScaleFor,
  nearestColumnIndex,
  startOfUnit,
  zoomIn,
  zoomOut,
  type TimeColumn,
} from "@/lib/time/scale";
import { cn, containerClasses } from "@/lib/utils";
import { useSaveItem } from "@/hooks/useSaveItem";
import { usePlannerStore } from "@/store/plannerStore";
import { useUIStore, type TimelineView } from "@/store/uiStore";
import type { HydratedPlan, PlanItem, TimeScale } from "@/types";

function FocusedItemSheet({ item }: { item: PlanItem }) {
  const [open, setOpen] = useState(true);
  return <TaskDetailsPanel item={item} open={open} onOpenChange={setOpen} />;
}

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
  plan: HydratedPlan;
  focusItemId?: string | null;
}

export function TimelineBoard({ plan, focusItemId }: TimelineBoardProps) {
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const dateFormat = useUIStore((s) => s.settings.dateFormat);
  const view = useUIStore((s) => s.timelineView);
  const setTimelineView = useUIStore((s) => s.setTimelineView);
  const gantt = view === "gantt";
  const updatePlan = usePlannerStore((s) => s.updatePlan);
  const addTask = usePlannerStore((s) => s.addTask);
  const updateTask = usePlannerStore((s) => s.updateTask);
  const items = usePlannerStore((s) => s.items);
  const categories = usePlannerStore((s) => s.categories);
  const deleteTask = useDeleteTask();
  const saveItem = useSaveItem();

  const focusItem = focusItemId ? items.find((item) => item.id === focusItemId) : undefined;

  const [scale, setScaleState] = useState<TimeScale>(
    () => plan.scale ?? defaultScaleFor(plan.start, plan.end)
  );
  const [userFocus, setUserFocus] = useState<Date | null>(null);
  const focus = useMemo(() => {
    if (userFocus) return userFocus;
    if (focusItem) return parseLocal(focusItem.start);
    return new Date();
  }, [focusItem, userFocus]);
  const [selectedDay, setSelectedDay] = useState(() =>
    focusItem ? parseLocal(focusItem.start) : new Date()
  );
  const [selectedHour, setSelectedHour] = useState<number | undefined>(() =>
    focusItem && !isAllDay(focusItem.start) ? parseLocal(focusItem.start).getHours() : undefined
  );
  const [showCompleted, setShowCompleted] = useState(false);
  const [aiQueue, setAiQueue] = useState(false);

  const queueItems = useMemo(
    () =>
      items.filter(
        (item) => item.executor === "ai" && item.status !== "completed" && item.status !== "cancelled"
      ),
    [items]
  );
  const visibleItemsForView = useMemo(
    () => (aiQueue ? queueItems : items),
    [aiQueue, items, queueItems]
  );

  const layout = useMemo(
    () => layoutFor(scale, plan.start, plan.end, { weekStartsOn }),
    [scale, plan.start, plan.end, weekStartsOn]
  );

  const laneTasks = useMemo<LaneTask[]>(() => {
    const allowed = aiQueue ? new Set(queueItems.map((item) => item.id)) : null;
    return plan.tasks
      .filter((task) => !allowed || allowed.has(task.id))
      .map((task) => ({
        id: task.id,
        title: task.title,
        interval: intervalOf(task),
        allDay: isAllDay(task.start),
      }));
  }, [aiQueue, plan.tasks, queueItems]);
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
    enabled: gantt,
    tasksById,
    onCommit: onCommitDates,
    onDelete: deleteTask,
    onCreate: onCreateRange,
  });
  const { panning, panReady } = useTimelinePan(boardEl, gantt && !dragging);
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
  const anchorRef = useRef<Anchor | null>(null);
  useEffect(() => {
    if (!boardEl || initialised.current) return;
    initialised.current = true;
    if (anchorRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      if (todayIndex >= 0) scrollToX(nowX, "auto");
      else scrollToUnit(homeIndex, "auto");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [boardEl, homeIndex, nowX, scrollToUnit, scrollToX, todayIndex]);

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
      if (view === "calendar" && next === "hour") return;
      if (gantt && boardEl) {
        const offset =
          clientX === undefined
            ? boardEl.clientWidth / 2
            : clientX - boardEl.getBoundingClientRect().left;
        const instant = instantAtOffset(offset);
        if (instant) {
          anchorRef.current = { instant, offset };
          setUserFocus(instant);
        }
      }
      setScaleState(next);
      void updatePlan({ scale: next });
    },
    [boardEl, gantt, instantAtOffset, scale, updatePlan, view]
  );

  const [calendarEl, setCalendarEl] = useState<HTMLDivElement | null>(null);
  useTimelineZoom(gantt ? boardEl : calendarEl, (direction, clientX) => {
    setScale(direction > 0 ? zoomIn(scale) : zoomOut(scale), clientX);
  });

  const shiftUnit = useCallback(
    (delta: number) => {
      if (!gantt) {
        const next = addUnits(startOfUnit(focus, scale, { weekStartsOn }), scale, delta);
        setUserFocus(next);
        setSelectedDay(next);
        setSelectedHour(undefined);
        return;
      }
      if (layout.units.length === 0) return;
      const centered = centeredIndex();
      const current = centered >= 0 ? centered : homeIndex;
      scrollToUnit(Math.min(layout.units.length - 1, Math.max(0, current + delta)));
    },
    [centeredIndex, focus, gantt, homeIndex, layout.units.length, scale, scrollToUnit, weekStartsOn]
  );

  const goToday = useCallback(() => {
    const now = new Date();
    setUserFocus(now);
    setSelectedDay(now);
    setSelectedHour(undefined);
    if (gantt) {
      if (todayIndex >= 0) scrollToX(nowX);
      else scrollToUnit(homeIndex);
    }
  }, [gantt, homeIndex, nowX, scrollToUnit, scrollToX, todayIndex]);

  const switchView = useCallback(
    (next: TimelineView) => {
      if (next === view) return;
      if (next === "calendar") {
        const instant = gantt ? instantAtOffset(boardEl?.clientWidth ? boardEl.clientWidth / 2 : 0) : null;
        if (instant) setUserFocus(instant);
        if (scale === "hour") setScale("day");
      } else {
        anchorRef.current = { instant: focus, offset: window.innerWidth / 2 };
        initialised.current = false;
      }
      setTimelineView(next);
    },
    [boardEl, focus, gantt, instantAtOffset, scale, setScale, setTimelineView, view]
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
          goToday();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToday, scale, setScale, shiftUnit]);

  const applyQuickAdd = useCallback(
    (draft: QuickAddResult) => {
      void saveItem(
        createItem({
          planId: plan.id,
          title: draft.title,
          start: draft.start,
          end: draft.end,
          kind: draft.kind,
          executor: draft.executor,
          categoryId: draft.categoryId,
          recurrence: draft.recurrence,
        })
      );
    },
    [plan.id, saveItem]
  );

  const ganttQuickRange = useMemo(() => {
    const index = centeredIndex();
    const unit = layout.units[index >= 0 ? index : homeIndex];
    if (!unit) return { start: formatLocalDate(focus), end: undefined as string | undefined };
    return defaultTaskRange(unit);
  }, [centeredIndex, focus, homeIndex, layout.units]);

  const calendarQuickStart =
    selectedHour === undefined
      ? formatLocalDate(selectedDay)
      : formatLocalDateTime(new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), selectedHour));
  const calendarQuickEnd =
    selectedHour === undefined
      ? formatLocalDate(selectedDay)
      : formatLocalDateTime(
          new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), selectedHour + 1)
        );

  const createWhen =
    selectedHour === undefined
      ? `${formatDateDisplay(selectedDay, "EEEE d MMMM")} · all day`
      : `${formatDateDisplay(selectedDay, "EEEE d MMMM")} · ${String(selectedHour).padStart(2, "0")}:00`;

  const range = `${formatDateDisplay(plan.start, dateFormat)} – ${formatDateDisplay(plan.end, dateFormat)}`;
  const viewedPeriod = gantt ? range : periodLabel(scale === "hour" ? "day" : scale, focus, weekStartsOn);
  const pastWidth = Math.min(layout.totalWidth, Math.max(0, nowX));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b bg-background/80 backdrop-blur-md">
        <div className={cn(containerClasses())}>
          <div className="flex h-12 items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="-ml-2 shrink-0" asChild>
                  <Link href="/" aria-label="Back">
                    <ArrowLeft />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back</TooltipContent>
            </Tooltip>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">{plan.title}</h1>
            {gantt && (
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
            )}
            <ViewToggle value={view} onChange={switchView} />
            <ScaleControl
              value={gantt || scale !== "hour" ? scale : "day"}
              onChange={(next) => setScale(next)}
              scales={gantt ? undefined : CALENDAR_SCALES}
            />
          </div>
          <div className="flex items-center gap-2 pb-3">
            <ButtonGroup>
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
                  <Button variant="outline" size="sm" className="px-2 sm:px-3" onClick={goToday}>
                    <CalendarDays />
                    <span className="hidden sm:inline">Today</span>
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
            <h2 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight sm:text-base">
              {viewedPeriod}
            </h2>
            {!gantt && (
              <Button
                type="button"
                variant={showCompleted ? "secondary" : "ghost"}
                size="xs"
                className="hidden sm:inline-flex"
                onClick={() => setShowCompleted((current) => !current)}
              >
                Completed
              </Button>
            )}
            <Button
              type="button"
              variant={aiQueue ? "secondary" : "ghost"}
              size="xs"
              aria-pressed={aiQueue}
              aria-label="AI queue"
              onClick={() => setAiQueue((current) => !current)}
            >
              <Bot />
              <span className="hidden sm:inline">AI queue</span>
              {queueItems.length > 0 ? (
                <span className="tabular-nums text-muted-foreground">{queueItems.length}</span>
              ) : null}
            </Button>
            {gantt ? (
              <>
                <div className="hidden min-w-44 max-w-sm flex-1 md:block">
                  <QuickAdd
                    defaultStart={ganttQuickRange.start}
                    defaultEnd={ganttQuickRange.end}
                    categories={categories}
                    defaultExecutor={aiQueue ? "ai" : "human"}
                    placeholder="Gym every weekday 7am #health @ai"
                    onCreate={applyQuickAdd}
                  />
                </div>
                <div className="md:hidden">
                  <CalendarCreateButton
                    when="Current column"
                    defaultStart={ganttQuickRange.start}
                    defaultEnd={ganttQuickRange.end}
                    categories={categories}
                    defaultExecutor={aiQueue ? "ai" : "human"}
                    onCreate={applyQuickAdd}
                  />
                </div>
              </>
            ) : (
              <CalendarCreateButton
                when={createWhen}
                defaultStart={calendarQuickStart}
                defaultEnd={calendarQuickEnd}
                categories={categories}
                defaultExecutor={aiQueue ? "ai" : "human"}
                onCreate={applyQuickAdd}
              />
            )}
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        {!gantt ? (
          <div ref={setCalendarEl} className="flex h-full min-h-0 flex-1 flex-col">
            <CalendarBoard
              items={visibleItemsForView}
              categories={categories}
              scale={scale}
              focus={focus}
              weekStartsOn={weekStartsOn}
              selectedDay={selectedDay}
              selectedHour={selectedHour}
              highlightId={focusItemId}
              showCompleted={showCompleted}
              onSelectDay={(day, hour) => {
                setSelectedDay(day);
                setSelectedHour(hour);
              }}
              onFocusMonth={(date) => {
                setUserFocus(date);
                setSelectedDay(date);
                setScale("month");
              }}
            />
            {focusItem ? <FocusedItemSheet key={focusItem.id} item={focusItem} /> : null}
          </div>
        ) : (
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
        )}
        <RemoveDropZone active={dragging} hot={overRemove} />
      </div>
    </div>
  );
}
