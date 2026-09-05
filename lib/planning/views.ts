import { addDays, differenceInCalendarDays, endOfMonth, endOfWeek, startOfDay } from "date-fns";
import { compareKeys, isScheduled } from "@/lib/domain/items";
import { childProgress, indexById, isSubtask, objectiveOf, projectOf, type ChildProgress } from "@/lib/domain/tree";
import { formatLocalDate, parseLocal } from "@/lib/time/local";
import type { Category, ItemKind, ItemStatus, Plan, PlanItem } from "@/types";

/**
 * The Plan space: what to accomplish, why, and what is next. These helpers
 * are pure so views stay fast on thousands of items and easy to test.
 */

export type PlanView = "inbox" | "schedule" | "projects" | "tasks";

export const ACTIVE_STATUSES: ItemStatus[] = ["pending", "in-progress", "blocked"];

export function isActive(item: PlanItem): boolean {
  return ACTIVE_STATUSES.includes(item.status);
}

/**
 * Inbox: captured, not yet clarified. A task with no slot, no deadline, no
 * parent and no link is waiting for a decision. A category is a tag, not a
 * decision, so it does not move a task out.
 */
export function isInbox(item: PlanItem): boolean {
  if (item.kind !== "task" || item.draft) return false;
  if (item.status !== "pending") return false;
  if (isScheduled(item) || item.due) return false;
  return !item.parentId && !item.linkedIds?.length;
}

/**
 * To schedule: clarified work with no slot. It has a home (parent or link)
 * or a deadline, and is still open.
 */
export function isToSchedule(item: PlanItem, byId: Map<string, PlanItem>): boolean {
  if (item.kind !== "task" || item.draft || !isActive(item)) return false;
  if (isScheduled(item)) return false;
  if (isInbox(item)) return false;
  // A subtask follows its parent; it is not scheduled on its own.
  if (isSubtask(item, byId)) return false;
  return true;
}

export type DueState = "overdue" | "today" | "soon" | "later";

/** How pressing a deadline is, today being the reference civil day. */
export function dueState(due: string | undefined, today: Date = new Date()): DueState | undefined {
  if (!due) return undefined;
  const days = differenceInCalendarDays(parseLocal(due), startOfDay(today));
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "soon";
  return "later";
}

export type DueFilter = "any" | "none" | "overdue" | "today" | "week" | "month";
export type ScheduleFilter = "any" | "scheduled" | "unscheduled";
export type GroupBy = "none" | "project" | "calendar" | "status" | "due" | "category";
export type SortBy = "time" | "title" | "created" | "energy";

export interface TaskFilter {
  query?: string;
  kinds?: ItemKind[];
  planIds?: string[];
  /** Descendants of these projects or objectives, or the container itself. */
  withinIds?: string[];
  statuses?: ItemStatus[];
  categoryIds?: string[];
  assigneeIds?: string[];
  executor?: "human" | "ai";
  due?: DueFilter;
  schedule?: ScheduleFilter;
  /** Scheduled or due inside this civil-date window (inclusive `YYYY-MM-DD`). */
  from?: string;
  to?: string;
  showDone?: boolean;
}

export const DEFAULT_TASK_FILTER: TaskFilter = { kinds: ["task"], showDone: false };

function matchesDue(item: PlanItem, filter: DueFilter | undefined, today: Date): boolean {
  if (!filter || filter === "any") return true;
  if (filter === "none") return !item.due;
  if (!item.due) return false;
  const state = dueState(item.due, today);
  if (filter === "overdue") return state === "overdue";
  if (filter === "today") return state === "today" || state === "overdue";
  if (filter === "week") return item.due <= formatLocalDate(endOfWeek(today, { weekStartsOn: 1 }));
  return item.due <= formatLocalDate(endOfMonth(today));
}

function matchesWindow(item: PlanItem, from: string | undefined, to: string | undefined): boolean {
  if (!from && !to) return true;
  const anchors = [item.start?.slice(0, 10), item.due].filter((value): value is string => Boolean(value));
  if (anchors.length === 0) return false;
  return anchors.some((anchor) => (!from || anchor >= from) && (!to || anchor <= to));
}

