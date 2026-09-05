import { describe, expect, it } from "vitest";
import { categorySurface, normalizeHex, surfaceTone } from "@/lib/colors";

describe("categorySurface", () => {
  it("mixes the category into --background so light and dark stay readable", () => {
    const surface = categorySurface("#2563eb", "event");
    expect(surface.borderColor).toBe("#2563eb");
    expect(surface.backgroundImage).toContain("color-mix(in oklab, #2563eb");
    expect(surface.backgroundImage).toContain("var(--background)");
  });

  it("gives events a stronger mix than tasks and subtasks", () => {
    const event = categorySurface("#16a34a", "event").backgroundImage;
    const task = categorySurface("#16a34a", "task").backgroundImage;
    const subtask = categorySurface("#16a34a", "subtask").backgroundImage;
    expect(event).toContain("48%");
    expect(task).toContain("34%");
    expect(subtask).toContain("18%");
  });
});

describe("surfaceTone", () => {
  it("marks nested tasks as subtasks regardless of kind", () => {
    expect(surfaceTone("task", true)).toBe("subtask");
    expect(surfaceTone("event")).toBe("event");
    expect(surfaceTone("objective")).toBe("objective");
  });
});

describe("normalizeHex", () => {
  it("expands short hex", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
  });
});
