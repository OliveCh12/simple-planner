import { isCalendarActive } from "@/lib/calendar";
import { compareKeys, isScheduled } from "@/lib/domain/items";
import { childProgress, childrenOf, indexById, isPlacedOnGrid, isSubtask, objectiveOf, projectOf } from "@/lib/domain/tree";
import { isToSchedule } from "@/lib/planning/views";
import { expandRecurrence } from "@/lib/time/recurrence";
import { formatLocalDate, intervalOf, intersects, type Interval } from "@/lib/time/local";
import type { PlanItem, TimeScale } from "@/types";

export interface PlanningObjective {
  item: PlanItem;
  progress: { done: number; total: number };
  /** Projects under this goal that matter in the period. */
  projects: PlanningProject[];
  events: PlanItem[];
  tasks: PlanItem[];
  toSchedule: PlanItem[];
}

export interface PlanningProject {
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
  /** Projects with no goal above them. */
  projects: PlanningProject[];
  prep: PlanningPrep[];
  toSchedule: PlanItem[];
  /** Unscheduled work left out of `toSchedule` by the cap; Plan shows it all. */
  moreToSchedule: number;
}

function touchesRange(item: PlanItem, range: Interval): boolean {
  if (!isScheduled(item)) {
    if (!item.due) return false;
    return intersects(intervalOf({ start: item.due }), range);
  }
  try {
    return expandRecurrence(item, range).length > 0;
  } catch {
    return intersects(intervalOf(item), range);
  }
}

/** Dated containers that overlap the period, undated ones that are still open. */
function activeInRange(item: PlanItem, range: Interval): boolean {
  if (!isCalendarActive(item.status)) return false;
  if (!isScheduled(item)) return !item.due || item.due >= formatLocalDate(range.start) || touchesRange(item, range);
  return touchesRange(item, range);
}

/** Explicit tree only — never guess from category. */
export function linkedObjective(item: PlanItem, byId: Map<string, PlanItem>): PlanItem | undefined {
  return objectiveOf(item, byId);
}

function projectGroup(project: PlanItem, live: PlanItem[], range: Interval, scale: TimeScale, cap: number): PlanningProject {
  const kids = childrenOf(project.id, live);
  const events = kids.filter((child) => child.kind === "event" && isCalendarActive(child.status));
  const tasks = kids.filter((child) => child.kind === "task" && isCalendarActive(child.status));
  return {
    item: project,
    progress: childProgress(project.id, live),
    events: events.filter((event) => scale === "year" || scale === "month" || touchesRange(event, range)),
    tasks: tasks.filter((task) => isPlacedOnGrid(task) && (scale === "year" || touchesRange(task, range))).slice(0, cap),
    toSchedule: tasks.filter((task) => !isPlacedOnGrid(task)).slice(0, cap),
  };
}

/**
 * Plan pane for the visible period.
 * Standalone events stay on the grid; this pane is goals, projects, prep, and
 * work still to place. Never the whole task list: Plan is for that.
 */
export function planningContext(items: PlanItem[], range: Interval, scale: TimeScale): PlanningContext {
  const live = items.filter((item) => !item.draft);
  const byId = indexById(live);
  const taskCap = scale === "year" ? 0 : scale === "month" ? 5 : 4;

  const objectives = live
    .filter((item) => item.kind === "objective" && activeInRange(item, range))
    .sort((a, b) => compareKeys(a.start ?? "~", b.start ?? "~") || a.title.localeCompare(b.title));

  const groups: PlanningObjective[] = objectives.map((objective) => {
    const kids = childrenOf(objective.id, live);
    const projects = kids
      .filter((child) => child.kind === "project" && activeInRange(child, range))
      .map((project) => projectGroup(project, live, range, scale, taskCap));
    const events = kids.filter((child) => child.kind === "event" && isCalendarActive(child.status));
    const tasks = kids.filter((child) => child.kind === "task" && isCalendarActive(child.status));
    return {
      item: objective,
      progress: childProgress(objective.id, live),
      projects,
      events: events.filter((event) => scale === "year" || scale === "month" || touchesRange(event, range)),
      tasks: tasks.filter((task) => isPlacedOnGrid(task) && (scale === "year" || touchesRange(task, range))).slice(0, taskCap),
      toSchedule: tasks.filter((task) => !isPlacedOnGrid(task)).slice(0, taskCap),
    };
  });

  const projects = live
    .filter((item) => item.kind === "project" && !item.parentId && activeInRange(item, range))
    .sort((a, b) => compareKeys(a.start ?? "~", b.start ?? "~") || a.title.localeCompare(b.title))
    .map((project) => projectGroup(project, live, range, scale, taskCap));

  if (scale === "year") {
    return {
      objectives: groups.map((group) => ({
        ...group,
        projects: group.projects.map((project) => ({ ...project, tasks: [], toSchedule: [] })),
        tasks: [],
        toSchedule: [],
      })),
      projects: projects.map((project) => ({ ...project, tasks: [], toSchedule: [] })),
      prep: [],
      toSchedule: [],
      moreToSchedule: 0,
    };
  }

  const prep: PlanningPrep[] = [];
  if (scale === "week" || scale === "day" || scale === "hour") {
    for (const item of live) {
      if (item.kind !== "event" || !touchesRange(item, range) || !isCalendarActive(item.status)) continue;
      const nested = live.filter(
        (child) =>
          child.kind === "task" &&
          child.status !== "cancelled" &&
          (child.parentId === item.id || child.linkedIds?.includes(item.id))
      );
      if (nested.length === 0) continue;
      prep.push({ event: item, tasks: nested });
    }
  }

  const seen = new Set<string>();
  for (const group of groups) {
    for (const task of group.toSchedule) seen.add(task.id);
    for (const project of group.projects) for (const task of project.toSchedule) seen.add(task.id);
  }
  for (const project of projects) for (const task of project.toSchedule) seen.add(task.id);
  for (const entry of prep) for (const task of entry.tasks) seen.add(task.id);

  // Work with no slot that belongs to this period: a deadline inside it, a
  // container active in it, or a link to one of its events.
  const eventIds = new Set(live.filter((item) => item.kind === "event" && touchesRange(item, range)).map((item) => item.id));
  const loose = live.filter((item) => {
    if (!isToSchedule(item, byId) || seen.has(item.id) || isSubtask(item, byId)) return false;
    if (item.due && touchesRange(item, range)) return true;
    if (item.linkedIds?.some((id) => eventIds.has(id))) return true;
    const container = projectOf(item, byId) ?? objectiveOf(item, byId);
    return Boolean(container && activeInRange(container, range));
  });

  const cap = 6;
  return {
    objectives: groups,
    projects,
    prep,
    toSchedule: loose.slice(0, cap),
    moreToSchedule: Math.max(0, loose.length - cap),
  };
}
