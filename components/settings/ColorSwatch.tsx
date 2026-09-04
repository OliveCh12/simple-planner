"use client";

import { Check } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DEFAULT_SWATCH, SWATCH_COLORS, normalizeHex } from "@/lib/colors";
import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  value: string;
  onChange: (color: string) => void;
  "aria-label"?: string;
}

function SwatchDot({
  color,
  selected,
  className,
}: {
  color: string;
  selected: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-5 items-center justify-center rounded-full text-white",
        className
      )}
      style={{ backgroundColor: color }}
    >
      {selected && <Check className="size-3" strokeWidth={3} />}
    </span>
  );
}

/** Hex color swatches, same control pattern as the accent picker. */
export function ColorSwatch({ value, onChange, "aria-label": ariaLabel = "Color" }: ColorSwatchProps) {
  const current = value ? normalizeHex(value) : DEFAULT_SWATCH;
  const isPreset = SWATCH_COLORS.some((swatch) => swatch.hex === current);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        spacing={2}
        aria-label={ariaLabel}
        value={isPreset ? current : ""}
        onValueChange={(next) => {
          if (next) onChange(next);
        }}
      >
        {SWATCH_COLORS.map((swatch) => (
          <Tooltip key={swatch.hex}>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value={swatch.hex}
                aria-label={swatch.label}
                className="size-8 min-w-0 rounded-full border-2 border-transparent p-0 hover:border-border hover:bg-transparent data-[state=on]:border-foreground data-[state=on]:bg-transparent"
              >
                <SwatchDot color={swatch.hex} selected={current === swatch.hex} />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent>{swatch.label}</TooltipContent>
          </Tooltip>
        ))}
      </ToggleGroup>
      <Tooltip>
        <TooltipTrigger asChild>
          <label
            className={cn(
              "flex size-8 cursor-pointer items-center justify-center rounded-full border-2 p-0",
              isPreset ? "border-transparent hover:border-border" : "border-foreground"
            )}
          >
            <SwatchDot color={current} selected={!isPreset} />
            <input
              type="color"
              aria-label="Custom color"
              value={current}
              className="sr-only"
              onChange={(event) => onChange(normalizeHex(event.target.value))}
            />
          </label>
        </TooltipTrigger>
        <TooltipContent>Custom</TooltipContent>
      </Tooltip>
    </div>
  );
}
