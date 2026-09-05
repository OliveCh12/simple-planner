"use client";

import { memo } from "react";
import { CornerDownRight, Repeat } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { useChildProgress, useIsSubtask } from "@/hooks/useItemTree";
import { categorySurface, surfaceTone } from "@/lib/colors";
import { getKindOption } from "@/lib/constants";
import type { DragPreview } from "@/hooks/useTaskPointer";
import type { LaneItem } from "@/lib/lanes";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/types";

interface ItemBarProps {
  item: LaneItem;
  planItem: PlanItem;
  top: number;
  height: number;
  variant: "allDay" | "timed";
  fromX: number;
  preview: DragPreview | null;
  highlight?: boolean;
}

export const ItemBar = memo(function ItemBar({
  item,
  planItem,
  top,
  height,
  variant,
  fromX,
  preview,
  highlight,
}: ItemBarProps) {
  const ui = useCalendarUi();
  const { done, total } = useChildProgress(planItem.id);
  const subtask = useIsSubtask(planItem);
  const completed = planItem.status === "completed";
  const dragging = preview?.taskId === planItem.id;
  const barX = dragging ? preview.x : item.x;
  const barWidth = dragging ? preview.width : item.width;
  const boxWidth = Math.max(barWidth, item.labelWidth);
  const milestone = item.kind === "milestone";
  const labelFits = item.labelWidth <= barWidth;
  const stuck = Math.max(0, Math.min(Math.max(0, barWidth - 24), fromX - barX + 4));
  const kind = getKindOption(item.itemKind ?? planItem.kind);
  const Icon = subtask ? CornerDownRight : kind.icon;
  const color = item.categoryColor;
  const occurrenceStart = item.occurrenceStart ?? planItem.start;
  const occurrenceEnd = item.occurrenceEnd ?? planItem.end ?? occurrenceStart;
  const selected = Boolean(highlight || ui?.selectedId === planItem.id);
  const surface = color ? categorySurface(color, surfaceTone(planItem.kind, subtask)) : undefined;

  return (
    <div
      data-task-bar={planItem.id}
      data-occurrence-start={occurrenceStart}
      data-occurrence-end={occurrenceEnd}
      data-bar-x={item.x}
      data-bar-width={item.width}
      title={`${subtask ? "Subtask" : kind.label}: ${planItem.title}`}
      style={{ left: barX, top, width: boxWidth, height }}
      className={cn(
        "absolute cursor-pointer bg-transparent text-left text-sm leading-tight",
        labelFits ? "overflow-hidden" : "overflow-visible",
        completed && "opacity-60",
        selected && "z-10 ring-1 ring-ring ring-offset-1 ring-offset-background"
      )}
      onClick={() => {
        if (dragging) return;
        ui?.onSelect(planItem.id, planItem.recurrence ? occurrenceStart : undefined);
      }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute left-0",
          milestone && "top-1/2 rotate-45 rounded-sm -translate-y-1/2",
          !milestone && "inset-y-0 rounded-md",
          !color && variant === "allDay" && "bg-primary/20",
          !color && variant === "timed" && "bg-primary"
        )}
        style={{
          width: milestone ? barWidth : barWidth,
          height: milestone ? barWidth : undefined,
          backgroundImage: surface?.backgroundImage,
          backgroundColor: color ? "transparent" : undefined,
        }}
      />
      <span data-resize="start" className="absolute inset-y-0 left-0 z-[2] w-1.5 cursor-ew-resize" />
      <span
        data-resize="end"
        className="absolute inset-y-0 z-[2] w-1.5 cursor-ew-resize"
        style={{ left: Math.max(0, barWidth - 6) }}
      />
      <span
        className={cn(
          "relative z-[1] flex h-full items-center gap-1 truncate px-1.5",
          !labelFits && "rounded-r-md bg-background",
          variant === "timed" && labelFits && !color ? "text-primary-foreground" : "text-foreground",
          subtask && "text-muted-foreground"
        )}
        style={{
          width: labelFits ? barWidth : item.labelWidth,
          transform: stuck > 0 ? `translateX(${stuck}px)` : undefined,
        }}
      >
        <Icon
          className="size-3 shrink-0"
          style={surface ? { color: surface.color } : undefined}
        />
        {item.recurring && <Repeat className="size-3 shrink-0 opacity-70" />}
        <span className={cn("min-w-0 truncate", planItem.kind === "event" && "font-medium")}>
          {planItem.title}
        </span>
        {total > 0 && (
          <span className="shrink-0 tabular-nums text-[10px] opacity-70" aria-label={`${done} of ${total} done`}>
            {done}/{total}
          </span>
        )}
      </span>
    </div>
  );
});
