"use client";

import { useMemo } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { CalendarChip } from "@/components/calendar/CalendarChip";
import { packInRange } from "@/lib/calendar";
import { createTask, defaultTaskRange } from "@/lib/plan";
import { formatLocalDateTime, intervalOf, isAllDay } from "@/lib/time/local";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";
import type { Plan, Task, TimeScale } from "@/types";

const WEEKDAY_COUNT = 7;
const MONTH_LANES = 4;
const LANE_PX = 22;
const HOUR_PX = 44;

interface CalendarBoardProps {
  plan: Plan;
  scale: TimeScale;
  focus: Date;
  weekStartsOn: 0 | 1;
  onFocusMonth: (date: Date) => void;
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function dayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { start, end: addDays(start, 1) };
}

export function CalendarBoard({ plan, scale, focus, weekStartsOn, onFocusMonth }: CalendarBoardProps) {
  const addTask = usePlanStore((s) => s.addTask);
  const tasksById = useMemo(() => new Map(plan.tasks.map((task) => [task.id, task])), [plan.tasks]);
  const placed = useMemo(
    () => plan.tasks.map((task) => ({ task, interval: intervalOf(task) })),
    [plan.tasks]
  );

  const intersecting = (range: { start: Date; end: Date }) =>
    placed.filter((item) => item.interval.start < range.end && item.interval.end > range.start);

  const createOnDay = (day: Date) => {
    const column = { scale: "day" as const, start: day, end: addDays(day, 1) };
    void addTask(createTask({ title: "New task", ...defaultTaskRange(column) }));
  };

  const createOnHour = (day: Date, hour: number) => {
    const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
    const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1);
    void addTask(
      createTask({
        title: "New task",
        start: formatLocalDateTime(start),
        end: formatLocalDateTime(end),
      })
    );
  };

  if (scale === "year") {
    return <YearView year={startOfYear(focus)} placed={placed} onFocusMonth={onFocusMonth} />;
  }
  if (scale === "month") {
    return (
      <MonthView
        focus={focus}
        weekStartsOn={weekStartsOn}
        placed={placed}
        tasksById={tasksById}
        onCreateDay={createOnDay}
      />
    );
  }
  if (scale === "week") {
    return (
      <WeekView
        focus={focus}
        weekStartsOn={weekStartsOn}
        intersecting={intersecting}
        tasksById={tasksById}
        onCreateDay={createOnDay}
      />
    );
  }
  return (
    <DayView
      focus={focus}
      intersecting={intersecting}
      tasksById={tasksById}
      onCreateDay={createOnDay}
      onCreateHour={createOnHour}
      hours={scale === "hour"}
    />
  );
}

function WeekdayHeaders({ weekStartsOn }: { weekStartsOn: 0 | 1 }) {
  const start = startOfWeek(new Date(2027, 8, 13), { weekStartsOn });
  const days = eachDayOfInterval({ start, end: addDays(start, 6) });
  return (
    <div className="grid grid-cols-7 border-b">
      {days.map((day) => (
        <div
          key={day.toISOString()}
          className="px-2 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        >
          {format(day, "EEE")}
        </div>
      ))}
    </div>
  );
}

