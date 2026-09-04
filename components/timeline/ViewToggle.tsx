"use client";

import { Calendar, ChartGantt } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TimelineView } from "@/store/uiStore";

interface ViewToggleProps {
  value: TimelineView;
  onChange: (view: TimelineView) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      aria-label="View"
      onValueChange={(next) => {
        if (next) onChange(next as TimelineView);
      }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem value="gantt" aria-label="Gantt view" className="px-2">
            <ChartGantt />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Gantt</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem value="calendar" aria-label="Calendar view" className="px-2">
            <Calendar />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Calendar</TooltipContent>
      </Tooltip>
    </ToggleGroup>
  );
}
