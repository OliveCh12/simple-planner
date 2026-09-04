import { describe, expect, it } from "vitest";
import { createCategory, updateCategory } from "@/lib/domain/categories";
import { DomainError } from "@/lib/domain/items";

describe("createCategory", () => {
  it("trims the name and defaults a color", () => {
    const category = createCategory({ name: "  Health  " });
    expect(category).toMatchObject({ name: "Health", color: "#16a34a" });
  });

  it("rejects an empty name and a bad color", () => {
    expect(() => createCategory({ name: "" })).toThrow(DomainError);
    expect(() => createCategory({ name: "Health", color: "red" })).toThrow(/hex color/);
  });
});

describe("updateCategory", () => {
  it("updates color and drops a blank icon", () => {
    const category = createCategory({ name: "Health", color: "#0f0", icon: "heart" });
    expect(updateCategory(category, { color: "#2563eb" }).color).toBe("#2563eb");
    expect(updateCategory(category, { icon: "  " }).icon).toBeUndefined();
  });
});
