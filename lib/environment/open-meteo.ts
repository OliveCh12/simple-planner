import { addDays } from "date-fns";
import { cached } from "@/lib/environment/cache";
import type { DailyWeather, HourlyWeather, Place, TemperatureUnit } from "@/lib/environment/types";
import { formatLocalDate } from "@/lib/time/local";

/**
 * Open-Meteo: free, keyless, CORS-enabled, no tracking. Only coordinates and
 * dates leave the browser. Forecasts are reliable ~15 days out; we never ask
 * for more and we say less the further we look.
 */
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export const FORECAST_DAYS_AHEAD = 15;
export const FORECAST_DAYS_BACK = 2;
/** Fresh enough for planning; the API itself updates hourly. */
export const FORECAST_TTL_MS = 30 * 60_000;
const GEOCODE_TTL_MS = 24 * 60 * 60_000;

export interface DateWindow {
  /** Inclusive `YYYY-MM-DD`. */
  start: string;
  end: string;
}

/** The one window we ever fetch per place, so every view shares a cache entry. */
export function forecastWindow(now = new Date()): DateWindow {
  return {
    start: formatLocalDate(addDays(now, -FORECAST_DAYS_BACK)),
    end: formatLocalDate(addDays(now, FORECAST_DAYS_AHEAD)),
  };
}

export function inForecastWindow(dateKey: string, now = new Date()): boolean {
  const window = forecastWindow(now);
  return dateKey >= window.start && dateKey <= window.end;
}

function placeKey(place: Place): string {
  return `${place.lat.toFixed(3)},${place.lon.toFixed(3)}`;
}

function unitParams(units: TemperatureUnit): Record<string, string> {
  return units === "fahrenheit"
    ? { temperature_unit: "fahrenheit", wind_speed_unit: "mph", precipitation_unit: "inch" }
    : {};
}

