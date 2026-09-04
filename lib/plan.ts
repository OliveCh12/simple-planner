import { subDays } from "date-fns";
import type { EnergyLevel, Plan, Task, TaskStatus } from "@/types";
import {
  contains,
  formatLocalDate,
  formatLocalDateTime,
  intersects,
  intervalOf,
  type Interval,
} from "@/lib/time/local";
import type { TimeColumn } from "@/lib/time/scale";

export function createId(): string {
  return crypto.randomUUID();
}

export function createPlan(input: {
  title: string;
  start: string;
  end: string;
  description?: string;
  tasks?: Task[];
}): Plan {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    start: input.start,
    end: input.end,
    tasks: input.tasks ?? [],
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
  };
}

export function createTask(input: {
  title: string;
  start: string;
  end: string;
  notes?: string;
  status?: TaskStatus;
  energy?: EnergyLevel;
}): Task {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: input.title.trim(),
    notes: input.notes?.trim() ?? "",
    start: input.start,
    end: input.end,
    status: input.status ?? "pending",
    energy: input.energy ?? "medium",
    createdAt: now,
    updatedAt: now,
  };
}

export interface ColumnTasks {
  /** Tasks that overflow the column: same order in every column, so they line up. */
  spanning: Task[];
  /** Tasks that fit entirely in the column, chronologically. */
  contained: Task[];
}

interface Placed {
  task: Task;
  interval: Interval;
}

function bySpanningOrder(a: Placed, b: Placed): number {
  const byStart = a.interval.start.getTime() - b.interval.start.getTime();
  if (byStart !== 0) return byStart;
  const byEnd = b.interval.end.getTime() - a.interval.end.getTime();
  if (byEnd !== 0) return byEnd;
  return a.task.id.localeCompare(b.task.id);
}

function byContainedOrder(a: Placed, b: Placed): number {
  const byStart = a.interval.start.getTime() - b.interval.start.getTime();
  if (byStart !== 0) return byStart;
  const byCreated = a.task.createdAt.localeCompare(b.task.createdAt);
  if (byCreated !== 0) return byCreated;
  return a.task.id.localeCompare(b.task.id);
}

export function tasksInColumn(tasks: Task[], column: Interval): ColumnTasks {
  const spanning: Placed[] = [];
  const contained: Placed[] = [];

  for (const task of tasks) {
    const interval = intervalOf(task);
    if (!intersects(interval, column)) continue;
    (contains(column, interval) ? contained : spanning).push({ task, interval });
  }

  return {
    spanning: spanning.sort(bySpanningOrder).map((placed) => placed.task),
    contained: contained.sort(byContainedOrder).map((placed) => placed.task),
  };
}

export function countCompleted(tasks: Task[]): number {
  return tasks.filter((task) => task.status === "completed").length;
}

/** Range of a new task created from a column: the whole unit, timed only at hour scale. */
export function defaultTaskRange(
  column: Pick<TimeColumn, "scale" | "start" | "end">
): { start: string; end: string } {
  if (column.scale === "hour") {
    return { start: formatLocalDateTime(column.start), end: formatLocalDateTime(column.end) };
  }
  return { start: formatLocalDate(column.start), end: formatLocalDate(subDays(column.end, 1)) };
}
