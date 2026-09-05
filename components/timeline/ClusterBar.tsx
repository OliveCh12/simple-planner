"use client";

import { useState } from "react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LaneItem } from "@/lib/lanes";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/types";

interface ClusterBarProps {
  item: LaneItem;
  tasks: PlanItem[];
  top: number;
  height: number;
  fromX: number;
}

export function ClusterBar({ item, tasks, top, height, fromX }: ClusterBarProps) {
  const ui = useCalendarUi();
  const [open, setOpen] = useState(false);
  const boxWidth = Math.max(item.width, item.labelWidth);
  const stuck = Math.max(0, Math.min(Math.max(0, boxWidth - 8), fromX - item.x + 4));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-cluster-bar={item.id}
          style={{ left: item.x, top, width: boxWidth, height }}
          className="absolute cursor-pointer overflow-visible rounded-md bg-muted text-left text-sm text-muted-foreground"
        >
          <span
            className="relative flex h-full items-center truncate px-1.5"
            style={{ transform: stuck > 0 ? `translateX(${stuck}px)` : undefined }}
          >
            {item.title}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        <ul className="flex flex-col">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                className={cn(
                  "w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  task.status === "completed" && "text-muted-foreground line-through"
                )}
                onClick={() => {
                  setOpen(false);
                  ui?.onSelect(task.id);
                }}
              >
                {task.title}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
