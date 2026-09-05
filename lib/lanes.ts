import { expandRecurrence } from "@/lib/time/recurrence";
import { intervalOf, intersects, isAllDay, type Interval } from "@/lib/time/local";
import type { Category, ItemKind, ItemStatus, PlanItem } from "@/types";

export const MIN_BAR_PX = 8;
export const MILESTONE_PX = 10;
export const LANE_GAP_PX = 4;
export const LABEL_CHAR_PX = 8.5;
export const LABEL_PAD_PX = 24;
export const CLUSTER_PX = 24;
export const ALL_DAY_LANE_PX = 32;
export const TIMED_LANE_PX = { coarse: 26, fine: 36 } as const;
const MILESTONE_MS = 60_000;

export function estimateLabelWidth(title: string): number {
  return Math.ceil(title.length * LABEL_CHAR_PX) + LABEL_PAD_PX;
}

export type LaneItemKind = "bar" | "milestone" | "cluster";

export interface LaneTask {
  id: string;
  title: string;
  interval: Interval;
  allDay: boolean;
  itemId?: string;
  itemKind?: ItemKind;
  status?: ItemStatus;
  categoryColor?: string;
  recurring?: boolean;
  primary?: boolean;
  occurrenceStart?: string;
  occurrenceEnd?: string;
}

export interface LaneItem {
  id: string;
  taskId: string;
  itemId: string;
  title: string;
  memberIds: string[];
  lane: number;
  x: number;
  width: number;
  labelWidth: number;
  occupiedUntil: number;
  kind: LaneItemKind;
  itemKind?: ItemKind;
  categoryColor?: string;
  recurring?: boolean;
  primary?: boolean;
  occurrenceStart?: string;
  occurrenceEnd?: string;
}

export interface LaneGroup {
  id: string;
  title: string;
  color?: string;
  done: number;
  total: number;
  tasks: LaneTask[];
}

export interface LaneStack {
  laneCount: number;
  items: LaneItem[];
}

export interface LaneLayout {
  allDay: LaneStack;
  timed: LaneStack;
}

interface Placed {
  task: LaneTask;
  x: number;
  width: number;
  kind: "bar" | "milestone";
}

/**
 * Cluster tiny bars on the time axis first (otherwise overlapping pills each
 * take a lane and never merge), then pack with label overflow into lanes.
 */
export function layoutLanes(
  tasks: LaneTask[],
  xOf: (instant: Date) => number
): LaneLayout {
  const allDay: LaneTask[] = [];
  const timed: LaneTask[] = [];
  for (const task of tasks) {
    (task.allDay ? allDay : timed).push(task);
  }
  return {
    allDay: stackLanes(allDay, xOf),
    timed: stackLanes(timed, xOf),
  };
}

function sourceId(task: LaneTask): string {
  return task.itemId ?? task.id;
}

function isMilestone(task: LaneTask): boolean {
  return (
    !task.allDay && task.interval.end.getTime() - task.interval.start.getTime() <= MILESTONE_MS
  );
}

function place(task: LaneTask, xOf: (instant: Date) => number): Placed {
  const startX = xOf(task.interval.start);
  const raw = xOf(task.interval.end) - startX;
  if (isMilestone(task)) {
    return {
      task,
      x: startX - MILESTONE_PX / 2,
      width: MILESTONE_PX,
      kind: "milestone",
    };
  }
  return {
    task,
    x: startX,
    width: Math.max(raw, MIN_BAR_PX),
    kind: "bar",
  };
}

function stackLanes(tasks: LaneTask[], xOf: (instant: Date) => number): LaneStack {
  const placed = tasks.map((task) => place(task, xOf));
  placed.sort((a, b) => a.x - b.x || a.task.id.localeCompare(b.task.id));
  return pack(cluster(placed));
}

function cluster(placed: Placed[]): LaneItem[] {
  const tiny: Placed[] = [];
  const items: LaneItem[] = [];
  for (const item of placed) {
    if (item.width < CLUSTER_PX) tiny.push(item);
    else items.push(toItem(item));
  }

  let index = 0;
  while (index < tiny.length) {
    const group = [tiny[index]];
    let next = index + 1;
    while (next < tiny.length && tiny[next].x - group[0].x < CLUSTER_PX) {
      group.push(tiny[next]);
      next += 1;
    }
    items.push(group.length >= 2 ? toCluster(group) : toItem(group[0]));
    index = next;
  }
  return items;
}

function toItem(placed: Placed): LaneItem {
  const itemId = sourceId(placed.task);
  return {
    id: placed.task.id,
    taskId: itemId,
    itemId,
    title: placed.task.title,
    memberIds: [itemId],
    lane: 0,
    x: placed.x,
    width: placed.width,
    labelWidth: 0,
    occupiedUntil: 0,
    kind: placed.kind,
    itemKind: placed.task.itemKind,
    categoryColor: placed.task.categoryColor,
    recurring: placed.task.recurring,
    primary: placed.task.primary ?? true,
    occurrenceStart: placed.task.occurrenceStart,
    occurrenceEnd: placed.task.occurrenceEnd,
  };
}

