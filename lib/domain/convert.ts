import type { HydratedPlan, Plan, PlanItem, Task } from "@/types";

/** Flatten a plan item into the task shape the current timeline still renders. */
export function itemToTask(item: PlanItem): Task {
  const task: Task = {
    id: item.id,
    title: item.title,
    notes: item.notes,
    start: item.start,
    end: item.end ?? item.start,
    status: item.status,
    energy: item.energy,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
  if (item.completedAt) task.completedAt = item.completedAt;
  return task;
}

/** Lift a task-shaped view back into a PlanItem, keeping extra fields when known. */
export function taskToItem(task: Task, planId: string, existing?: PlanItem): PlanItem {
  const item: PlanItem = {
    id: task.id,
    planId,
    kind: existing?.kind ?? "task",
    title: task.title,
    notes: task.notes,
    start: task.start,
    end: task.end,
    status: task.status,
    energy: task.energy,
    executor: existing?.executor ?? "human",
    assigneeIds: existing?.assigneeIds ?? [],
    attendeeIds: existing?.attendeeIds ?? [],
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
  if (existing?.parentId) item.parentId = existing.parentId;
  if (existing?.recurrence) item.recurrence = existing.recurrence;
  if (existing?.recurrenceExceptions) item.recurrenceExceptions = existing.recurrenceExceptions;
  if (existing?.agentBrief) item.agentBrief = existing.agentBrief;
  if (existing?.categoryId) item.categoryId = existing.categoryId;
  if (existing?.location) item.location = existing.location;
  if (task.completedAt) item.completedAt = task.completedAt;
  else if (existing?.completedAt && task.status === "completed") item.completedAt = existing.completedAt;
  return item;
}

export function hydratePlan(plan: Plan, items: PlanItem[]): HydratedPlan {
  return {
    ...plan,
    tasks: items.filter((item) => item.kind === "task").map(itemToTask),
  };
}
