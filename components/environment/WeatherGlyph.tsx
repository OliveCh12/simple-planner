"use client";

import { weatherKind, type WeatherTone } from "@/lib/environment/weather-codes";
import { cn } from "@/lib/utils";

/** Low-saturation tones that read in both themes without shouting. */
const TONE_CLASS: Record<WeatherTone, string> = {
  clear: "text-amber-500/85",
  cloud: "text-muted-foreground",
  fog: "text-muted-foreground",
  rain: "text-sky-600/80 dark:text-sky-400/80",
  snow: "text-sky-500/70 dark:text-sky-300/80",
  storm: "text-violet-600/80 dark:text-violet-400/80",
};

interface WeatherGlyphProps {
  code: number;
  className?: string;
  /** Adds the condition as accessible text; off when a parent already labels it. */
  labelled?: boolean;
}

export function WeatherGlyph({ code, className, labelled = false }: WeatherGlyphProps) {
  const kind = weatherKind(code);
  return (
    <>
      <kind.icon aria-hidden className={cn("size-3.5 shrink-0", TONE_CLASS[kind.tone], className)} />
      {labelled && <span className="sr-only">{kind.label}</span>}
    </>
  );
}
