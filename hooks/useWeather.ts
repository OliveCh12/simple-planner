"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ensureForecast, readForecast, subscribeForecast, type ForecastStatus } from "@/lib/environment/forecast-store";
import {
  dailyCacheKey,
  fetchDailyWeather,
  fetchHourlyWeather,
  forecastWindow,
  FORECAST_TTL_MS,
  hourlyCacheKey,
} from "@/lib/environment/open-meteo";
import type {
  DailyWeather,
  EnvironmentSettings,
  HourlyWeather,
  Place,
  TemperatureUnit,
} from "@/lib/environment/types";
import { useUIStore } from "@/store/uiStore";

export type WeatherStatus = "idle" | ForecastStatus;

const EMPTY_DAILY: ReadonlyMap<string, DailyWeather> = new Map();
const EMPTY_HOURLY: ReadonlyMap<string, HourlyWeather> = new Map();
const noop = () => {};

export function useEnvironmentSettings(): EnvironmentSettings {
  return useUIStore((s) => s.settings.environment);
}

/** Bumps when the cache may have gone stale or the tab wakes up, so effects re-check. */
function useRefreshTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), FORECAST_TTL_MS);
    const wake = () => {
      if (document.visibilityState === "visible") setTick((value) => value + 1);
    };
    document.addEventListener("visibilitychange", wake);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", wake);
    };
  }, []);
  return tick;
}

function usePlaceKey(place: Place | null | undefined, enabled: boolean): Place | null {
  const lat = place?.lat;
  const lon = place?.lon;
  const name = place?.name ?? "";
  return useMemo(
    () => (enabled && lat !== undefined && lon !== undefined ? { name, lat, lon } : null),
    [enabled, lat, lon, name]
  );
}

/**
 * Daily forecast for a place over the shared 18-day window. Never throws and
 * never blocks: the map is empty until data lands and stays empty on error.
 */
export function useDailyWeather(
  place: Place | null | undefined,
  enabled: boolean,
  units: TemperatureUnit
): { byDate: ReadonlyMap<string, DailyWeather>; status: WeatherStatus } {
  const tick = useRefreshTick();
  const target = usePlaceKey(place, enabled);
  const window = forecastWindow();
  const key = target ? dailyCacheKey(target, window, units) : null;

  useEffect(() => {
    if (!key || !target) return;
    ensureForecast(key, FORECAST_TTL_MS, () => fetchDailyWeather(target, window, units));
    // `tick` re-runs the check after the TTL or when the tab wakes up.
  }, [key, target, units, window.start, window.end, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const snapshot = useSyncExternalStore(
    (listener) => (key ? subscribeForecast(key, listener) : noop),
    () => (key ? readForecast<DailyWeather[]>(key) : null),
    () => null
  );
  const days = snapshot?.value;
  const byDate = useMemo(() => (days ? new Map(days.map((day) => [day.date, day])) : EMPTY_DAILY), [days]);
  return { byDate, status: key ? (snapshot?.status ?? "loading") : "idle" };
}

/** Hourly forecast keyed by the place's local hour (`YYYY-MM-DDTHH:00`). */
export function useHourlyWeather(
  place: Place | null | undefined,
  enabled: boolean,
  units: TemperatureUnit
): { byHour: ReadonlyMap<string, HourlyWeather>; status: WeatherStatus } {
  const tick = useRefreshTick();
  const target = usePlaceKey(place, enabled);
  const window = forecastWindow();
  const key = target ? hourlyCacheKey(target, window, units) : null;

  useEffect(() => {
    if (!key || !target) return;
    ensureForecast(key, FORECAST_TTL_MS, () => fetchHourlyWeather(target, window, units));
  }, [key, target, units, window.start, window.end, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const snapshot = useSyncExternalStore(
    (listener) => (key ? subscribeForecast(key, listener) : noop),
    () => (key ? readForecast<HourlyWeather[]>(key) : null),
    () => null
  );
  const hours = snapshot?.value;
  const byHour = useMemo(() => (hours ? new Map(hours.map((hour) => [hour.time, hour])) : EMPTY_HOURLY), [hours]);
  return { byHour, status: key ? (snapshot?.status ?? "loading") : "idle" };
}
