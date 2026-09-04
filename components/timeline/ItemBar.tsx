"use client";

import { memo, useState } from "react";
import { Repeat } from "lucide-react";
import { TaskDetailsPanel } from "@/components/item/TaskDetailsPanel";
import { colorAlpha } from "@/lib/colors";
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
  const [open, setOpen] = useState(false);
  const completed = planItem.status === "completed";
  const dragging = preview?.taskId === planItem.id;
  const barX = dragging ? preview.x : item.x;
  const barWidth = dragging ? preview.width : item.width;
  const boxWidth = Math.max(barWidth, item.labelWidth);
  const milestone = item.kind === "milestone";
  const labelFits = item.labelWidth <= barWidth;
  const stuck = Math.max(0, Math.min(Math.max(0, barWidth - 24), fromX - barX + 4));
  const kind = getKindOption(item.itemKind ?? planItem.kind);
  const color = item.categoryColor;
  const draggable = item.primary !== false;

  return (
    <TaskDetailsPanel item={planItem} open={open && !dragging} onOpenChange={setOpen}>
      <button
        type="button"
        data-task-bar={draggable ? planItem.id : undefined}
        data-bar-x={item.x}
        data-bar-width={item.width}
        title={`${kind.label}: ${planItem.title}`}
        style={{ left: barX, top, width: boxWidth, height }}
        className={cn(
          "absolute cursor-pointer bg-transparent text-left text-sm leading-tight",
          labelFits ? "overflow-hidden" : "overflow-visible",
          completed && "opacity-60",
          highlight && "z-10"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute left-0",
            milestone && "top-1/2 rotate-45 rounded-sm -translate-y-1/2",
            !milestone && "inset-y-0 rounded-md",
            planItem.kind === "objective" && "border border-dashed",
            planItem.kind === "event" && !milestone && "border-l-[3px]",
            planItem.kind === "task" && variant === "allDay" && "border",
            !color && variant === "allDay" && "border-primary/70 bg-primary/20",
            !color && variant === "timed" && "bg-primary"
          )}
          style={{
            width: milestone ? barWidth : barWidth,
            height: milestone ? barWidth : undefined,
            borderColor: color,
            backgroundColor: color
              ? colorAlpha(color, variant === "timed" && planItem.kind === "event" ? 0.85 : 0.22)
              : undefined,
          }}
        />
        {draggable && (
          <>
            <span data-resize="start" className="absolute inset-y-0 left-0 z-[2] w-1.5 cursor-ew-resize" />
            <span
              data-resize="end"
              className="absolute inset-y-0 z-[2] w-1.5 cursor-ew-resize"
              style={{ left: Math.max(0, barWidth - 6) }}
            />
          </>
        )}
        <span
          className={cn(
            "relative z-[1] flex h-full items-center gap-1 truncate px-1.5",
            !labelFits && "rounded-r-md bg-background",
            variant === "timed" && labelFits && !color ? "text-primary-foreground" : "text-foreground"
          )}
          style={{
            width: labelFits ? barWidth : item.labelWidth,
            transform: stuck > 0 ? `translateX(${stuck}px)` : undefined,
          }}
        >
          <kind.icon className="size-3 shrink-0 opacity-80" />
          {item.recurring && <Repeat className="size-3 shrink-0 opacity-70" />}
          <span className="min-w-0 truncate">{planItem.title}</span>
        </span>
      </button>
    </TaskDetailsPanel>
  );
});
