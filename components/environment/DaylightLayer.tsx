"use client";

import { sunTimesCached } from "@/lib/environment/sun";
import type { Place } from "@/lib/environment/types";

function minuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function percent(minutes: number): string {
  return `${((minutes / 1440) * 100).toFixed(2)}%`;
}

interface DaylightLayerProps {
  place: Place;
  /** The column's civil day, in the user's zone. */
  day: Date;
}

/**
 * Night wash over an hour column from real dawn, sunrise, sunset and dusk.
 * Sits under the events; daylight hours stay untouched so text keeps full
 * contrast. Polar days render nothing, polar nights a flat wash.
 */
export function DaylightLayer({ place, day }: DaylightLayerProps) {
  const sun = sunTimesCached(place.lat, place.lon, {
    year: day.getFullYear(),
    month: day.getMonth() + 1,
    day: day.getDate(),
  });
  if (sun.kind === "polarDay") return null;
  if (sun.kind === "polarNight") {
    return <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-cal-night" />;
  }
  const dawn = percent(minuteOfDay(sun.dawn));
  const sunrise = percent(minuteOfDay(sun.sunrise));
  const sunset = percent(minuteOfDay(sun.sunset));
  const dusk = percent(minuteOfDay(sun.dusk));
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage: `linear-gradient(to bottom, var(--cal-night) 0%, var(--cal-night) ${dawn}, transparent ${sunrise}, transparent ${sunset}, var(--cal-night) ${dusk}, var(--cal-night) 100%)`,
      }}
    />
  );
}
