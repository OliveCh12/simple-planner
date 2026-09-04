import { subDays } from "date-fns";
import type { EnergyLevel, HydratedPlan, Task, TaskStatus } from "@/types";
import { createPlanRecord } from "@/lib/domain/plans";
import { formatLocalDate, formatLocalDateTime } from "@/lib/time/local";
import type { TimeColumn } from "@/lib/time/scale";

export { createId } from "@/lib/id";
import { createId } from "@/lib/id";

export function createPlan(input: {
  title: string;
  start: string;
  end: string;
  description?: string;
  tasks?: Task[];
}): HydratedPlan {
  const record = createPlanRecord(input);
  return { ...record, tasks: input.tasks ?? [] };
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

export function countCompleted(tasks: Task[]): number {
  return tasks.filter((task) => task.status === "completed").length;
}

/** Range of a new task created from a time unit: the whole unit, timed only at hour scale. */
export function defaultTaskRange(
  column: Pick<TimeColumn, "scale" | "start" | "end">
): { start: string; end: string } {
  if (column.scale === "hour") {
    return { start: formatLocalDateTime(column.start), end: formatLocalDateTime(column.end) };
  }
  return { start: formatLocalDate(column.start), end: formatLocalDate(subDays(column.end, 1)) };
}
