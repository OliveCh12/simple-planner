import { isCalendarActive } from "@/lib/calendar";
import { childProgress, childrenOf, indexById, isSubtask, objectiveOf } from "@/lib/domain/tree";
import { expandRecurrence } from "@/lib/time/recurrence";
import { intervalOf, intersects, parseLocal, type Interval } from "@/lib/time/local";
import type { PlanItem, TimeScale } from "@/types";

export interface PlanningObjective {
  item: PlanItem;
  progress: { done: number; total: number };
  events: PlanItem[];
  tasks: PlanItem[];
}

export interface PlanningPrep {
  event: PlanItem;
  tasks: PlanItem[];
}

export interface PlanningContext {
  objectives: PlanningObjective[];
  prep: PlanningPrep[];
  open: PlanItem[];
}

function touchesRange(item: PlanItem, range: Interval): boolean {
  try {
    return expandRecurrence(item, range).length > 0;
  } catch {
    return intersects(intervalOf(item), range);
  }
}

export function linkedObjective(item: PlanItem, items: PlanItem[], byId: Map<string, PlanItem>): PlanItem | undefined {
  const fromTree = objectiveOf(item, byId);
  if (fromTree) return fromTree;
  if (item.kind !== "event" || !item.categoryId) return undefined;
  const span = intervalOf(item);
  return items.find(
    (candidate) =>
      candidate.kind === "objective" &&
      isCalendarActive(candidate.status) &&
      candidate.categoryId === item.categoryId &&
      intersects(intervalOf(candidate), span)
  );
}

function uniqueById(items: PlanItem[]): PlanItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * What the left pane should show for the visible period.
 * Year stays at objectives; week and day add event prep and still-open work.
 */
export function planningContext(items: PlanItem[], range: Interval, scale: TimeScale): PlanningContext {
  const byId = indexById(items);
  const objectives = items
    .filter((item) => item.kind === "objective" && touchesRange(item, range) && isCalendarActive(item.status))
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));

  const eventsHere = items.filter((item) => item.kind === "event" && touchesRange(item, range) && isCalendarActive(item.status));

  const groups: PlanningObjective[] = objectives.map((objective) => {
    const kids = childrenOf(objective.id, items);
    const linkedEvents = uniqueById([
      ...kids.filter((child) => child.kind === "event" && isCalendarActive(child.status)),
      ...eventsHere.filter((event) => linkedObjective(event, items, byId)?.id === objective.id),
    ]);
    const tasks = kids.filter((child) => child.kind === "task" && isCalendarActive(child.status));
    return {
      item: objective,
      progress: childProgress(objective.id, items),
      events: linkedEvents,
      tasks,
    };
  });

  if (scale === "year") {
    return { objectives: groups.map((group) => ({ ...group, events: [], tasks: [] })), prep: [], open: [] };
  }

  const taskCap = scale === "month" ? 4 : 3;
  const trimmed = groups.map((group) => ({
    ...group,
    events: scale === "month" ? group.events : group.events.filter((event) => touchesRange(event, range)),
    tasks: group.tasks.slice(0, taskCap),
  }));

  const prep: PlanningPrep[] = [];
  if (scale === "week" || scale === "day" || scale === "hour") {
    for (const event of eventsHere) {
      const nested = childrenOf(event.id, items).filter((child) => child.kind === "task" && child.status !== "cancelled");
      if (nested.length === 0) continue;
      prep.push({ event, tasks: nested });
    }
  }

  const open =
    scale === "month"
      ? []
      : items
          .filter((item) => {
            if (item.kind !== "task" || !isCalendarActive(item.status)) return false;
            if (isSubtask(item, byId)) return false;
            const direct = item.parentId ? byId.get(item.parentId) : undefined;
            if (direct?.kind === "event") return false;
            if (touchesRange(item, range)) return false;
            const parent = objectiveOf(item, byId);
            if (!parent || !touchesRange(parent, range)) return false;
            return parseLocal(item.start) < range.start;
          })
          .slice(0, 6);

  return { objectives: trimmed, prep, open };
}