function toCluster(group: Placed[]): LaneItem {
  const last = group[group.length - 1];
  const memberIds = [...new Set(group.map((item) => sourceId(item.task)))];
  return {
    id: `cluster:${group.map((item) => item.task.id).join(":")}`,
    taskId: memberIds[0],
    itemId: memberIds[0],
    title: `${memberIds.length} items`,
    memberIds,
    lane: 0,
    x: group[0].x,
    width: Math.max(CLUSTER_PX, last.x + last.width - group[0].x),
    labelWidth: 0,
    occupiedUntil: 0,
    kind: "cluster",
  };
}

export function rootObjectiveId(item: PlanItem, byId: Map<string, PlanItem>): string | null {
  const seen = new Set<string>();
  let cursor: PlanItem | undefined = item;
  let found: string | null = null;
  while (cursor && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    if (cursor.kind === "objective") found = cursor.id;
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  return found;
}

export function laneTasksFromItems(
  items: PlanItem[],
  range: Interval,
  categories: Category[] = []
): LaneTask[] {
  const colorById = new Map(categories.map((category) => [category.id, category.color]));
  const out: LaneTask[] = [];

  for (const item of items) {
    let occurrences;
    try {
      occurrences = expandRecurrence(item, range);
    } catch {
      const interval = intervalOf(item);
      if (!intersects(interval, range)) continue;
      occurrences = item.end === undefined ? [{ start: item.start }] : [{ start: item.start, end: item.end }];
    }

    for (const occurrence of occurrences) {
      const task: LaneTask = {
        id: item.recurrence ? `${item.id}::${occurrence.start}` : item.id,
        itemId: item.id,
        title: item.title,
        interval: intervalOf({ start: occurrence.start, end: occurrence.end }),
        allDay: isAllDay(occurrence.start),
        itemKind: item.kind,
        status: item.status,
        recurring: Boolean(item.recurrence),
        primary: !item.recurrence || occurrence.start === item.start,
        occurrenceStart: occurrence.start,
        occurrenceEnd: occurrence.end ?? occurrence.start,
      };
      if (item.categoryId) {
        const color = colorById.get(item.categoryId);
        if (color) task.categoryColor = color;
      }
      out.push(task);
    }
  }

  return out;
}

export function groupByObjective(items: PlanItem[], tasks: LaneTask[], categories: Category[] = []): LaneGroup[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const colorById = new Map(categories.map((category) => [category.id, category.color]));
  const buckets = new Map<string, LaneTask[]>();

  for (const task of tasks) {
    const source = byId.get(sourceId(task));
    const groupId = source ? rootObjectiveId(source, byId) ?? "unsorted" : "unsorted";
    const list = buckets.get(groupId) ?? [];
    list.push(task);
    buckets.set(groupId, list);
  }

  const groups: LaneGroup[] = [];
  const roots = items
    .filter((item) => item.kind === "objective" && !item.parentId)
    .sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));

  for (const objective of roots) {
    const grouped = buckets.get(objective.id);
    if (!grouped?.length) continue;
    const members = uniqueSources(grouped, byId);
    groups.push({
      id: objective.id,
      title: objective.title,
      color: objective.categoryId ? colorById.get(objective.categoryId) : undefined,
      done: members.filter((member) => member.status === "completed").length,
      total: members.length,
      tasks: grouped,
    });
  }

  const unsorted = buckets.get("unsorted");
  if (unsorted?.length) {
    const members = uniqueSources(unsorted, byId);
    groups.push({
      id: "unsorted",
      title: "No objective",
      done: members.filter((member) => member.status === "completed").length,
      total: members.length,
      tasks: unsorted,
    });
  }

  return groups;
}

function uniqueSources(tasks: LaneTask[], byId: Map<string, PlanItem>): PlanItem[] {
  const seen = new Set<string>();
  const members: PlanItem[] = [];
  for (const task of tasks) {
    const id = sourceId(task);
    if (seen.has(id)) continue;
    seen.add(id);
    const item = byId.get(id);
    if (item) members.push(item);
  }
  return members;
}

function pack(items: LaneItem[]): LaneStack {
  const sorted = items.slice().sort((a, b) => {
    const byX = a.x - b.x;
    if (byX !== 0) return byX;
    const byWidth = b.width - a.width;
    if (byWidth !== 0) return byWidth;
    return a.id.localeCompare(b.id);
  });

  const laneEnds: number[] = [];
  for (const item of sorted) {
    item.labelWidth = estimateLabelWidth(item.title);
    item.occupiedUntil = Math.max(item.x + item.width, item.x + item.labelWidth) + LANE_GAP_PX;
    let lane = laneEnds.findIndex((end) => end <= item.x);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.occupiedUntil);
    } else {
      laneEnds[lane] = item.occupiedUntil;
    }
    item.lane = lane;
  }

  return { laneCount: laneEnds.length, items: sorted };
}
