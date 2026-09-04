import type { Interval } from "@/lib/time/local";

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
}

export interface LaneItem {
  id: string;
  taskId: string;
  title: string;
  memberIds: string[];
  lane: number;
  x: number;
  width: number;
  labelWidth: number;
  occupiedUntil: number;
  kind: LaneItemKind;
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
  return {
    id: placed.task.id,
    taskId: placed.task.id,
    title: placed.task.title,
    memberIds: [placed.task.id],
    lane: 0,
    x: placed.x,
    width: placed.width,
    labelWidth: 0,
    occupiedUntil: 0,
    kind: placed.kind,
  };
}

function toCluster(group: Placed[]): LaneItem {
  const last = group[group.length - 1];
  const memberIds = group.map((item) => item.task.id);
  return {
    id: `cluster:${memberIds.join(":")}`,
    taskId: memberIds[0],
    title: `${memberIds.length} tasks`,
    memberIds,
    lane: 0,
    x: group[0].x,
    width: Math.max(CLUSTER_PX, last.x + last.width - group[0].x),
    labelWidth: 0,
    occupiedUntil: 0,
    kind: "cluster",
  };
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
