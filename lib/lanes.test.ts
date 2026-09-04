import { describe, expect, it } from "vitest";
import {
  CLUSTER_PX,
  LABEL_CHAR_PX,
  LABEL_PAD_PX,
  MILESTONE_PX,
  estimateLabelWidth,
  layoutLanes,
  type LaneItem,
  type LaneTask,
} from "@/lib/lanes";
import { intervalOf, isAllDay } from "@/lib/time/local";

const DAY_MS = 86_400_000;
const origin = new Date(2027, 0, 1).getTime();
/** 10 px per day from 1 Jan 2027. */
const xOf = (date: Date) => ((date.getTime() - origin) / DAY_MS) * 10;

function task(id: string, start: string, end: string, title = id): LaneTask {
  return { id, title, interval: intervalOf({ start, end }), allDay: isAllDay(start) };
}

function byId(items: LaneItem[], id: string): LaneItem {
  const item = items.find((entry) => entry.id === id);
  if (!item) throw new Error(`missing ${id}`);
  return item;
}

describe("estimateLabelWidth", () => {
  it("pads a per-character estimate", () => {
    expect(estimateLabelWidth("")).toBe(LABEL_PAD_PX);
    expect(estimateLabelWidth("abc")).toBe(Math.ceil(3 * LABEL_CHAR_PX) + LABEL_PAD_PX);
  });
});

describe("layoutLanes", () => {
  it("puts disjoint tasks on one lane", () => {
    const { allDay } = layoutLanes(
      [task("a", "2027-01-01", "2027-01-10"), task("b", "2027-01-20", "2027-01-30")],
      xOf
    );
    expect(allDay.laneCount).toBe(1);
    expect(allDay.items.map((item) => [item.id, item.lane])).toEqual([
      ["a", 0],
      ["b", 0],
    ]);
  });

  it("splits overlapping tasks onto separate lanes", () => {
    const { allDay } = layoutLanes(
      [task("a", "2027-01-01", "2027-01-20"), task("b", "2027-01-10", "2027-01-30")],
      xOf
    );
    expect(allDay.laneCount).toBe(2);
    expect(byId(allDay.items, "a").lane).toBe(0);
    expect(byId(allDay.items, "b").lane).toBe(1);
  });

  it("places the longer task first when two share a start", () => {
    const { allDay } = layoutLanes(
      [task("short", "2027-01-01", "2027-01-10"), task("long", "2027-01-01", "2027-01-30")],
      xOf
    );
    expect(byId(allDay.items, "long").lane).toBe(0);
    expect(byId(allDay.items, "short").lane).toBe(1);
  });

  it("draws a timed instant as a milestone", () => {
    const { timed } = layoutLanes([task("pin", "2027-01-05T09:00", "2027-01-05T09:00")], xOf);
    const pin = byId(timed.items, "pin");
    expect(pin.kind).toBe("milestone");
    expect(pin.width).toBe(MILESTONE_PX);
    expect(pin.x).toBeCloseTo(xOf(new Date(2027, 0, 5, 9)) - MILESTONE_PX / 2, 5);
  });

  it("keeps a one-day all-day task as a bar, not a milestone", () => {
    const { allDay } = layoutLanes([task("day", "2027-01-05", "2027-01-05")], xOf);
    expect(allDay.items[0].kind).toBe("bar");
    expect(allDay.items[0].width).toBe(10);
  });

  it("pushes the next bar to another lane when a label overflows", () => {
    const long = "A".repeat(40);
    const { allDay } = layoutLanes(
      [task("a", "2027-01-01", "2027-01-02", long), task("b", "2027-01-05", "2027-01-15")],
      xOf
    );
    expect(estimateLabelWidth(long)).toBeGreaterThan(40);
    expect(byId(allDay.items, "a").lane).toBe(0);
    expect(byId(allDay.items, "b").lane).toBe(1);
    expect(byId(allDay.items, "a").occupiedUntil).toBeGreaterThan(byId(allDay.items, "b").x);
  });

  it("clusters tiny nearby bars and leaves a wide neighbour as its own bar", () => {
    const { allDay } = layoutLanes(
      [
        task("a", "2027-01-01", "2027-01-01"),
        task("b", "2027-01-02", "2027-01-02"),
        task("c", "2027-01-03", "2027-01-03"),
        task("wide", "2027-01-01", "2027-01-20"),
        task("later", "2027-01-10", "2027-01-10"),
      ],
      xOf
    );

    const cluster = allDay.items.find((item) => item.kind === "cluster");
    expect(cluster?.memberIds).toEqual(["a", "b", "c"]);
    expect(cluster?.width).toBeGreaterThanOrEqual(CLUSTER_PX);
    expect(byId(allDay.items, "wide").kind).toBe("bar");
    expect(byId(allDay.items, "wide").lane).not.toBe(cluster?.lane);
    expect(byId(allDay.items, "later").kind).toBe("bar");
    expect(byId(allDay.items, "later").width).toBe(10);
  });

  it("keeps all-day and timed tasks on separate stacks", () => {
    const layout = layoutLanes(
      [task("day", "2027-01-01", "2027-01-10"), task("meet", "2027-01-01T09:00", "2027-01-10T11:00")],
      xOf
    );
    expect(layout.allDay.laneCount).toBe(1);
    expect(layout.timed.laneCount).toBe(1);
    expect(layout.allDay.items[0].id).toBe("day");
    expect(layout.timed.items[0].id).toBe("meet");
  });
});
