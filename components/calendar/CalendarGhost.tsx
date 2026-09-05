"use client";

import type { CSSProperties } from "react";
import { differenceInCalendarDays } from "date-fns";
import type { CalendarDragPreview } from "@/hooks/useCalendarPointer";
import { HOUR_PX, minutesOf } from "@/lib/calendar-snap";
import { categorySurface } from "@/lib/colors";
import { parseLocal } from "@/lib/time/local";
import { cn } from "@/lib/utils";

/**
 * The target-slot preview while moving, resizing or creating. It wears the
 * item's own colour so nothing turns neutral mid-gesture; a creation ghost
 * uses the accent with a dashed edge, like a draft.
 */
function ghostStyle(preview: CalendarDragPreview): { className: string; style?: CSSProperties } {
  if (preview.creating || !preview.color) {
    return {
      className: "border-dashed border-primary/70 bg-primary/10 text-foreground",
    };
  }
  const surface = categorySurface(preview.color, preview.kind === "event" ? "event" : "task");
  return {
    className: "border-solid shadow-md",
    style: {
      backgroundImage: surface.backgroundImage,
      color: surface.ink,
      borderColor: surface.color,
      ["--cat" as string]: surface.color,
    },
  };
}

function GhostBody({ preview, block }: { preview: CalendarDragPreview; block: boolean }) {
  const title = preview.creating ? "New event" : (preview.title ?? "");
  return (
    <div className={cn("flex min-w-0", block ? "flex-col gap-0" : "items-center gap-1.5")}>
      {title && (
        <span className={cn("min-w-0 truncate font-medium", preview.creating && "italic opacity-70")}>{title}</span>
      )}
      <span className={cn("truncate tabular-nums", block ? "opacity-75" : "opacity-75")}>{preview.label}</span>
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
      className="pointer-events-none absolute top-0 z-30 px-0.5 pt-[3px]"
      style={{ left: `${(from / days) * 100}%`, width: `${((to - from + 1) / days) * 100}%` }}
    >
      <div className={cn("rounded-[5px] border px-1.5 py-[3px] text-[11px] leading-4", className)} style={style}>
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
  return (
    <div
      className="pointer-events-none absolute z-30 px-0.5 py-px"
      style={{
        left: `calc(${gutter} + ${index} * (100% - ${gutter}) / ${days})`,
        width: `calc((100% - ${gutter}) / ${days})`,
        top,
        height,
      }}
    >
      <div
        className={cn(
          "flex h-full items-start overflow-hidden rounded-[5px] border px-1.5 py-1 text-[11px] leading-4",
          className
        )}
        style={style}
      >
        <GhostBody preview={preview} block />
      </div>
    </div>
  );
}