async function getJson(url: string, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Open-Meteo ${response.status}`);
  return response.json();
}

function numberAt(list: unknown, index: number): number | undefined {
  if (!Array.isArray(list)) return undefined;
  const value = list[index];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringAt(list: unknown, index: number): string | undefined {
  if (!Array.isArray(list)) return undefined;
  const value = list[index];
  return typeof value === "string" ? value : undefined;
}

export function parseDaily(json: unknown): DailyWeather[] {
  const daily = (json as { daily?: Record<string, unknown[]> })?.daily;
  const times = daily?.time;
  if (!Array.isArray(times)) return [];
  const out: DailyWeather[] = [];
  times.forEach((time, index) => {
    if (typeof time !== "string") return;
    const code = numberAt(daily?.weather_code, index);
    const tMax = numberAt(daily?.temperature_2m_max, index);
    const tMin = numberAt(daily?.temperature_2m_min, index);
    if (code === undefined || tMax === undefined || tMin === undefined) return;
    const entry: DailyWeather = { date: time.slice(0, 10), code, tMax, tMin };
    const precipProb = numberAt(daily?.precipitation_probability_max, index);
    const precipSum = numberAt(daily?.precipitation_sum, index);
    const wind = numberAt(daily?.wind_speed_10m_max, index);
    const sunrise = stringAt(daily?.sunrise, index);
    const sunset = stringAt(daily?.sunset, index);
    const daylight = numberAt(daily?.daylight_duration, index);
    if (precipProb !== undefined) entry.precipProbMax = precipProb;
    if (precipSum !== undefined) entry.precipSum = precipSum;
    if (wind !== undefined) entry.windMax = wind;
    if (sunrise) entry.sunrise = sunrise;
    if (sunset) entry.sunset = sunset;
    if (daylight !== undefined) entry.daylightSec = daylight;
    out.push(entry);
  });
  return out;
}

export function parseHourly(json: unknown): HourlyWeather[] {
  const hourly = (json as { hourly?: Record<string, unknown[]> })?.hourly;
  const times = hourly?.time;
  if (!Array.isArray(times)) return [];
  const out: HourlyWeather[] = [];
  times.forEach((time, index) => {
    if (typeof time !== "string") return;
    const code = numberAt(hourly?.weather_code, index);
    const temp = numberAt(hourly?.temperature_2m, index);
    if (code === undefined || temp === undefined) return;
    const entry: HourlyWeather = { time: time.slice(0, 13) + ":00", code, temp };
    const precipProb = numberAt(hourly?.precipitation_probability, index);
    if (precipProb !== undefined) entry.precipProb = precipProb;
    out.push(entry);
  });
  return out;
}

export function parseGeocode(json: unknown): Place[] {
  const results = (json as { results?: unknown[] })?.results;
  if (!Array.isArray(results)) return [];
  const out: Place[] = [];
  for (const raw of results) {
    const row = raw as Record<string, unknown>;
    if (typeof row.name !== "string" || typeof row.latitude !== "number" || typeof row.longitude !== "number") continue;
    const parts = [row.name, typeof row.admin1 === "string" ? row.admin1 : undefined, typeof row.country === "string" ? row.country : undefined]
      .filter((part): part is string => Boolean(part));
    const place: Place = {
      name: [...new Set(parts)].join(", "),
      lat: row.latitude,
      lon: row.longitude,
    };
    if (typeof row.timezone === "string") place.timezone = row.timezone;
    if (typeof row.country === "string") place.country = row.country;
    out.push(place);
  }
  return out;
}

export function dailyCacheKey(place: Place, window: DateWindow, units: TemperatureUnit): string {
  return `daily|${placeKey(place)}|${window.start}|${window.end}|${units}`;
}

export function hourlyCacheKey(place: Place, window: DateWindow, units: TemperatureUnit): string {
  return `hourly|${placeKey(place)}|${window.start}|${window.end}|${units}`;
}

export async function fetchDailyWeather(
  place: Place,
  window: DateWindow,
  units: TemperatureUnit,
  signal?: AbortSignal
): Promise<DailyWeather[]> {
  return cached(
    dailyCacheKey(place, window, units),
    FORECAST_TTL_MS,
    async (abort) => {
      const params = new URLSearchParams({
        latitude: String(place.lat),
        longitude: String(place.lon),
        daily: [
          "weather_code",
          "temperature_2m_max",
          "temperature_2m_min",
          "precipitation_probability_max",
          "precipitation_sum",
          "wind_speed_10m_max",
          "sunrise",
          "sunset",
          "daylight_duration",
        ].join(","),
        timezone: "auto",
        start_date: window.start,
        end_date: window.end,
        ...unitParams(units),
      });
      return parseDaily(await getJson(`${FORECAST_URL}?${params}`, abort));
    },
    signal
  );
}

export async function fetchHourlyWeather(
  place: Place,
  window: DateWindow,
  units: TemperatureUnit,
  signal?: AbortSignal
): Promise<HourlyWeather[]> {
  return cached(
    hourlyCacheKey(place, window, units),
    FORECAST_TTL_MS,
    async (abort) => {
      const params = new URLSearchParams({
        latitude: String(place.lat),
        longitude: String(place.lon),
        hourly: "temperature_2m,weather_code,precipitation_probability",
        timezone: "auto",
        start_date: window.start,
        end_date: window.end,
        ...unitParams(units),
      });
      return parseHourly(await getJson(`${FORECAST_URL}?${params}`, abort));
    },
    signal
  );
}

export async function geocode(query: string, signal?: AbortSignal): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  return cached(
    `geo|${trimmed.toLowerCase()}`,
    GEOCODE_TTL_MS,
    async (abort) => {
      const params = new URLSearchParams({ name: trimmed, count: "6", language: "en", format: "json" });
      return parseGeocode(await getJson(`${GEOCODE_URL}?${params}`, abort));
    },
    signal
  );
}
