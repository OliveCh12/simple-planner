"use client";

import type { CSSProperties } from "react";
import { differenceInCalendarDays } from "date-fns";
import type { CalendarDragPreview } from "@/hooks/useCalendarPointer";
import { HOUR_PX, minutesOf } from "@/lib/calendar-snap";
import { categorySurface } from "@/lib/colors";
import { parseLocal } from "@/lib/time/local";
import { cn } from "@/lib/utils";

/**
 * Slot previews. `hover`: where a click would create. `create`: the range
 * being swept. `move` / `resize`: the landing slot under a lifted card — the
 * card itself carries the colour, so the landing stays an outline.
 */
function ghostStyle(preview: CalendarDragPreview): { className: string; style?: CSSProperties } {
  if (preview.mode === "hover") {
    return {
      className:
        "border border-foreground/15 bg-foreground/[0.035] text-muted-foreground backdrop-blur-[2px] transition-[top,height] duration-100 ease-out",
    };
  }
  if (preview.mode === "create" || !preview.color) {
    return {
      className: "border border-dashed border-primary/70 bg-primary/10 text-foreground",
    };
  }
  const surface = categorySurface(preview.color, preview.kind === "event" ? "event" : "task");
  return {
    className: "border-[1.5px] border-dashed",
    style: {
      borderColor: surface.color,
      backgroundColor: `color-mix(in oklab, ${surface.color} 9%, transparent)`,
      color: surface.ink,
      ["--cat" as string]: surface.color,
    },
  };
}

function GhostBody({ preview, block }: { preview: CalendarDragPreview; block: boolean }) {
  const landing = preview.mode === "move" || preview.mode === "resize";
  const title = preview.mode === "hover" || preview.mode === "create" ? "New event" : (preview.title ?? "");
  if (landing) {
    return (
      <span className="inline-flex max-w-full items-center rounded-sm bg-background/85 px-1 py-px text-[11.5px] leading-4 font-medium tabular-nums shadow-xs">
        {preview.label}
      </span>
    );
  }
  return (
    <div className={cn("flex min-w-0", block ? "flex-col gap-0" : "items-center gap-1.5")}>
      {title && <span className={cn("min-w-0 truncate font-medium", preview.creating && "opacity-80")}>{title}</span>}
      <span className="truncate text-[11.5px] tabular-nums opacity-80">{preview.label}</span>
    </div>
  );
}

export function AllDayGhost({ preview, origin, days = 7 }: { preview: CalendarDragPreview; origin: Date; days?: number }) {
  const start = parseLocal(preview.start.slice(0, 10));
  const end = parseLocal((preview.end ?? preview.start).slice(0, 10));
  const from = Math.max(0, differenceInCalendarDays(start, origin));
  const to = Math.min(days - 1, differenceInCalendarDays(end, origin));
  if (to < 0 || from > days - 1) return null;
  const { className, style } = ghostStyle(preview);
  return (
    <div
      data-cal-ghost={preview.mode === "hover" ? "hover" : "landing"}
      className="pointer-events-none absolute top-0 z-20 px-0.5 pt-[3px]"
      style={{ left: `${(from / days) * 100}%`, width: `${((to - from + 1) / days) * 100}%` }}
    >
      <div className={cn("rounded-[5px] px-1.5 py-[3px] text-xs leading-4", className)} style={style}>
        <GhostBody preview={preview} block={false} />
      </div>
    </div>
  );
}

export function TimedGhost({
  preview,
  origin,
  days,
  gutter,
}: {
  preview: CalendarDragPreview;
  origin: Date;
  days: number;
  gutter: string;
}) {
  const start = parseLocal(preview.start);
  const end = parseLocal(preview.end ?? preview.start);
  const index = differenceInCalendarDays(new Date(start.getFullYear(), start.getMonth(), start.getDate()), origin);
  if (index < 0 || index >= days) return null;
  const top = (minutesOf(start) / 60) * HOUR_PX;
  const height = Math.max(20, ((end.getTime() - start.getTime()) / 3_600_000) * HOUR_PX);
  const { className, style } = ghostStyle(preview);
  const hover = preview.mode === "hover";
  return (
    <div
      data-cal-ghost={hover ? "hover" : "landing"}
      className={cn(
        "pointer-events-none absolute z-20 px-0.5 py-px",
        hover && "transition-[top] duration-100 ease-out motion-reduce:transition-none"
      )}
      style={{
        left: `calc(${gutter} + ${index} * (100% - ${gutter}) / ${days})`,
        width: `calc((100% - ${gutter}) / ${days})`,
        top,
        height,
      }}
    >
      <div
        className={cn("flex h-full items-start overflow-hidden rounded-[5px] px-1.5 py-1 text-xs leading-4", className)}
        style={style}
      >
        <GhostBody preview={preview} block />
      </div>
    </div>
  );
}
