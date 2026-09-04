import { describe, expect, it } from "vitest";
import { createISODate, formatDateDisplay } from "@/lib/date-utils";

describe("createISODate", () => {
  it("returns a civil YYYY-MM-DD date without UTC shift", () => {
    expect(createISODate(2026, 1, 1)).toBe("2026-01-01");
    expect(createISODate(2026, 9, 3)).toBe("2026-09-03");
  });
});

describe("formatDateDisplay", () => {
  it("formats civil dates in local calendar time", () => {
    expect(formatDateDisplay("2026-01-01", "yyyy-MM-dd")).toBe("2026-01-01");
  });
});
