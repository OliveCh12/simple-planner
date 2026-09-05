import { afterEach, describe, expect, it, vi } from "vitest";
import { cached, clearEnvironmentCache, peekCached } from "@/lib/environment/cache";
import {
  dailyCacheKey,
  forecastWindow,
  inForecastWindow,
  parseDaily,
  parseGeocode,
  parseHourly,
} from "@/lib/environment/open-meteo";

const place = { name: "Paris, France", lat: 48.8566, lon: 2.3522, timezone: "Europe/Paris" };

afterEach(() => {
  clearEnvironmentCache();
});

describe("parseDaily", () => {
  it("zips the columns and keeps optional fields only when present", () => {
    const days = parseDaily({
      daily: {
        time: ["2026-09-10", "2026-09-11"],
        weather_code: [61, 0],
        temperature_2m_max: [21.4, 25.1],
        temperature_2m_min: [14.2, 15],
        precipitation_probability_max: [60, null],
        sunrise: ["2026-09-10T07:12", "2026-09-11T07:13"],
        sunset: ["2026-09-10T20:15", "2026-09-11T20:13"],
        daylight_duration: [46980, 46800],
      },
    });
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({ date: "2026-09-10", code: 61, tMax: 21.4, precipProbMax: 60, sunrise: "2026-09-10T07:12" });
    expect(days[1].precipProbMax).toBeUndefined();
    expect(days[1].daylightSec).toBe(46800);
  });

  it("ignores rows with missing essentials and malformed payloads", () => {
    expect(parseDaily({})).toEqual([]);
    expect(
      parseDaily({ daily: { time: ["2026-09-10"], weather_code: [null], temperature_2m_max: [1], temperature_2m_min: [0] } })
    ).toEqual([]);
  });
});

describe("parseHourly", () => {
  it("normalises the hour key", () => {
    const hours = parseHourly({
      hourly: { time: ["2026-09-10T09:00"], temperature_2m: [18.6], weather_code: [2], precipitation_probability: [10] },
    });
    expect(hours[0]).toEqual({ time: "2026-09-10T09:00", code: 2, temp: 18.6, precipProb: 10 });
  });
});

describe("parseGeocode", () => {
  it("builds a readable name and keeps the zone", () => {
    const places = parseGeocode({
      results: [
        { name: "Lisbon", admin1: "Lisbon", country: "Portugal", latitude: 38.7, longitude: -9.1, timezone: "Europe/Lisbon" },
        { name: "Broken" },
      ],
    });
    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({ name: "Lisbon, Portugal", lat: 38.7, lon: -9.1, timezone: "Europe/Lisbon" });
  });
});

describe("forecastWindow", () => {
  it("covers two days back and fifteen ahead", () => {
    const now = new Date(2026, 8, 5, 12);
    expect(forecastWindow(now)).toEqual({ start: "2026-09-03", end: "2026-09-20" });
    expect(inForecastWindow("2026-09-20", now)).toBe(true);
    expect(inForecastWindow("2026-09-21", now)).toBe(false);
    expect(inForecastWindow("2026-09-02", now)).toBe(false);
  });

  it("keys the cache by rounded coordinates, window and units", () => {
    expect(dailyCacheKey(place, { start: "2026-09-03", end: "2026-09-20" }, "celsius")).toBe(
      "daily|48.857,2.352|2026-09-03|2026-09-20|celsius"
    );
  });
});

describe("cached", () => {
  it("loads once per key while fresh and shares in-flight calls", async () => {
    const load = vi.fn(async () => ({ value: 1 }));
    const [a, b] = await Promise.all([cached("k", 1000, load), cached("k", 1000, load)]);
    expect(a).toBe(b);
    expect(load).toHaveBeenCalledTimes(1);
    expect(peekCached("k", 1000)).toEqual({ value: 1 });
    expect(peekCached("k", 0, Date.now() + 10)).toBeUndefined();
    await cached("k", 1000, load);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
