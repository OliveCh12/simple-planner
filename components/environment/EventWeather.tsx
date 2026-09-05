"use client";

import { eachDayOfInterval, format } from "date-fns";
import { Sunrise } from "lucide-react";
import { WeatherGlyph } from "@/components/environment/WeatherGlyph";
import { sunSummary } from "@/components/environment/DayWeather";
import { useDailyWeather, useEnvironmentSettings, useHourlyWeather } from "@/hooks/useWeather";
import {
  civilDateAt,
  formatTimeAt,
  horizonFor,
  horizonLabel,
  hourKeyAt,
  placeFromLocation,
  sharesUserZone,
} from "@/lib/environment/place";
import { sunTimesCached } from "@/lib/environment/sun";
import type { DailyWeather, Place } from "@/lib/environment/types";
import { formatPrecipitation, formatRange, formatTemp, weatherKind } from "@/lib/environment/weather-codes";
import { formatLocalDate, isAllDay, parseLocal } from "@/lib/time/local";
import type { PlanItem } from "@/types";

const MAX_DAYS = 4;

function zoneNote(place: Place): string {
  if (sharesUserZone(place)) return "";
  const city = place.timezone?.split("/").pop()?.replace(/_/g, " ");
  return city ? ` (${city} time)` : " (local time)";
}

function DayLine({
  day,
  date,
  units,
  dateLabel,
}: {
  day?: DailyWeather;
  date: Date;
  units: "celsius" | "fahrenheit";
  dateLabel: boolean;
}) {
  if (!day) return null;
  const kind = weatherKind(day.code);
  const precipitation = formatPrecipitation(day.precipProbMax);
  return (
    <div className="flex items-center gap-2">
      {dateLabel && <span className="w-14 shrink-0 text-muted-foreground">{format(date, "EEE d")}</span>}
      <WeatherGlyph code={day.code} labelled />
      <span className="font-medium">{kind.label}</span>
      <span className="tabular-nums">{formatRange(day.tMin, day.tMax, units)}</span>
      {precipitation && <span className="text-muted-foreground">{precipitation}</span>}
    </div>
  );
}

/**
 * Forecast for an item, in the details pane. Uses the item's own place when it
 * has coordinates, otherwise the user's default place for events, and never
 * mixes the two. Past the forecast window it says so instead of guessing.
 */
export function EventWeather({ item }: { item: PlanItem }) {
  const env = useEnvironmentSettings();
  const own = placeFromLocation(item.location);
  const fallback = !own && item.kind === "event" && !item.location ? env.location : undefined;
  const place = own ?? fallback ?? null;
  const startValue = item.start ?? formatLocalDate(new Date());
  const enabled = env.eventWeather && Boolean(place) && item.start !== undefined;
  const start = parseLocal(startValue);
  const end = item.end ? parseLocal(item.end) : start;
  const allDay = isAllDay(startValue);
  const timed = !allDay && item.end !== undefined;
  const startKey = startValue.slice(0, 10);
  const endKey = (item.end ?? startValue).slice(0, 10);
  const horizon = horizonFor(startKey);
  const multiDay = endKey > startKey;

  const { byDate } = useDailyWeather(place, enabled && horizon !== "none", env.units);
  const { byHour } = useHourlyWeather(place, enabled && horizon !== "none" && timed && !multiDay, env.units);

  if (!enabled || !place) return null;

  if (horizon === "none") {
    if (!own) return null;
    return (
      <p className="text-[11px] text-muted-foreground">No forecast yet for this date at {place.name}.</p>
    );
  }

  const zone = place.timezone;
  const startCivil = civilDateAt(start, zone);
  const sun = sunTimesCached(place.lat, place.lon, startCivil);
  const sunText = sunSummary(sun, zone);
  const placeLabel = fallback ? `${place.name} (your location)` : place.name;
  const source = `${horizonLabel(horizon)} · ${placeLabel} · Open-Meteo`;

  if (multiDay) {
    const days = eachDayOfInterval({ start, end: end < start ? start : end }).slice(0, MAX_DAYS + 1);
    const shown = days.slice(0, MAX_DAYS);
    const rest = Math.max(0, days.length - MAX_DAYS);
    const lines = shown
      .map((date) => ({ date, day: byDate.get(format(date, "yyyy-MM-dd")) }))
      .filter((entry) => entry.day);
    if (lines.length === 0) return null;
    return (
      <div className="flex flex-col gap-1 text-xs">
        {lines.map((entry) => (
          <DayLine key={entry.date.toISOString()} day={entry.day} date={entry.date} units={env.units} dateLabel />
        ))}
        {rest > 0 && <p className="text-[11px] text-muted-foreground">{rest} more days beyond the forecast.</p>}
        <p className="text-[11px] text-muted-foreground">{source}</p>
      </div>
    );
  }

  const daily = byDate.get(zonedDateKey(start, zone));
  const hour = timed ? byHour.get(hourKeyAt(start, zone)) : undefined;
  if (!daily && !hour) return null;
  const code = hour?.code ?? daily?.code;
  const kind = code === undefined ? undefined : weatherKind(code);
  const precipitation = formatPrecipitation(hour?.precipProb ?? daily?.precipProbMax);

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {code !== undefined && <WeatherGlyph code={code} labelled />}
        {kind && <span className="font-medium">{kind.label}</span>}
        {hour ? (
          <span className="tabular-nums">
            {formatTemp(hour.temp, env.units)}
            <span className="text-muted-foreground"> at {formatTimeAt(start, zone)}</span>
          </span>
        ) : (
          daily && <span className="tabular-nums">{formatRange(daily.tMin, daily.tMax, env.units)}</span>
        )}
        {precipitation && <span className="text-muted-foreground">{precipitation}</span>}
      </div>
      {sunText && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Sunrise className="size-3.5 shrink-0" aria-hidden />
          <span>
            {sunText}
            {zoneNote(place)}
          </span>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">{source}</p>
    </div>
  );
}

function zonedDateKey(instant: Date, timeZone?: string): string {
  const civil = civilDateAt(instant, timeZone);
  return `${civil.year}-${String(civil.month).padStart(2, "0")}-${String(civil.day).padStart(2, "0")}`;
}

/** Tiny glyph for a grid card whose event has its own coordinates. */
export function EventWeatherGlyph({ item }: { item: PlanItem }) {
  const env = useEnvironmentSettings();
  const place = placeFromLocation(item.location);
  const startValue = item.start ?? formatLocalDate(new Date());
  const dateKey = startValue.slice(0, 10);
  const horizon = horizonFor(dateKey);
  const { byDate } = useDailyWeather(place, env.eventWeather && horizon !== "none" && item.start !== undefined, env.units);
  if (!place || !env.eventWeather || item.start === undefined) return null;
  const day = byDate.get(zonedDateKey(parseLocal(startValue), place.timezone));
  if (!day) return null;
  const kind = weatherKind(day.code);
  const title = `${kind.label} · ${formatRange(day.tMin, day.tMax, env.units)} · ${place.name}`;
  return (
    <span title={title} aria-label={title} className="inline-flex items-center gap-0.5 text-[11px] tabular-nums opacity-80">
      <WeatherGlyph code={day.code} className="size-3" />
      {Math.round(day.tMax)}°
    </span>
  );
}
