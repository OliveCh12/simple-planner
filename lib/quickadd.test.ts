import { describe, expect, it } from "vitest";
import { describeQuickAdd, parseQuickAdd } from "@/lib/quickadd";

const categories = [
  { id: "cat-health", name: "Health" },
  { id: "cat-career", name: "Career" },
];

const june = {
  now: new Date(2026, 5, 1),
  categories,
  defaultStart: "2026-06-01",
};

describe("parseQuickAdd", () => {
  it("parses the spec example", () => {
    const result = parseQuickAdd("Gym every weekday 7am until Aug 31 #health @ai", june);
    expect(result).toEqual({
      title: "Gym",
      start: "2026-06-01T07:00",
      end: "2026-06-01T08:00",
      recurrence: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20260831",
      executor: "ai",
      categoryId: "cat-health",
      kind: "task",
    });
  });

  it("parses 24h time, daily recurrence and a human executor", () => {
    const result = parseQuickAdd("Standup daily 09:30 @human", june);
    expect(result).toMatchObject({
      title: "Standup",
      start: "2026-06-01T09:30",
      end: "2026-06-01T10:30",
      recurrence: "FREQ=DAILY",
      executor: "human",
    });
  });

  it("uses until as the item end when there is no recurrence", () => {
    const result = parseQuickAdd("Visa paperwork until Aug 31", june);
    expect(result).toMatchObject({
      title: "Visa paperwork",
      start: "2026-06-01",
      end: "2026-08-31",
      executor: "human",
    });
  });

  it("rolls until into next year when the month has already passed", () => {
    const result = parseQuickAdd("Taxes until Feb 1", {
      ...june,
      now: new Date(2026, 8, 4),
      defaultStart: "2026-09-04",
    });
    expect(result?.end).toBe("2027-02-01");
  });

  it("maps 12am and 12pm", () => {
    expect(parseQuickAdd("Pills 12am", june)?.start).toBe("2026-06-01T00:00");
    expect(parseQuickAdd("Lunch 12pm", june)?.start).toBe("2026-06-01T12:00");
  });

  it("returns null without a title", () => {
    expect(parseQuickAdd("@ai", june)).toBeNull();
    expect(parseQuickAdd("   ", june)).toBeNull();
  });

  it("describes a parsed draft", () => {
    const result = parseQuickAdd("Gym every weekday 7am until Aug 31 #health @ai", june);
    expect(describeQuickAdd(result!, categories)).toBe("Weekdays · 07:00 · until 2026-08-31 · Health · AI");
  });
});
