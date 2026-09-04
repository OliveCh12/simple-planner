import { describe, expect, it } from "vitest";
import { packInRange } from "@/lib/calendar";
import { intervalOf } from "@/lib/time/local";

const range = intervalOf({ start: "2027-09-13", end: "2027-09-19" }); // Mon–Sun week

function item(id: string, start: string, end: string) {
  return { id, interval: intervalOf({ start, end }) };
}

describe("packInRange", () => {
  it("puts disjoint tasks on one lane", () => {
    const { spans, laneCount } = packInRange(
      [item("a", "2027-09-13", "2027-09-14"), item("b", "2027-09-16", "2027-09-17")],
      range
    );
    expect(laneCount).toBe(1);
    expect(spans.map((span) => [span.id, span.lane])).toEqual([
      ["a", 0],
      ["b", 0],
    ]);
  });

  it("splits overlapping tasks onto separate lanes", () => {
    const { spans, laneCount } = packInRange(
      [item("a", "2027-09-13", "2027-09-16"), item("b", "2027-09-14", "2027-09-18")],
      range
    );
    expect(laneCount).toBe(2);
    expect(spans.find((span) => span.id === "a")?.lane).toBe(0);
    expect(spans.find((span) => span.id === "b")?.lane).toBe(1);
  });

  it("clips to the range and skips tasks outside it", () => {
    const { spans } = packInRange(
      [item("inside", "2027-09-10", "2027-09-20"), item("out", "2027-08-01", "2027-08-05")],
      range
    );
    expect(spans).toHaveLength(1);
    expect(spans[0].id).toBe("inside");
    expect(spans[0].startFrac).toBe(0);
    expect(spans[0].endFrac).toBe(1);
  });
});
