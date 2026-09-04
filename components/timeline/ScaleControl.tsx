"use client";

import { Kbd } from "@/components/ui/kbd";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SCALES } from "@/lib/time/scale";
import type { TimeScale } from "@/types";

const SCALE_LABELS: Record<TimeScale, { short: string; label: string }> = {
  year: { short: "Y", label: "Years" },
  month: { short: "M", label: "Months" },
  week: { short: "W", label: "Weeks" },
  day: { short: "D", label: "Days" },
  hour: { short: "H", label: "Hours" },
};

interface ScaleControlProps {
  value: TimeScale;
  onChange: (scale: TimeScale) => void;
  scales?: readonly TimeScale[];
}

export function ScaleControl({ value, onChange, scales = SCALES }: ScaleControlProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      aria-label="Zoom"
      onValueChange={(next) => {
        if (next) onChange(next as TimeScale);
      }}
    >
      {scales.map((scale) => (
        <Tooltip key={scale}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value={scale}
              aria-label={SCALE_LABELS[scale].label}
              className="w-8 px-0 font-medium"
            >
              {SCALE_LABELS[scale].short}
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{SCALE_LABELS[scale].label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}

export function ZoomHint() {
  return (
    <span className="hidden items-center gap-1 text-xs text-muted-foreground lg:flex">
      Zoom
      <Kbd>-</Kbd>
      <Kbd>+</Kbd>
    </span>
  );
}
