import type { SunTimes } from "@/lib/environment/types";

/**
 * Sunrise, sunset and civil twilight from the standard sunrise equation
 * (NOAA / Meeus simplification). Accurate to about a minute at ordinary
 * latitudes, which is all a calendar wash and a tooltip need. Returns
 * absolute instants; callers format them in whichever zone they display.
 */

const J2000 = 2451545.0;
const MS_PER_DAY = 86_400_000;
const RAD = Math.PI / 180;
const OBLIQUITY = 23.4397 * RAD;
/** Apparent elevation of the sun's upper limb at rise/set, refraction included. */
const HORIZON_DEG = -0.833;
const CIVIL_TWILIGHT_DEG = -6;

export interface CivilDate {
  year: number;
  month: number;
  day: number;
}

function toJulian(ms: number): number {
  return ms / MS_PER_DAY + 2440587.5;
}

function fromJulian(j: number): Date {
  return new Date((j - 2440587.5) * MS_PER_DAY);
}

function hourAngle(elevationDeg: number, latRad: number, decRad: number): number | null {
  const cos =
    (Math.sin(elevationDeg * RAD) - Math.sin(latRad) * Math.sin(decRad)) /
    (Math.cos(latRad) * Math.cos(decRad));
  if (cos > 1 || cos < -1) return null;
  return Math.acos(cos) / RAD;
}

export function sunTimes(lat: number, lon: number, civil: CivilDate): SunTimes {
  // Solar noon of that civil day at this longitude, so the day count is right
  // on both sides of the date line.
  const noonUtc = Date.UTC(civil.year, civil.month - 1, civil.day, 12) - (lon / 15) * 3_600_000;
  const n = Math.round(toJulian(noonUtc) - J2000);
  const jStar = n - lon / 360;
  const meanAnomaly = (((357.5291 + 0.98560028 * jStar) % 360) + 360) % 360;
  const m = meanAnomaly * RAD;
  const center = 1.9148 * Math.sin(m) + 0.02 * Math.sin(2 * m) + 0.0003 * Math.sin(3 * m);
  const eclipticLon = ((meanAnomaly + center + 180 + 102.9372) % 360) * RAD;
  const jTransit = J2000 + jStar + 0.0053 * Math.sin(m) - 0.0069 * Math.sin(2 * eclipticLon);
  const declination = Math.asin(Math.sin(eclipticLon) * Math.sin(OBLIQUITY));
  const latRad = lat * RAD;

  const rise = hourAngle(HORIZON_DEG, latRad, declination);
  if (rise === null) {
    // Sun never crosses the horizon today: above it all day, or below it all day.
    const midday = Math.sin(latRad) * Math.sin(declination) + Math.cos(latRad) * Math.cos(declination);
    return midday > Math.sin(HORIZON_DEG * RAD) ? { kind: "polarDay" } : { kind: "polarNight" };
  }
  const twilight = hourAngle(CIVIL_TWILIGHT_DEG, latRad, declination) ?? rise;

  const sunrise = fromJulian(jTransit - rise / 360);
  const sunset = fromJulian(jTransit + rise / 360);
  return {
    kind: "normal",
    dawn: fromJulian(jTransit - twilight / 360),
    sunrise,
    sunset,
    dusk: fromJulian(jTransit + twilight / 360),
    daylightMinutes: Math.round((sunset.getTime() - sunrise.getTime()) / 60_000),
  };
}

const memo = new Map<string, SunTimes>();

/** Same input, same answer; the grid asks for the same days on every render. */
export function sunTimesCached(lat: number, lon: number, civil: CivilDate): SunTimes {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}|${civil.year}-${civil.month}-${civil.day}`;
  const hit = memo.get(key);
  if (hit) return hit;
  const value = sunTimes(lat, lon, civil);
  if (memo.size > 2000) memo.clear();
  memo.set(key, value);
  return value;
}

export function formatDaylight(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${String(rest).padStart(2, "0")}` : `${hours} h`;
}
