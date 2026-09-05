import { differenceInCalendarDays } from "date-fns";
import type { CivilDate } from "@/lib/environment/sun";
import type { ForecastHorizon, Place } from "@/lib/environment/types";
import type { Location } from "@/types";

/** A place we can forecast: the item's location once it carries coordinates. */
export function placeFromLocation(location?: Location): Place | null {
  if (!location || typeof location.lat !== "number" || typeof location.lon !== "number") return null;
  const place: Place = { name: location.name, lat: location.lat, lon: location.lon };
  if (location.timezone) place.timezone = location.timezone;
  return place;
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/** Whether displaying this place's times in the user's zone would be the same clock. */
export function sharesUserZone(place: Place): boolean {
  return !place.timezone || place.timezone === localTimeZone();
}

const partsCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string | undefined): Intl.DateTimeFormat {
  const key = timeZone ?? "local";
  const hit = partsCache.get(key);
  if (hit) return hit;
  const created = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  partsCache.set(key, created);
  return created;
}

/** Civil date and time of an instant at a place, e.g. `{ date: "2026-09-10", hour: 8, minute: 30 }`. */
export function zonedParts(instant: Date, timeZone?: string): { date: string; hour: number; minute: number } {
  const parts = formatter(timeZone).formatToParts(instant);
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const hour = Number(read("hour")) % 24;
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    hour,
    minute: Number(read("minute")),
  };
}

export function civilDateAt(instant: Date, timeZone?: string): CivilDate {
  const { date } = zonedParts(instant, timeZone);
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

export function civilDateFromKey(dateKey: string): CivilDate {
  const [year, month, day] = dateKey.slice(0, 10).split("-").map(Number);
  return { year, month, day };
}

/** `HH:MM` of an instant at a place. */
export function formatTimeAt(instant: Date, timeZone?: string): string {
  const { hour, minute } = zonedParts(instant, timeZone);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Hourly forecast key for an instant at a place: `YYYY-MM-DDTHH:00`. */
export function hourKeyAt(instant: Date, timeZone?: string): string {
  const { date, hour } = zonedParts(instant, timeZone);
  return `${date}T${String(hour).padStart(2, "0")}:00`;
}

/** What kind of value a date holds, relative to today in the user's zone. */
export function horizonFor(dateKey: string, now = new Date()): ForecastHorizon {
  const [year, month, day] = dateKey.slice(0, 10).split("-").map(Number);
  const target = new Date(year, month - 1, day);
  const delta = differenceInCalendarDays(target, now);
  if (delta < -2 || delta > 15) return "none";
  if (delta < 0) return "observed";
  if (delta === 0) return "today";
  if (delta <= 7) return "forecast";
  return "outlook";
}

export function horizonLabel(horizon: ForecastHorizon): string {
  switch (horizon) {
    case "observed":
      return "Observed";
    case "today":
      return "Today";
    case "forecast":
      return "Forecast";
    case "outlook":
      return "Outlook, less certain";
    default:
      return "No forecast yet";
  }
}
