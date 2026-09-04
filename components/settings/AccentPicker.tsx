"use client";

import { Check } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ACCENTS, type AccentId } from "@/lib/themes";

interface AccentPickerProps {
  value: AccentId;
  onChange: (accent: AccentId) => void;
}

/** Swatches carry `data-accent`, so each one renders its own preset in the current mode. */
export function AccentPicker({ value, onChange }: AccentPickerProps) {
  return (
    <ToggleGroup
      type="single"
      spacing={2}
      aria-label="Accent color"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as AccentId);
      }}
    >
      {ACCENTS.map((accent) => (
        <Tooltip key={accent.id}>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value={accent.id}
              aria-label={accent.label}
              data-accent={accent.id}
              className="size-8 min-w-0 rounded-full border-2 border-transparent p-0 hover:border-border hover:bg-transparent data-[state=on]:border-foreground data-[state=on]:bg-transparent"
            >
              <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {accent.id === value && <Check className="size-3" strokeWidth={3} />}
              </span>
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>{accent.label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
