"use client";

import { ENERGY_LEVELS, type EnergyOption } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EnergyLevel } from "@/types";

interface EnergySliderProps {
  value: EnergyLevel;
  onChange: (energy: EnergyLevel) => void;
}

export function EnergySlider({ value, onChange }: EnergySliderProps) {
  const index = Math.max(0, ENERGY_LEVELS.findIndex((entry) => entry.value === value));
  const current = ENERGY_LEVELS[index] as EnergyOption;

  return (
    <div className="space-y-2">
      <input
        type="range"
        min={0}
        max={ENERGY_LEVELS.length - 1}
        step={1}
        value={index}
        aria-label={`Energy: ${current.label}`}
        aria-valuetext={current.label}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground"
        onChange={(event) => {
          const next = ENERGY_LEVELS[Number(event.target.value)];
          if (next) onChange(next.value);
        }}
      />
      <div className="flex justify-between gap-1">
        {ENERGY_LEVELS.map((entry) => (
          <button
            key={entry.value}
            type="button"
            className={cn(
              "text-[11px] text-muted-foreground transition-colors",
              entry.value === value && "font-medium text-foreground"
            )}
            onClick={() => onChange(entry.value)}
          >
            {entry.label}
          </button>
        ))}
      </div>
    </div>
  );
}
