import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudSun,
  Snowflake,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { TemperatureUnit } from "@/lib/environment/types";

export type WeatherTone = "clear" | "cloud" | "fog" | "rain" | "snow" | "storm";

export interface WeatherKind {
  label: string;
  icon: LucideIcon;
  tone: WeatherTone;
  /** Worth flagging when planning something outdoors. */
  alert?: boolean;
}

/** WMO 4677 interpretation codes, as used by Open-Meteo. */
export function weatherKind(code: number): WeatherKind {
  if (code === 0) return { label: "Clear", icon: Sun, tone: "clear" };
  if (code === 1) return { label: "Mostly clear", icon: Sun, tone: "clear" };
  if (code === 2) return { label: "Partly cloudy", icon: CloudSun, tone: "cloud" };
  if (code === 3) return { label: "Overcast", icon: Cloud, tone: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", icon: CloudFog, tone: "fog" };
  if (code >= 51 && code <= 57) return { label: "Drizzle", icon: CloudDrizzle, tone: "rain" };
  if (code === 61 || code === 80) return { label: "Light rain", icon: CloudRain, tone: "rain" };
  if (code === 63 || code === 81) return { label: "Rain", icon: CloudRain, tone: "rain" };
  if (code === 65 || code === 82) return { label: "Heavy rain", icon: CloudRainWind, tone: "rain", alert: true };
  if (code === 66 || code === 67) return { label: "Freezing rain", icon: CloudRain, tone: "snow", alert: true };
  if (code === 71 || code === 85) return { label: "Light snow", icon: CloudSnow, tone: "snow" };
  if (code === 73) return { label: "Snow", icon: CloudSnow, tone: "snow" };
  if (code === 75 || code === 86) return { label: "Heavy snow", icon: Snowflake, tone: "snow", alert: true };
  if (code === 77) return { label: "Snow grains", icon: Snowflake, tone: "snow" };
  if (code === 95) return { label: "Thunderstorm", icon: CloudLightning, tone: "storm", alert: true };
  if (code === 96 || code === 99) return { label: "Thunderstorm with hail", icon: CloudHail, tone: "storm", alert: true };
  return { label: "Cloudy", icon: Cloud, tone: "cloud" };
}

export function formatTemp(value: number, units: TemperatureUnit = "celsius"): string {
  const rounded = Math.round(value);
  return units === "fahrenheit" ? `${rounded}°F` : `${rounded}°`;
}

export function formatRange(min: number, max: number, units: TemperatureUnit = "celsius"): string {
  const suffix = units === "fahrenheit" ? "°F" : "°";
  return `${Math.round(min)}–${Math.round(max)}${suffix}`;
}

export function formatPrecipitation(probability: number | undefined): string | undefined {
  if (probability === undefined || probability < 20) return undefined;
  return `${Math.round(probability)} % rain`;
}
