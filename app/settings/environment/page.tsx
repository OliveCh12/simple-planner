"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PlacePicker } from "@/components/environment/PlacePicker";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { clearEnvironmentCache } from "@/lib/environment/cache";
import { sunTimes, formatDaylight } from "@/lib/environment/sun";
import { formatTimeAt } from "@/lib/environment/place";
import type { Place } from "@/lib/environment/types";
import { useUIStore } from "@/store/uiStore";

function todaySun(place: Place): string | null {
  const now = new Date();
  const sun = sunTimes(place.lat, place.lon, {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  });
  if (sun.kind === "polarDay") return "The sun stays up all day here today.";
  if (sun.kind === "polarNight") return "The sun stays down all day here today.";
  return `Today: sunrise ${formatTimeAt(sun.sunrise, place.timezone)}, sunset ${formatTimeAt(sun.sunset, place.timezone)}, ${formatDaylight(sun.daylightMinutes)} of daylight.`;
}

export default function EnvironmentSettingsPage() {
  const environment = useUIStore((s) => s.settings.environment);
  const updateEnvironment = useUIStore((s) => s.updateEnvironment);
  const [cleared, setCleared] = useState(false);
  const place = environment.location;
  const located = Boolean(place);

  return (
    <SettingsSection
      title="Weather & daylight"
      description="Optional context around your events: forecasts in the calendar and real sunrise and sunset on the hour grid. Nothing is fetched until you set a place."
    >
      <FieldGroup>
        <Field orientation="vertical">
          <FieldContent>
            <FieldLabel htmlFor="default-place">Your location</FieldLabel>
            <FieldDescription>
              A city is enough. Its coordinates and the dates in view are sent to Open-Meteo to fetch
              forecasts; nothing is stored anywhere else. Sunrise and sunset are computed on this device.
            </FieldDescription>
          </FieldContent>
          <div className="max-w-md rounded-md border px-2 py-1">
            <PlacePicker
              aria-label="Your location"
              placeholder="Search a city…"
              hint={false}
              value={place ? { name: place.name, lat: place.lat, lon: place.lon, timezone: place.timezone, country: place.country } : undefined}
              onChange={(next) => {
                if (!next || typeof next.lat !== "number" || typeof next.lon !== "number") {
                  updateEnvironment({ location: undefined, weather: false, daylight: false });
                  if (next) toast("Pick a suggestion so the place has coordinates.");
                  return;
                }
                const nextPlace: Place = { name: next.name, lat: next.lat, lon: next.lon };
                if (next.timezone) nextPlace.timezone = next.timezone;
                if (next.country) nextPlace.country = next.country;
                updateEnvironment({ location: nextPlace });
              }}
            />
          </div>
          {place && <FieldDescription>{todaySun(place)}</FieldDescription>}
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="env-weather">Weather in the calendar</FieldLabel>
            <FieldDescription>
              A small forecast in each day header of the week and month views, for your location.
              {!located && " Set a location first."}
            </FieldDescription>
          </FieldContent>
          <Switch
            id="env-weather"
            checked={environment.weather}
            disabled={!located}
            onCheckedChange={(checked) => updateEnvironment({ weather: checked })}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="env-daylight">Day and night</FieldLabel>
            <FieldDescription>
              Shades the hours before sunrise and after sunset on the week and day grids, from your location.
              {!located && " Set a location first."}
            </FieldDescription>
          </FieldContent>
          <Switch
            id="env-daylight"
            checked={environment.daylight}
            disabled={!located}
            onCheckedChange={(checked) => updateEnvironment({ daylight: checked })}
          />
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor="env-event-weather">Weather for events</FieldLabel>
            <FieldDescription>
              In the details pane, for events whose place was picked from suggestions. Events without a place
              use your location when one is set. Online events show nothing.
            </FieldDescription>
          </FieldContent>
          <Switch
            id="env-event-weather"
            checked={environment.eventWeather}
            onCheckedChange={(checked) => updateEnvironment({ eventWeather: checked })}
          />
        </Field>

        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="env-units">Units</FieldLabel>
          </FieldContent>
          <Select value={environment.units} onValueChange={(value) => updateEnvironment({ units: value as "celsius" | "fahrenheit" })}>
            <SelectTrigger id="env-units" size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="celsius">Celsius</SelectItem>
              <SelectItem value="fahrenheit">Fahrenheit</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="responsive">
          <FieldContent>
            <FieldLabel htmlFor="env-detail">Detail in headers</FieldLabel>
            <FieldDescription>Everything else waits in the tooltip.</FieldDescription>
          </FieldContent>
          <Select value={environment.detail} onValueChange={(value) => updateEnvironment({ detail: value as "icon" | "full" })}>
            <SelectTrigger id="env-detail" size="sm" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="icon">Icon only</SelectItem>
              <SelectItem value="full">Icon, high and rain</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel>Cached forecasts</FieldLabel>
            <FieldDescription>Forecasts refresh every 30 minutes and live only in this browser.</FieldDescription>
          </FieldContent>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={cleared}
            onClick={() => {
              clearEnvironmentCache();
              setCleared(true);
              toast.success("Cached forecasts cleared");
            }}
          >
            Clear
          </Button>
        </Field>
      </FieldGroup>
    </SettingsSection>
  );
}
