import { describe, expect, it } from "vitest";
import { SWATCH_COLORS } from "@/lib/colors";
import { createPlanRecord, suggestPlanColor, updatePlanRecord } from "@/lib/domain/plans";

describe("plan color", () => {
  it("normalises the color on create and drops it on an empty patch", () => {
    const plan = createPlanRecord({ title: "Goji Berry", start: "2026-01-01", end: "2026-12-31", color: "#ABC" });
    expect(plan.color).toBe("#aabbcc");
    expect(updatePlanRecord(plan, { color: undefined }).color).toBeUndefined();
  });

  it("suggests the first unused swatch, then cycles", () => {
    expect(suggestPlanColor([])).toBe(SWATCH_COLORS[0].hex);
    expect(suggestPlanColor([{ color: SWATCH_COLORS[0].hex }])).toBe(SWATCH_COLORS[1].hex);
    const all = SWATCH_COLORS.map((swatch) => ({ color: swatch.hex }));
    expect(suggestPlanColor(all)).toBe(SWATCH_COLORS[all.length % SWATCH_COLORS.length].hex);
  });
});
