import { describe, expect, it } from "vitest";
import { formatDaylight, sunTimes } from "@/lib/environment/sun";

function utcHm(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function within(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

describe("sunTimes", () => {
  it("matches Paris on the summer solstice within a few minutes (UTC)", () => {
    const sun = sunTimes(48.8566, 2.3522, { year: 2026, month: 6, day: 21 });
    if (sun.kind !== "normal") throw new Error("expected a normal day");
    // Sunrise 05:47 CEST = 03:47 UTC, sunset 21:58 CEST = 19:58 UTC.
    expect(within(utcHm(sun.sunrise), 3 * 60 + 47, 4)).toBe(true);
    expect(within(utcHm(sun.sunset), 19 * 60 + 58, 4)).toBe(true);
    expect(sun.dawn < sun.sunrise).toBe(true);
    expect(sun.dusk > sun.sunset).toBe(true);
    expect(sun.nightEnd < sun.dawn).toBe(true);
    expect(sun.nightStart > sun.dusk).toBe(true);
    expect(sun.daylightMinutes).toBeGreaterThan(16 * 60);
  });

  it("matches Sydney in winter, on the right civil day", () => {
    const sun = sunTimes(-33.8688, 151.2093, { year: 2026, month: 6, day: 21 });
    if (sun.kind !== "normal") throw new Error("expected a normal day");
    // Sunrise 07:00 AEST = 21:00 UTC on the 20th, sunset 16:54 AEST = 06:54 UTC.
    expect(sun.sunrise.getUTCDate()).toBe(20);
    expect(within(utcHm(sun.sunrise), 21 * 60, 5)).toBe(true);
    expect(within(utcHm(sun.sunset), 6 * 60 + 54, 5)).toBe(true);
    expect(sun.daylightMinutes).toBeLessThan(10 * 60);
  });

  it("reports polar day and polar night in Tromsø", () => {
    expect(sunTimes(69.6492, 18.9553, { year: 2026, month: 6, day: 21 }).kind).toBe("polarDay");
    expect(sunTimes(69.6492, 18.9553, { year: 2026, month: 12, day: 21 }).kind).toBe("polarNight");
  });

  it("still rises and sets in Tromsø at the equinox", () => {
    const sun = sunTimes(69.6492, 18.9553, { year: 2026, month: 3, day: 20 });
    expect(sun.kind).toBe("normal");
  });
});

describe("formatDaylight", () => {
  it("prints hours and minutes", () => {
    expect(formatDaylight(772)).toBe("12 h 52");
    expect(formatDaylight(600)).toBe("10 h");
  });
});
