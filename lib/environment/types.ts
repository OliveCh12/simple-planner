/** A resolved point on Earth. Coordinates are what forecasts need; the name is for people. */
export interface Place {
  name: string;
  lat: number;
  lon: number;
  /** IANA zone of the place, e.g. `Europe/Lisbon`. Absent when unknown. */
  timezone?: string;
  country?: string;
}

/** One civil day at a place, in that place's local dates. Temperatures follow the chosen unit. */
export interface DailyWeather {
  /** `YYYY-MM-DD` in the place's time zone. */
  date: string;
  /** WMO weather interpretation code. */
  code: number;
  tMax: number;
  tMin: number;
  /** 0–100, absent when the model has no probability for that day. */
  precipProbMax?: number;
  /** mm (or inches in imperial). */
  precipSum?: number;
  windMax?: number;
  /** ISO local time at the place, as returned by the source. */
  sunrise?: string;
  sunset?: string;
  daylightSec?: number;
}

/** One hour at a place, local to the place. */
export interface HourlyWeather {
  /** `YYYY-MM-DDTHH:00` in the place's time zone. */
  time: string;
  code: number;
  temp: number;
  precipProb?: number;
}

export type SunTimes =
  | {
      kind: "normal";
      /** Civil dawn (sun 6° below the horizon). */
      dawn: Date;
      sunrise: Date;
      sunset: Date;
      /** Civil dusk. */
      dusk: Date;
      daylightMinutes: number;
    }
  | { kind: "polarDay" }
  | { kind: "polarNight" };

export type TemperatureUnit = "celsius" | "fahrenheit";

export type WeatherDetail = "icon" | "full";

/** How the calendar uses the outside world. Everything off by default. */
export interface EnvironmentSettings {
  /** Forecast glyphs in week and month day headers, for `location`. */
  weather: boolean;
  /** Forecast in the details pane for events with a place (and, with `location`, events without one). */
  eventWeather: boolean;
  /** Day and night wash on the hour grid, from real sunrise and sunset at `location`. */
  daylight: boolean;
  units: TemperatureUnit;
  detail: WeatherDetail;
  /** The user's default place. Optional; nothing is fetched without it. */
  location?: Place;
}

/** How far a value sits from now, so the UI can say what it is honestly. */
export type ForecastHorizon = "observed" | "today" | "forecast" | "outlook" | "none";