function YearView({
  year,
  placed,
  onFocusMonth,
}: {
  year: Date;
  placed: { task: Task; interval: ReturnType<typeof intervalOf> }[];
  onFocusMonth: (date: Date) => void;
}) {
  const months = Array.from({ length: 12 }, (_, index) => addMonths(year, index));
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((month) => {
        const tasks = placed
          .filter((item) => isSameMonth(item.interval.start, month))
          .map((item) => item.task);
        const extra = Math.max(0, tasks.length - 5);
        return (
          <section key={month.toISOString()} className="flex flex-col rounded-xl border bg-card p-3">
            <button
              type="button"
              className="mb-2 text-left text-sm font-semibold hover:text-primary"
              onClick={() => onFocusMonth(month)}
            >
              {format(month, "MMMM")}
            </button>
            <ul className="flex flex-col gap-1">
              {tasks.slice(0, 5).map((task) => (
                <li key={task.id}>
                  <CalendarChip task={task} />
                </li>
              ))}
              {extra > 0 && (
                <li className="px-1.5 text-xs text-muted-foreground">+{extra} more</li>
              )}
              {tasks.length === 0 && (
                <li className="px-1.5 text-xs text-muted-foreground">No tasks</li>
              )}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function MonthView({
  focus,
  weekStartsOn,
  placed,
  tasksById,
  onCreateDay,
}: {
  focus: Date;
  weekStartsOn: 0 | 1;
  placed: { task: Task; interval: ReturnType<typeof intervalOf> }[];
  tasksById: Map<string, Task>;
  onCreateDay: (day: Date) => void;
}) {
  const monthStart = startOfMonth(focus);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridLast = endOfWeek(endOfMonth(monthStart), { weekStartsOn });
  const days = eachDayOfInterval({ start: gridStart, end: gridLast });
  const weeks: Date[][] = [];
  for (let index = 0; index < days.length; index += WEEKDAY_COUNT) {
    weeks.push(days.slice(index, index + WEEKDAY_COUNT));
  }
  const today = new Date();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <WeekdayHeaders weekStartsOn={weekStartsOn} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {weeks.map((days) => {
          const weekStart = days[0];
          const range = { start: weekStart, end: addDays(weekStart, 7) };
          const packed = packInRange(
            placed.map((item) => ({ id: item.task.id, interval: item.interval })),
            range
          );
          const visible = packed.spans.filter((span) => span.lane < MONTH_LANES);
          const extra = Math.max(0, packed.laneCount - MONTH_LANES);
          return (
            <div
              key={weekStart.toISOString()}
              className="relative grid min-h-[7.5rem] flex-1 grid-cols-7 border-b"
            >
              {days.map((day) => {
                const inMonth = isSameMonth(day, monthStart);
                const current = isSameDay(day, today);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => onCreateDay(day)}
                    className={cn(
                      "flex items-start justify-start border-r px-1.5 pt-1 text-left last:border-r-0",
                      !inMonth && "bg-muted/30 text-muted-foreground",
                      current && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center text-xs tabular-nums",
                        current && "rounded-full bg-primary font-semibold text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </button>
                );
              })}
              <div className="pointer-events-none absolute inset-x-0 bottom-1 top-8">
                {visible.map((span) => {
                  const task = tasksById.get(span.id);
                  if (!task) return null;
                  return (
                    <div
                      key={span.id}
                      className="pointer-events-auto absolute px-0.5"
                      style={{
                        left: `${span.startFrac * 100}%`,
                        width: `${(span.endFrac - span.startFrac) * 100}%`,
                        top: span.lane * LANE_PX,
                      }}
                    >
                      <CalendarChip task={task} />
                    </div>
                  );
                })}
                {extra > 0 && (
                  <p
                    className="absolute bottom-0 left-1 text-[11px] text-muted-foreground"
                  >
                    +{extra} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  focus,
  weekStartsOn,
  intersecting,
  tasksById,
  onCreateDay,
}: {
  focus: Date;
  weekStartsOn: 0 | 1;
  intersecting: (range: { start: Date; end: Date }) => { task: Task; interval: ReturnType<typeof intervalOf> }[];
  tasksById: Map<string, Task>;
  onCreateDay: (day: Date) => void;
}) {
  const weekStart = startOfWeek(focus, { weekStartsOn });
  const days = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
  const weekRange = { start: weekStart, end: addDays(weekStart, 7) };
  const allDay = intersecting(weekRange).filter((item) => isAllDay(item.task.start));
  const packed = packInRange(
    allDay.map((item) => ({ id: item.task.id, interval: item.interval })),
    weekRange
  );
  const today = new Date();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {days.map((day) => {
          const current = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className="border-r px-2 py-2 last:border-r-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {format(day, "EEE")}
              </p>
              <p
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  current &&
                    "inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          );
        })}
      </div>
      <div className="shrink-0 border-b">
        <p className="px-2 pt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          All day
        </p>
        <div
          className="relative"
          style={{ height: Math.max(1, packed.laneCount) * LANE_PX + 8 }}
        >
          {packed.spans.map((span) => {
            const task = tasksById.get(span.id);
            if (!task) return null;
            return (
              <div
                key={span.id}
                className="absolute px-0.5"
                style={{
                  left: `${span.startFrac * 100}%`,
                  width: `${(span.endFrac - span.startFrac) * 100}%`,
                  top: span.lane * LANE_PX,
                }}
              >
                <CalendarChip task={task} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 overflow-y-auto">
        {days.map((day) => {
          const range = dayRange(day);
          const timed = intersecting(range).filter((item) => !isAllDay(item.task.start));
          return (
            <div
              key={day.toISOString()}
              className="min-h-[12rem] border-r last:border-r-0"
              onDoubleClick={() => onCreateDay(day)}
            >
              <ul className="flex flex-col gap-1 p-1">
                {timed.map((item) => (
                  <li key={item.task.id}>
                    <CalendarChip
                      task={item.task}
                      time={format(item.interval.start, "HH:mm")}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  focus,
  intersecting,
  tasksById,
  onCreateDay,
  onCreateHour,
  hours,
}: {
  focus: Date;
  intersecting: (range: { start: Date; end: Date }) => { task: Task; interval: ReturnType<typeof intervalOf> }[];
  tasksById: Map<string, Task>;
  onCreateDay: (day: Date) => void;
  onCreateHour: (day: Date, hour: number) => void;
  hours: boolean;
}) {
  const range = dayRange(focus);
  const items = intersecting(range);
  const allDay = items.filter((item) => isAllDay(item.task.start));
  const timed = items.filter((item) => !isAllDay(item.task.start));
  const packed = packInRange(
    timed.map((item) => ({ id: item.task.id, interval: item.interval })),
    range
  );
  const laneCount = Math.max(1, packed.laneCount);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b px-4 py-3">
        <p className="text-lg font-semibold tracking-tight">{format(focus, "EEEE d MMMM yyyy")}</p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">All day</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {allDay.length === 0 && (
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onCreateDay(range.start)}
            >
              Add an all-day task
            </button>
          )}
          {allDay.map((item) => (
            <div key={item.task.id} className="max-w-xs">
              <CalendarChip task={item.task} />
            </div>
          ))}
        </div>
      </div>
      {hours ? (
        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {Array.from({ length: 24 }, (_, hour) => (
            <button
              key={hour}
              type="button"
              className="flex h-11 w-full border-b border-border/50 text-left hover:bg-muted/40"
              onClick={() => onCreateHour(range.start, hour)}
            >
              <span className="w-16 shrink-0 px-3 py-1 text-xs tabular-nums text-muted-foreground">
                {pad(hour)}:00
              </span>
            </button>
          ))}
          <div className="pointer-events-none absolute inset-y-0 left-16 right-2">
            {packed.spans.map((span) => {
              const task = tasksById.get(span.id);
              if (!task) return null;
              const colWidth = 100 / laneCount;
              return (
                <div
                  key={span.id}
                  className="pointer-events-auto absolute px-0.5"
                  style={{
                    top: span.startFrac * 24 * HOUR_PX,
                    height: Math.max(18, (span.endFrac - span.startFrac) * 24 * HOUR_PX),
                    left: `${span.lane * colWidth}%`,
                    width: `${colWidth}%`,
                  }}
                >
                  <CalendarChip
                    task={task}
                    className="h-full items-start py-1"
                    time={format(intervalOf(task).start, "HH:mm")}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
          {timed.length === 0 && (
            <li className="px-1.5 text-sm text-muted-foreground">No timed tasks this day.</li>
          )}
          {timed
            .slice()
            .sort((a, b) => a.interval.start.getTime() - b.interval.start.getTime())
            .map((item) => (
              <li key={item.task.id}>
                <CalendarChip
                  task={item.task}
                  time={format(item.interval.start, "HH:mm")}
                  className="py-1.5 text-sm"
                />
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
