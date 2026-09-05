import { describe, expect, it } from "vitest";
import { clampPanelWidth, PANEL_WIDTH } from "@/lib/layout/panel";

describe("clampPanelWidth", () => {
  it("keeps the default range on a wide surface", () => {
    expect(clampPanelWidth(380, 1440)).toBe(380);
    expect(clampPanelWidth(80)).toBe(PANEL_WIDTH.min);
    expect(clampPanelWidth(900)).toBe(PANEL_WIDTH.max);
  });

  it("caps a panel at 45% so the calendar keeps the rest", () => {
    expect(clampPanelWidth(560, 800)).toBe(360);
  });
});
