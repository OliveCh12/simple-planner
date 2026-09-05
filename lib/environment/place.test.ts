import { describe, expect, it } from "vitest";
import { formatTimeAt, horizonFor, hourKeyAt, placeFromLocation, zonedParts } from "@/lib/environment/place";

describe("placeFromLocation", () => {
  it("needs both coordinates", () => {
    expect(placeFromLocation({ name: "Online" })).toBeNull();
    expect(placeFromLocation({ name: "Lisbon", lat: 38.7 })).toBeNull();
    expect(placeFromLocation({ name: "Lisbon", lat: 38.7, lon: -9.1, timezone: "Europe/Lisbon" })).toEqual({
      name: "Lisbon",
      lat: 38.7,
      lon: -9.1,
      timezone: "Europe/Lisbon",
    });
  });
});

describe("zoned helpers", () => {
  const instant = new Date(Date.UTC(2026, 8, 10, 7, 30));

  it("reads the civil date and hour in another zone", () => {
    expect(zonedParts(instant, "Europe/Lisbon")).toEqual({ date: "2026-09-10", hour: 8, minute: 30 });
    expect(zonedParts(instant, "Asia/Tokyo")).toEqual({ date: "2026-09-10", hour: 16, minute: 30 });
    expect(zonedParts(instant, "Pacific/Honolulu").date).toBe("2026-09-09");
  });

  it("formats times and hourly keys per zone", () => {
    expect(formatTimeAt(instant, "Europe/Paris")).toBe("09:30");
    expect(hourKeyAt(instant, "Europe/Paris")).toBe("2026-09-10T09:00");
  });
});

describe("horizonFor", () => {
  const now = new Date(2026, 8, 5, 10);

  it("grades dates by distance from today", () => {
    expect(horizonFor("2026-09-04", now)).toBe("observed");
    expect(horizonFor("2026-09-05", now)).toBe("today");
    expect(horizonFor("2026-09-10", now)).toBe("forecast");
    expect(horizonFor("2026-09-15", now)).toBe("outlook");
    expect(horizonFor("2026-09-21", now)).toBe("none");
    expect(horizonFor("2026-09-01", now)).toBe("none");
  });
});
