import { differenceInCalendarDays } from "date-fns";
import { compareByTime, isScheduled } from "@/lib/domain/items";
import { isAllDay, parseLocal } from "@/lib/time/local";
import type { ItemKind, PlanItem } from "@/types";

/**
 * Hierarchy helpers. The tree is objective > project > task > subtask, with
 * events allowed under objectives and projects and prep tasks under events.
 * A task whose parent is a task is a subtask and stays folded into its parent.
 */

export function childrenOf(parentId: string, items: PlanItem[]): PlanItem[] {
  return items.filter((item) => item.parentId === parentId).sort(compareByTime);
}

export function hasChildren(parentId: string, items: PlanItem[]): boolean {
  return items.some((item) => item.parentId === parentId);
}

/** A subtask is a task nested under another task (any depth below the first task). */
export function isSubtask(item: PlanItem, byId: Map<string, PlanItem>): boolean {
  if (item.kind !== "task" || !item.parentId) return false;
  const parent = byId.get(item.parentId);
  return parent?.kind === "task";
}

export function indexById(items: PlanItem[]): Map<string, PlanItem> {
  return new Map(items.map((item) => [item.id, item]));
}

/** Items to draw as their own entries: everything except subtasks. */
export function withoutSubtasks(items: PlanItem[]): PlanItem[] {
  const byId = indexById(items);
  return items.filter((item) => !isSubtask(item, byId));
}

/**
 * Like `withoutSubtasks`, but a subtask whose direct parent is in
 * `expandedIds` is drawn on its own. Nested children stay folded until
 * their own parent is expanded.
 */
export function withExpandedChildren(items: PlanItem[], expandedIds: Iterable<string>): PlanItem[] {
  const expanded = expandedIds instanceof Set ? expandedIds : new Set(expandedIds);
  if (expanded.size === 0) return withoutSubtasks(items);
  const byId = indexById(items);
  return items.filter((item) => {
    if (!isSubtask(item, byId)) return true;
    return Boolean(item.parentId && expanded.has(item.parentId));
  });
}

/** A timed start is an explicit calendar slot, not just a date on the parent. */
export function hasOwnCalendarSlot(item: PlanItem): boolean {
  return isScheduled(item) && !isAllDay(item.start);
}

/**
 * Events always occupy the grid. A task does only when it is a real slot:
 * timed, a single day, or a short all-day span. Unscheduled and long-running
 * work stays in Plan.
 */
export function isPlacedOnGrid(item: PlanItem): boolean {
  if (!isScheduled(item)) return false;
  if (item.kind === "event") return true;
  if (item.kind !== "task") return false;
  if (hasOwnCalendarSlot(item)) return true;
  if (!item.end) return true;
  return differenceInCalendarDays(parseLocal(item.end), parseLocal(item.start)) <= 2;
}

/**
 * Children drawn inside the parent card. Timed children keep their own slot
 * on the grid; all-day nested work stays in the tree.
 */
export function nestedChildren(parentId: string, items: PlanItem[]): PlanItem[] {
  const byId = indexById(items);
  const parent = byId.get(parentId);
  return childrenOf(parentId, items).filter((child) => {
    if (child.kind !== "task" || hasOwnCalendarSlot(child)) return false;
    if (parent?.kind === "event") return true;
    return isSubtask(child, byId);
  });
}

export function hasNestedChildren(parentId: string, items: PlanItem[]): boolean {
  return nestedChildren(parentId, items).length > 0;
}

/** Direct children that a chevron reveals: tasks nested under a task. */
export function foldableChildren(parentId: string, items: PlanItem[]): PlanItem[] {
  return nestedChildren(parentId, items);
}

export function hasFoldableChildren(parentId: string, items: PlanItem[]): boolean {
  return hasNestedChildren(parentId, items);
}

/** Items that occupy their own place on the calendar grid. */
export function calendarEntries(items: PlanItem[]): PlanItem[] {
  const byId = indexById(items);
  return items.filter((item) => {
    if (!isScheduled(item)) return false;
    if (item.kind === "objective" || item.kind === "project") return false;
    if (item.kind === "event") return true;
    if (item.kind !== "task" || !isPlacedOnGrid(item)) return false;
    if (!item.parentId) return true;
    const parent = byId.get(item.parentId);
    if (parent?.kind === "task" || parent?.kind === "event") return hasOwnCalendarSlot(item);
    return true;
  });
}

/**
 * Deadlines that need a marker on the grid although the work itself has no
 * slot there: unscheduled tasks, and projects (never drawn as chips).
 */
export function dueMarkers(items: PlanItem[]): PlanItem[] {
  return items.filter((item) => {
    if (!item.due || item.draft) return false;
    if (item.kind === "project") return true;
    return item.kind === "task" && !calendarEntries([item]).length;
  });
}

/** Parent ids from the item up to the root, closest first. */
export function ancestorIds(item: PlanItem, byId: Map<string, PlanItem>): string[] {
  const ids: string[] = [];
  let current = item.parentId ? byId.get(item.parentId) : undefined;
  while (current) {
    ids.push(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return ids;
}

/** Closest project ancestor, or the item itself when it is a project. */
export function projectOf(item: PlanItem, byId: Map<string, PlanItem>): PlanItem | undefined {
  let current: PlanItem | undefined = item;
  while (current) {
    if (current.kind === "project") return current;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return undefined;
}

/** Closest objective ancestor, or the item itself when it is an objective. */
export function objectiveOf(item: PlanItem, byId: Map<string, PlanItem>): PlanItem | undefined {
  let current: PlanItem | undefined = item;
  while (current) {
    if (current.kind === "objective") return current;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return undefined;
}

export interface ChildProgress {
  done: number;
  total: number;
}

/** Direct children only: what the user reads as "2/5" on the parent. */
export function childProgress(parentId: string, items: PlanItem[]): ChildProgress {
  let done = 0;
  let total = 0;
  for (const item of items) {
    if (item.parentId !== parentId) continue;
    total += 1;
    if (item.status === "completed" || item.status === "cancelled") done += 1;
  }
  return { done, total };
}

/** What the children of an item are called, from the user's point of view. */
export function childNoun(parentKind: ItemKind, count = 2): string {
  const plural = count !== 1;
  if (parentKind === "objective") return plural ? "projects and tasks" : "project or task";
  if (parentKind === "project") return plural ? "tasks" : "task";
  if (parentKind === "event") return plural ? "prep tasks" : "prep task";
  return plural ? "subtasks" : "subtask";
}
