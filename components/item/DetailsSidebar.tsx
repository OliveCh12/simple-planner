"use client";

import { ItemEditor } from "@/components/item/ItemEditor";
import { TaskDetailsPanel } from "@/components/item/TaskDetailsPanel";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/types";

interface DetailsSidebarProps {
  item: PlanItem | null;
  occurrenceStart?: string;
  onClose: () => void;
}

/**
 * Desktop: a right pane that pushes the calendar.
 * Below `lg`, a sheet so the week grid stays readable.
 */
export function DetailsSidebar({ item, occurrenceStart, onClose }: DetailsSidebarProps) {
  return (
    <>
      <aside
        className={cn(
          "hidden h-full shrink-0 overflow-hidden bg-background transition-[width] duration-200 ease-out lg:flex",
          item ? "w-[24rem] border-l" : "w-0"
        )}
        aria-hidden={!item}
        aria-label={item ? "Item details" : undefined}
      >
        {item ? (
          <div className="flex h-full w-[24rem] min-w-[24rem] flex-col">
            <ItemEditor
              key={item.id}
              item={item}
              occurrenceStart={occurrenceStart}
              onClose={onClose}
            />
          </div>
        ) : null}
      </aside>
      {item ? (
        <div className="lg:hidden">
          <TaskDetailsPanel
            key={item.id}
            item={item}
            occurrenceStart={occurrenceStart}
            open
            onOpenChange={(open) => {
              if (!open) onClose();
            }}
          />
        </div>
      ) : null}
    </>
  );
}
