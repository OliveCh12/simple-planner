"use client";

import { sunTimesCached } from "@/lib/environment/sun";
import type { Place } from "@/lib/environment/types";

const DAY_MS = 86_400_000;

/** Position of an instant inside the column's day, clamped to its edges. */
function percentOf(instant: Date, dayStart: Date): string {
  const ratio = Math.min(1, Math.max(0, (instant.getTime() - dayStart.getTime()) / DAY_MS));
  return `${(ratio * 100).toFixed(2)}%`;
}

interface DaylightLayerProps {
  place: Place;
  /** The column's civil day, in the user's zone. */
  day: Date;
}

/**
 * Atmosphere over an hour column from real sun times: deep night fades
 * through a cool dawn into clear day, then through a warm dusk back into
 * night. Sits under the events; the day stays untouched so text keeps
 * full contrast. Polar days render nothing, polar nights a flat wash.
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
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const at = (instant: Date) => percentOf(instant, dayStart);
  const stops = [
    `var(--cal-night) 0%`,
    `var(--cal-night) ${at(sun.nightEnd)}`,
    `var(--cal-dawn) ${at(sun.dawn)}`,
    `transparent ${at(sun.sunrise)}`,
    `transparent ${at(sun.sunset)}`,
    `var(--cal-dusk) ${at(sun.dusk)}`,
    `var(--cal-night) ${at(sun.nightStart)}`,
    `var(--cal-night) 100%`,
  ];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{ backgroundImage: `linear-gradient(to bottom, ${stops.join(", ")})` }}
    />
  );
}
