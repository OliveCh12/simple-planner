import { isCalendarActive } from "@/lib/calendar";
import { childProgress, childrenOf, indexById, isPlacedOnGrid, isSubtask, objectiveOf } from "@/lib/domain/tree";
import { expandRecurrence } from "@/lib/time/recurrence";
import { intervalOf, intersects, type Interval } from "@/lib/time/local";
import type { PlanItem, TimeScale } from "@/types";

export interface PlanningObjective {
  item: PlanItem;
  progress: { done: number; total: number };
  events: PlanItem[];
  tasks: PlanItem[];
  toSchedule: PlanItem[];
}

export interface PlanningPrep {
  event: PlanItem;
  tasks: PlanItem[];
}

export interface PlanningContext {
  objectives: PlanningObjective[];
  prep: PlanningPrep[];
  toSchedule: PlanItem[];
}

function touchesRange(item: PlanItem, range: Interval): boolean {
  try {
    return expandRecurrence(item, range).length > 0;
  } catch {
    return intersects(intervalOf(item), range);
  }
}

/** Explicit tree only — never guess from category. */
export function linkedObjective(item: PlanItem, byId: Map<string, PlanItem>): PlanItem | undefined {
  return objectiveOf(item, byId);
}

/**
 * Plan pane for the visible period.
 * Standalone events stay on the grid; this pane is goals, prep, and work to place.
 */
export function planningContext(items: PlanItem[], range: Interval, scale: TimeScale): PlanningContext {
  const byId = indexById(items);
  const objectives = items
    .filter((item) => item.kind === "objective" && touchesRange(item, range) && isCalendarActive(item.status))
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));

  const groups: PlanningObjective[] = objectives.map((objective) => {
    const kids = childrenOf(objective.id, items);
    const events = kids.filter((child) => child.kind === "event" && isCalendarActive(child.status));
    const tasks = kids.filter((child) => child.kind === "task" && isCalendarActive(child.status));
    const toSchedule = tasks.filter((task) => !isPlacedOnGrid(task) || !touchesRange(task, range));
    return {
      item: objective,
      progress: childProgress(objective.id, items),
      events: events.filter((event) => scale === "year" || touchesRange(event, range) || scale === "month"),
      tasks: tasks.filter((task) => isPlacedOnGrid(task) && (scale === "year" || touchesRange(task, range))),
      toSchedule,
    };
  });

  if (scale === "year") {
    return {
      objectives: groups.map((group) => ({ ...group, events: group.events, tasks: [], toSchedule: [] })),
      prep: [],
      toSchedule: [],
    };
  }

  const taskCap = scale === "month" ? 5 : 4;
  const trimmed = groups.map((group) => ({
    ...group,
    events: scale === "month" ? group.events : group.events.filter((event) => touchesRange(event, range)),
    tasks: group.tasks.slice(0, taskCap),
    toSchedule: group.toSchedule.slice(0, taskCap),
  }));

  const prep: PlanningPrep[] = [];
  if (scale === "week" || scale === "day" || scale === "hour") {
    for (const item of items) {
      if (item.kind !== "event" || !touchesRange(item, range) || !isCalendarActive(item.status)) continue;
      const nested = childrenOf(item.id, items).filter((child) => child.kind === "task" && child.status !== "cancelled");
      if (nested.length === 0) continue;
      prep.push({ event: item, tasks: nested });
    }
  }

  const seen = new Set(trimmed.flatMap((group) => group.toSchedule.map((task) => task.id)));
  const loose = items.filter((item) => {
    if (item.kind !== "task" || !isCalendarActive(item.status)) return false;
    if (isSubtask(item, byId)) return false;
    const direct = item.parentId ? byId.get(item.parentId) : undefined;
    if (direct?.kind === "event") return false;
    if (seen.has(item.id)) return false;
    if (isPlacedOnGrid(item) && touchesRange(item, range)) return false;
    const parent = objectiveOf(item, byId);
    return Boolean(parent && touchesRange(parent, range) && !isPlacedOnGrid(item));
  });

  return { objectives: trimmed, prep, toSchedule: loose.slice(0, 8) };
}
