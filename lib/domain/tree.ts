import type { ItemKind, PlanItem } from "@/types";

/**
 * Hierarchy helpers. The tree is objective > task > subtask:
 * a task whose parent is an objective "contributes" to it, a task whose
 * parent is a task is a subtask and stays folded into its parent in views.
 */

export function childrenOf(parentId: string, items: PlanItem[]): PlanItem[] {
  return items
    .filter((item) => item.parentId === parentId)
    .sort((a, b) => a.start.localeCompare(b.start) || a.createdAt.localeCompare(b.createdAt));
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

/** Direct children that a chevron reveals: tasks nested under a task. */
export function foldableChildren(parentId: string, items: PlanItem[]): PlanItem[] {
  const byId = indexById(items);
  return childrenOf(parentId, items).filter((child) => isSubtask(child, byId));
}

export function hasFoldableChildren(parentId: string, items: PlanItem[]): boolean {
  const byId = indexById(items);
  return items.some((item) => item.parentId === parentId && isSubtask(item, byId));
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
  if (parentKind === "objective") return plural ? "tasks" : "task";
  return plural ? "subtasks" : "subtask";
}
