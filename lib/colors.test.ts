import { describe, expect, it } from "vitest";
import { categoryAtmosphere, categorySurface, normalizeHex, surfaceTone } from "@/lib/colors";

function mixPercent(backgroundImage: string): number {
  const match = /#[0-9a-f]{6} (\d+)%/.exec(backgroundImage);
  return match ? Number(match[1]) : NaN;
}

describe("categorySurface", () => {
  it("mixes the category into --background so light and dark stay readable", () => {
    const surface = categorySurface("#2563eb", "event");
    expect(surface.color).toBe("#2563eb");
    expect(surface.background).toContain("color-mix(in oklab, #2563eb");
    expect(surface.background).toContain("var(--background)");
    expect(surface.backgroundImage).toContain("var(--background)");
  });

  it("pulls the ink toward the foreground for contrast on the tint", () => {
    expect(categorySurface("#2563eb", "task").ink).toBe("color-mix(in oklab, #2563eb 58%, var(--foreground))");
  });

  it("keeps every tone translucent and orders event > task > objective > subtask", () => {
    const event = mixPercent(categorySurface("#16a34a", "event").backgroundImage);
    const task = mixPercent(categorySurface("#16a34a", "task").backgroundImage);
    const objective = mixPercent(categorySurface("#16a34a", "objective").backgroundImage);
    const subtask = mixPercent(categorySurface("#16a34a", "subtask").backgroundImage);
    expect(event).toBeGreaterThan(task);
    expect(task).toBeGreaterThan(objective);
    expect(objective).toBeGreaterThan(subtask);
    expect(event).toBeLessThanOrEqual(20);
  });
});

describe("categoryAtmosphere", () => {
  it("fades to transparent so the surface shows through", () => {
    const { backgroundImage } = categoryAtmosphere("#E11D48");
    expect(backgroundImage).toContain("radial-gradient");
    expect(backgroundImage).toContain("#e11d48 15%, transparent");
    expect(backgroundImage.endsWith("transparent 65%)")).toBe(true);
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
