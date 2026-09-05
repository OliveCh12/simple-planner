"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { geocode } from "@/lib/environment/open-meteo";
import type { Place } from "@/lib/environment/types";
import { cn } from "@/lib/utils";
import type { Location } from "@/types";

const DEBOUNCE_MS = 280;

interface PlacePickerProps {
  value?: Location;
  onChange: (next: Location | undefined) => void;
  placeholder?: string;
  className?: string;
  /** Tell the user what coordinates unlock; off in the settings page which explains it itself. */
  hint?: boolean;
  "aria-label"?: string;
}

function toLocation(place: Place): Location {
  const next: Location = { name: place.name, lat: place.lat, lon: place.lon };
  if (place.timezone) next.timezone = place.timezone;
  if (place.country) next.country = place.country;
  return next;
}

/**
 * Free text with suggestions. A picked suggestion carries coordinates and a
 * time zone; typed text stays a plain name, which is fine for "Online".
 */
export function PlacePicker({
  value,
  onChange,
  placeholder = "Add a place",
  className,
  hint = true,
  "aria-label": ariaLabel = "Place",
}: PlacePickerProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const request = useRef(0);
  // A keyboard action already settled the value; the trailing blur must not commit stale text.
  const settled = useRef(false);
  const latest = useRef<{ commitText: () => void }>({ commitText: () => {} });
  const valueName = value?.name ?? "";
  const [syncedName, setSyncedName] = useState(valueName);
  const [query, setQuery] = useState(valueName);
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const hasCoordinates = typeof value?.lat === "number" && typeof value?.lon === "number";

  // Follow the saved value when it changes from outside (another item, undo).
  if (valueName !== syncedName) {
    setSyncedName(valueName);
    setQuery(valueName);
  }

  useEffect(() => {
    return () => {
      window.clearTimeout(timer.current);
      request.current += 1;
    };
  }, []);

  const search = (text: string) => {
    window.clearTimeout(timer.current);
    const trimmed = text.trim();
    if (trimmed.length < 2 || trimmed === valueName) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++request.current;
    timer.current = window.setTimeout(() => {
      geocode(trimmed)
        .then((places) => {
          if (id !== request.current) return;
          setResults(places);
          setActive(0);
        })
        .catch(() => {
          if (id === request.current) setResults([]);
        })
        .finally(() => {
          if (id === request.current) setLoading(false);
        });
    }, DEBOUNCE_MS);
  };

  const pick = (place: Place) => {
    settled.current = true;
    window.clearTimeout(timer.current);
    request.current += 1;
    onChange(toLocation(place));
    setQuery(place.name);
    setOpen(false);
    setResults([]);
    setLoading(false);
  };

  const commitText = () => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (value) onChange(undefined);
      return;
    }
    if (trimmed === valueName) return;
    onChange({ name: trimmed });
  };

  useEffect(() => {
    latest.current.commitText = commitText;
  });

  const showList = open && (results.length > 0 || loading);

  return (
    <div className={cn("relative min-w-0 flex-1", className)}>
      <div className="flex items-center gap-1">
        <MapPin className={cn("size-3.5 shrink-0", hasCoordinates ? "text-foreground/70" : "text-muted-foreground/60")} />
        <Input
          ref={inputRef}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          placeholder={placeholder}
          className="h-7 border-transparent bg-transparent px-1.5 shadow-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 dark:bg-transparent md:text-sm"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            search(event.target.value);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Let a click on a suggestion land first, then commit what is still pending.
            window.setTimeout(() => {
              setOpen(false);
              if (settled.current) {
                settled.current = false;
                return;
              }
              latest.current.commitText();
            }, 120);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && results.length) {
              event.preventDefault();
              setActive((index) => (index + 1) % results.length);
            } else if (event.key === "ArrowUp" && results.length) {
              event.preventDefault();
              setActive((index) => (index - 1 + results.length) % results.length);
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (showList && results[active]) {
                pick(results[active]);
              } else {
                settled.current = true;
                commitText();
              }
              inputRef.current?.blur();
            } else if (event.key === "Escape") {
              event.preventDefault();
              settled.current = true;
              setOpen(false);
              setQuery(valueName);
              inputRef.current?.blur();
            }
          }}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label="Clear place"
            className="text-muted-foreground"
            onClick={() => {
              onChange(undefined);
              setQuery("");
            }}
          >
            <X />
          </Button>
        )}
      </div>
      {hint && value && (
        <p className="pl-5 text-[11px] text-muted-foreground">
          {hasCoordinates ? "Forecast and sunrise follow this place." : "Pick a suggestion to get its forecast."}
        </p>
      )}
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute top-full left-0 z-50 mt-1 w-full min-w-56 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {loading && results.length === 0 && (
            <li className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
              <Spinner className="size-3" /> Searching…
            </li>
          )}
          {results.map((place, index) => (
            <li
              key={`${place.lat},${place.lon}`}
              role="option"
              aria-selected={index === active}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                index === active && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                pick(place);
              }}
              onMouseEnter={() => setActive(index)}
            >
              <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate">{place.name}</span>
              {place.timezone && (
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {place.timezone.split("/").pop()?.replace(/_/g, " ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
