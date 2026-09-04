"use client";

import { ClusterBar } from "@/components/timeline/ClusterBar";
import { TaskBar } from "@/components/timeline/TaskBar";
import {
  ALL_DAY_LANE_PX,
  TIMED_LANE_PX,
  type LaneItem,
  type LaneStack,
} from "@/lib/lanes";
import { cn } from "@/lib/utils";
import type { Task, TimeScale } from "@/types";

interface LaneLayerProps {
  stack: LaneStack;
  items: LaneItem[];
  tasksById: Map<string, Task>;
  variant: "allDay" | "timed";
  scale: TimeScale;
  fromX: number;
}

function laneHeight(variant: "allDay" | "timed", scale: TimeScale): number {
  if (variant === "allDay") return ALL_DAY_LANE_PX;
  return scale === "day" || scale === "hour" ? TIMED_LANE_PX.fine : TIMED_LANE_PX.coarse;
}

export function LaneLayer({ stack, items, tasksById, variant, scale, fromX }: LaneLayerProps) {
  const height = laneHeight(variant, scale);
  const lanes = Math.max(stack.laneCount, 1);
  const pad = 6;

  return (
    <div
      data-lane-layer={variant}
      className={cn(
        "relative shrink-0",
        variant === "allDay" && "border-b border-border/50",
        variant === "timed" && "min-h-0 flex-1"
      )}
      style={{ minHeight: lanes * height + pad * 2 }}
    >
      {items.map((item) => {
        const top = pad + item.lane * height;
        if (item.kind === "cluster") {
          const tasks = item.memberIds
            .map((id) => tasksById.get(id))
            .filter((task): task is Task => Boolean(task));
          return (
            <ClusterBar
              key={item.id}
              item={item}
              tasks={tasks}
              top={top}
              height={height - 2}
              fromX={fromX}
            />
          );
        }
        const task = tasksById.get(item.taskId);
        if (!task) return null;
        return (
          <TaskBar
            key={item.id}
            item={item}
            task={task}
            top={top}
            height={height - 2}
            variant={variant}
            fromX={fromX}
          />
        );
      })}
    </div>
  );
}
