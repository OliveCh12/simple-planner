"use client";

import { memo, useMemo } from "react";
import { useDroppable } from "@dnd-kit/react";
import { AddTaskItem } from "@/components/task/AddTaskItem";
import { TaskItem } from "@/components/task/TaskItem";
import { Badge } from "@/components/ui/badge";
import {
  countCompleted,
  createTask,
  defaultTaskRange,
  groupTasksByMonth,
  tasksInColumn,
  type PlacedTask,
} from "@/lib/plan";
import { columnLabel } from "@/lib/time/labels";
import type { TimeColumn as TimeColumnModel } from "@/lib/time/scale";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";
import { useUIStore } from "@/store/uiStore";

interface TimeColumnProps {
  column: TimeColumnModel;
  tasks: PlacedTask[];
  planId: string;
  selected: boolean;
  current: boolean;
  past: boolean;
  onSelect: (index: number) => void;
}

export const TimeColumn = memo(function TimeColumn({
  column,
  tasks,
  planId,
  selected,
  current,
  past,
  onSelect,
}: TimeColumnProps) {
  const addTask = usePlanStore((s) => s.addTask);
  const weekStartsOn = useUIStore((s) => s.settings.firstDayOfWeek);
  const showWeekNumbers = useUIStore((s) => s.settings.showWeekNumbers);
  const { spanning, contained } = useMemo(() => tasksInColumn(tasks, column), [tasks, column]);
  const groups = useMemo(
    () => (column.scale === "year" ? groupTasksByMonth(contained) : null),
    [column.scale, contained]
  );
  const total = spanning.length + contained.length;
  const completed = countCompleted(spanning) + countCompleted(contained);
  const label = columnLabel(column, { weekStartsOn, showWeekNumbers });
  const { ref, isDropTarget } = useDroppable({ id: column.key });

  return (
    <section
      ref={ref}
      data-column={column.key}
      className={cn(
        "flex shrink-0 flex-col self-stretch rounded-2xl border bg-card transition-colors",
        current ? "border-primary/50" : "border-border/70",
        isDropTarget && "border-primary bg-primary/5",
        past && !selected && "opacity-70 hover:opacity-100"
      )}
    >
      <header
        className="flex cursor-pointer items-start justify-between gap-2 px-4 pb-2 pt-4"
        onClick={() => onSelect(column.index)}
      >
        <div>
          {label.eyebrow && (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {label.eyebrow}
            </p>
          )}
          <h3 className="text-[17px] font-semibold leading-tight tracking-tight">{label.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {completed}/{total}
            </span>
          )}
          {current && <Badge>Now</Badge>}
        </div>
      </header>

      <div data-column-scroll className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
        {spanning.map((task) => (
          <TaskItem key={task.id} task={task} column={column} planId={planId} contained={false} />
        ))}
        {spanning.length > 0 && contained.length > 0 && (
          <div className="mx-1.5 !my-1.5 border-t border-border/60" />
        )}
        {groups
          ? groups.map((group) => (
              <div key={group.key}>
                <p className="sticky top-0 z-10 bg-card px-1.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  {group.label}
                </p>
                {group.tasks.map((task) => (
                  <TaskItem key={task.id} task={task} column={column} planId={planId} contained />
                ))}
              </div>
            ))
          : contained.map((task) => (
              <TaskItem key={task.id} task={task} column={column} planId={planId} contained />
            ))}
      </div>

      <div className="px-2 pb-2 pt-1">
        <AddTaskItem
          onCreate={(title) => {
            void addTask(createTask({ title, ...defaultTaskRange(column) }));
          }}
        />
      </div>
    </section>
  );
});
