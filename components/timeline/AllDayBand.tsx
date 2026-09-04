"use client";

import { useMemo } from "react";
import { useDroppable } from "@dnd-kit/react";
import { AddTaskItem } from "@/components/task/AddTaskItem";
import { TaskItem } from "@/components/task/TaskItem";
import { createTask, defaultTaskRange, tasksInColumn } from "@/lib/plan";
import { columnLabel } from "@/lib/time/labels";
import type { TimeColumn } from "@/lib/time/scale";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";
import { useUIStore } from "@/store/uiStore";
import type { Task } from "@/types";

export const ALL_DAY_PREFIX = "allday:";

interface AllDayCellProps {
  day: TimeColumn;
  tasks: Task[];
  planId: string;
  current: boolean;
  width: number;
}

function AllDayCell({ day, tasks, planId, current, width }: AllDayCellProps) {
  const addTask = usePlanStore((s) => s.addTask);
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const showWeekNumbers = useUIStore((s) => s.settings.showWeekNumbers);
  const { spanning, contained } = useMemo(() => tasksInColumn(tasks, day), [tasks, day]);
  const label = columnLabel(day, { weekStartsOn, showWeekNumbers });
  const { ref, isDropTarget } = useDroppable({ id: `${ALL_DAY_PREFIX}${day.index}` });

  return (
    <section
      ref={ref}
      data-allday-cell={day.key}
      style={{ width }}
      className={cn(
        "flex shrink-0 flex-col rounded-2xl border bg-card/90 backdrop-blur-sm transition-colors",
        current ? "border-primary/50" : "border-border/70",
        isDropTarget && "border-primary bg-primary/5"
      )}
    >
      <div className="sticky left-4 w-max max-w-[min(48rem,calc(100vw-2rem))]">
        <header className="flex items-baseline gap-2 px-4 pb-1 pt-3">
          <h3 className="text-sm font-semibold tracking-tight">
            {label.title} {label.eyebrow}
          </h3>
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            All day
          </span>
        </header>
        <div className="flex flex-wrap items-start gap-x-4 px-2 pb-2">
          <div className="w-72 space-y-0.5">
            {spanning.map((task) => (
              <TaskItem key={task.id} task={task} column={day} planId={planId} contained={false} />
            ))}
            {contained.map((task) => (
              <TaskItem key={task.id} task={task} column={day} planId={planId} contained />
            ))}
          </div>
          <div className="w-64">
            <AddTaskItem
              onCreate={(title) => {
                void addTask(createTask({ title, ...defaultTaskRange(day) }));
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface AllDayBandProps {
  days: TimeColumn[];
  from: number;
  to: number;
  /** Width of one hour column plus its gap. */
  pitch: number;
  gap: number;
  tasks: Task[];
  planId: string;
  todayIndex: number;
}

function hoursOf(day: TimeColumn): number {
  return (day.end.getTime() - day.start.getTime()) / 3_600_000;
}

export function AllDayBand({ days, from, to, pitch, gap, tasks, planId, todayIndex }: AllDayBandProps) {
  if (days.length === 0) return null;
  const leading = from > 0 ? days.slice(0, from).reduce((sum, day) => sum + hoursOf(day), 0) * pitch - gap : 0;
  const trailing =
    to < days.length - 1 ? days.slice(to + 1).reduce((sum, day) => sum + hoursOf(day), 0) * pitch - gap : 0;

  return (
    <div className="flex shrink-0 items-stretch" style={{ gap }}>
      {leading > 0 && <div aria-hidden className="shrink-0" style={{ width: leading }} />}
      {days.slice(from, to + 1).map((day) => (
        <AllDayCell
          key={day.key}
          day={day}
          tasks={tasks}
          planId={planId}
          current={day.index === todayIndex}
          width={hoursOf(day) * pitch - gap}
        />
      ))}
      {trailing > 0 && <div aria-hidden className="shrink-0" style={{ width: trailing }} />}
    </div>
  );
}
