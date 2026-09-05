import { intervalOf, parseLocal } from "@/lib/time/local";
import type { PlanItem } from "@/types";
import type { ItemFilter } from "@/lib/repository/types";

function matchesList<T>(value: T, filter: T | T[] | undefined): boolean {
  if (filter === undefined) return true;
  return Array.isArray(filter) ? filter.includes(value) : filter === value;
}

export function itemMatches(item: PlanItem, filter: ItemFilter): boolean {
  if (filter.planId !== undefined && item.planId !== filter.planId) return false;
  if (!matchesList(item.kind, filter.kind)) return false;
  if (!matchesList(item.executor, filter.executor)) return false;
  if (!matchesList(item.status, filter.status)) return false;
  if (filter.parentId !== undefined) {
    if (filter.parentId === null && item.parentId !== undefined) return false;
    if (filter.parentId !== null && item.parentId !== filter.parentId) return false;
  }
  if (filter.categoryId !== undefined && item.categoryId !== filter.categoryId) return false;
  if (filter.assigneeId !== undefined && !item.assigneeIds.includes(filter.assigneeId)) return false;
  if (filter.attendeeId !== undefined && !item.attendeeIds.includes(filter.attendeeId)) return false;
  if (filter.query) {
    const q = filter.query.toLowerCase();
    if (!item.title.toLowerCase().includes(q) && !item.notes.toLowerCase().includes(q)) return false;
  }
  if (filter.from !== undefined || filter.to !== undefined) {
    const range = {
      start: filter.from ? parseLocal(filter.from) : new Date(-8640000000000000),
      end: filter.to ? parseLocal(filter.to) : new Date(8640000000000000),
    };
    // Unscheduled work falls back to its deadline; with neither it has no place in a period.
    const anchor = item.start ?? item.due;
    if (anchor === undefined) return false;
    const interval = intervalOf({ start: anchor, end: item.start ? item.end : undefined });
    if (interval.end <= range.start || interval.start >= range.end) return false;
  }
  return true;
}