/** Ancestor chain ids, closest first, including the item itself. */
function lineage(item: PlanItem, byId: Map<string, PlanItem>): string[] {
  const ids: string[] = [item.id];
  const seen = new Set(ids);
  let current = item.parentId ? byId.get(item.parentId) : undefined;
  while (current && !seen.has(current.id)) {
    ids.push(current.id);
    seen.add(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return ids;
}

export function filterItems(items: PlanItem[], filter: TaskFilter, today: Date = new Date()): PlanItem[] {
  const byId = indexById(items);
  const query = filter.query?.trim().toLowerCase();
  const kinds = filter.kinds?.length ? new Set(filter.kinds) : null;
  const plans = filter.planIds?.length ? new Set(filter.planIds) : null;
  const within = filter.withinIds?.length ? new Set(filter.withinIds) : null;
  const statuses = filter.statuses?.length ? new Set(filter.statuses) : null;
  const categories = filter.categoryIds?.length ? new Set(filter.categoryIds) : null;
  const assignees = filter.assigneeIds?.length ? new Set(filter.assigneeIds) : null;

  return items.filter((item) => {
    if (item.draft) return false;
    if (kinds && !kinds.has(item.kind)) return false;
    if (plans && !plans.has(item.planId)) return false;
    if (statuses ? !statuses.has(item.status) : !filter.showDone && !isActive(item)) return false;
    if (categories && !(item.categoryId && categories.has(item.categoryId))) return false;
    if (assignees && !item.assigneeIds.some((id) => assignees.has(id))) return false;
    if (filter.executor && item.executor !== filter.executor) return false;
    if (within && !lineage(item, byId).some((id) => within.has(id))) return false;
    if (filter.schedule === "scheduled" && !isScheduled(item)) return false;
    if (filter.schedule === "unscheduled" && isScheduled(item)) return false;
    if (!matchesDue(item, filter.due, today)) return false;
    if (!matchesWindow(item, filter.from, filter.to)) return false;
    if (query && !item.title.toLowerCase().includes(query) && !item.notes.toLowerCase().includes(query)) return false;
    return true;
  });
}

const ENERGY_RANK = { critical: 0, high: 1, medium: 2, low: 3 } as const;

export function sortItems(items: PlanItem[], sortBy: SortBy): PlanItem[] {
  const sorted = items.slice();
  switch (sortBy) {
    case "title":
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "created":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case "energy":
      sorted.sort((a, b) => ENERGY_RANK[a.energy] - ENERGY_RANK[b.energy] || a.title.localeCompare(b.title));
      break;
    default:
      // Deadlines first, then dated work, then the rest by creation.
      sorted.sort((a, b) => {
        const aKey = a.due ?? a.start?.slice(0, 10) ?? "~";
        const bKey = b.due ?? b.start?.slice(0, 10) ?? "~";
        return compareKeys(aKey, bKey) || compareKeys(a.createdAt, b.createdAt);
      });
  }
  return sorted;
}

export interface ItemGroup {
  id: string;
  label: string;
  color?: string;
  items: PlanItem[];
}

const STATUS_ORDER: ItemStatus[] = ["in-progress", "blocked", "pending", "completed", "cancelled"];
const STATUS_LABEL: Record<ItemStatus, string> = {
  "in-progress": "In progress",
  blocked: "Blocked",
  pending: "Pending",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function groupItems(
  items: PlanItem[],
  groupBy: GroupBy,
  context: { all: PlanItem[]; plans: Plan[]; categories: Category[]; today?: Date }
): ItemGroup[] {
  if (groupBy === "none") return [{ id: "all", label: "", items }];
  const byId = indexById(context.all);
  const buckets = new Map<string, ItemGroup>();
  const push = (id: string, label: string, item: PlanItem, color?: string) => {
    const bucket = buckets.get(id);
    if (bucket) bucket.items.push(item);
    else buckets.set(id, { id, label, color, items: [item] });
  };

  for (const item of items) {
    if (groupBy === "project") {
      const container = projectOf(item, byId) ?? objectiveOf(item, byId);
      if (container && container.id !== item.id) push(container.id, container.title, item);
      else push("none", "No project", item);
    } else if (groupBy === "calendar") {
      const plan = context.plans.find((entry) => entry.id === item.planId);
      push(item.planId, plan?.title ?? "Calendar", item, plan?.color);
    } else if (groupBy === "status") {
      push(item.status, STATUS_LABEL[item.status], item);
    } else if (groupBy === "category") {
      const category = context.categories.find((entry) => entry.id === item.categoryId);
      if (category) push(category.id, category.name, item, category.color);
      else push("none", "No category", item);
    } else {
      const state = dueState(item.due, context.today);
      const label = state === "overdue" ? "Overdue" : state === "today" ? "Due today" : state === "soon" ? "Due this week" : state === "later" ? "Due later" : "No deadline";
      push(state ?? "none", label, item);
    }
  }

  const groups = [...buckets.values()];
  if (groupBy === "status") groups.sort((a, b) => STATUS_ORDER.indexOf(a.id as ItemStatus) - STATUS_ORDER.indexOf(b.id as ItemStatus));
  else if (groupBy === "due") {
    const order = ["overdue", "today", "soon", "later", "none"];
    groups.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  } else groups.sort((a, b) => (a.id === "none" ? 1 : b.id === "none" ? -1 : a.label.localeCompare(b.label)));
  return groups;
}

export interface PlanNode {
  item: PlanItem;
  progress: ChildProgress;
  children: PlanNode[];
}

/**
 * Projects view: objectives at the root with their projects, then projects
 * without a goal. Tasks and subtasks hang below. Standalone tasks are not
 * here: they belong to the inbox, the schedule and the full list.
 */
export function planTree(items: PlanItem[], options: { showDone?: boolean } = {}): PlanNode[] {
  const live = items.filter((item) => !item.draft && (options.showDone || isActive(item) || item.kind === "objective" || item.kind === "project"));
  const byParent = new Map<string, PlanItem[]>();
  for (const item of live) {
    if (!item.parentId) continue;
    const list = byParent.get(item.parentId) ?? [];
    list.push(item);
    byParent.set(item.parentId, list);
  }
  const sortNodes = (list: PlanItem[]) =>
    list
      .slice()
      .sort(
        (a, b) =>
          kindRank(a.kind) - kindRank(b.kind) ||
          compareKeys(a.due ?? a.start ?? "~", b.due ?? b.start ?? "~") ||
          compareKeys(a.createdAt, b.createdAt)
      );
  const build = (item: PlanItem, depth: number): PlanNode => ({
    item,
    progress: childProgress(item.id, items),
    children: depth > 6 ? [] : sortNodes(byParent.get(item.id) ?? []).map((child) => build(child, depth + 1)),
  });
  const roots = live.filter(
    (item) => (item.kind === "objective" && !item.parentId) || (item.kind === "project" && !item.parentId)
  );
  return sortNodes(roots).map((root) => build(root, 0));
}

function kindRank(kind: ItemKind): number {
  return kind === "objective" ? 0 : kind === "project" ? 1 : kind === "event" ? 2 : 3;
}

/** Counts for the Plan navigation. */
export function planCounts(items: PlanItem[]): { inbox: number; schedule: number; projects: number; tasks: number } {
  const byId = indexById(items);
  let inbox = 0;
  let schedule = 0;
  let projects = 0;
  let tasks = 0;
  for (const item of items) {
    if (item.draft) continue;
    if (isInbox(item)) inbox += 1;
    if (isToSchedule(item, byId)) schedule += 1;
    if ((item.kind === "project" || item.kind === "objective") && isActive(item)) projects += 1;
    if (item.kind === "task" && isActive(item)) tasks += 1;
  }
  return { inbox, schedule, projects, tasks };
}

/** Quick schedule targets offered on an unscheduled task. */
export function quickDates(today: Date = new Date()): { label: string; date: string }[] {
  const day = startOfDay(today);
  const monday = addDays(day, ((8 - day.getDay()) % 7) || 7);
  return [
    { label: "Today", date: formatLocalDate(day) },
    { label: "Tomorrow", date: formatLocalDate(addDays(day, 1)) },
    { label: "Next Monday", date: formatLocalDate(monday) },
  ];
}
