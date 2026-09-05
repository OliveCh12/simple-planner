"use client";

import { WeatherGlyph } from "@/components/environment/WeatherGlyph";
import { formatTimeAt, horizonFor, horizonLabel } from "@/lib/environment/place";
import { formatDaylight } from "@/lib/environment/sun";
import type { DailyWeather, SunTimes, TemperatureUnit, WeatherDetail } from "@/lib/environment/types";
import { formatPrecipitation, formatRange, weatherKind } from "@/lib/environment/weather-codes";
import { cn } from "@/lib/utils";

interface DayWeatherProps {
  day?: DailyWeather;
  dateKey: string;
  units: TemperatureUnit;
  detail: WeatherDetail;
  /** Local sun times for the same day, folded into the tooltip when known. */
  sun?: SunTimes | null;
  timeZone?: string;
  className?: string;
  /** Print the condition name after the glyph (day view has room for it). */
  wide?: boolean;
  /** Inside a `@container`: keep only the glyph when the column is narrower than 6.5rem. */
  responsive?: boolean;
}

export function sunSummary(sun: SunTimes | null | undefined, timeZone?: string): string | undefined {
  if (!sun) return undefined;
  if (sun.kind === "polarDay") return "Sun up all day";
  if (sun.kind === "polarNight") return "Sun down all day";
  return `Sunrise ${formatTimeAt(sun.sunrise, timeZone)} · Sunset ${formatTimeAt(sun.sunset, timeZone)} · ${formatDaylight(sun.daylightMinutes)} of daylight`;
}

/** One day's forecast, small enough for a header; the tooltip carries the rest. */
export function DayWeather({
  day,
  dateKey,
  units,
  detail,
  sun,
  timeZone,
  className,
  wide = false,
  responsive = false,
}: DayWeatherProps) {
  const horizon = horizonFor(dateKey);
  const sunText = sunSummary(sun, timeZone);
  if (!day) return null;
  const kind = weatherKind(day.code);
  const precipitation = formatPrecipitation(day.precipProbMax);
  const tooltip = [
    `${kind.label} · ${formatRange(day.tMin, day.tMax, units)}`,
    precipitation,
    sunText,
    horizonLabel(horizon),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <span
      title={tooltip}
      aria-label={tooltip}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-[11.5px] leading-none font-medium tabular-nums text-foreground/65",
        horizon === "outlook" && "opacity-60",
        className
      )}
    >
      <WeatherGlyph code={day.code} className={cn(kind.alert && "text-amber-600 dark:text-amber-400")} />
      {wide && <span className="text-foreground/80">{kind.label}</span>}
      {detail !== "icon" && (
        <span className={cn(responsive && "hidden @min-[6.5rem]:inline")}>{Math.round(day.tMax)}°</span>
      )}
      {detail === "full" && day.precipProbMax !== undefined && day.precipProbMax >= 30 && (
        <span className={cn("text-sky-600/80 dark:text-sky-400/80", responsive && "hidden @min-[8.5rem]:inline")}>
          {Math.round(day.precipProbMax)}%
        </span>
      )}
    </span>
  );
}
