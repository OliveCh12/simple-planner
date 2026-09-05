import { useShallow } from "zustand/react/shallow";
import {
  childProgress,
  hasNestedChildren,
  nestedChildren,
  type ChildProgress,
} from "@/lib/domain/tree";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem } from "@/types";

/** Direct-children completion of an item, from the current calendar's items. */
export function useChildProgress(itemId: string): ChildProgress {
  return usePlannerStore(useShallow((s) => childProgress(itemId, s.items)));
}

/** Whether the item is nested under a task (a subtask). */
export function useIsSubtask(item: Pick<PlanItem, "kind" | "parentId">): boolean {
  return usePlannerStore((s) => {
    if (item.kind !== "task" || !item.parentId) return false;
    const parent = s.items.find((entry) => entry.id === item.parentId);
    return parent?.kind === "task";
  });
}

/** True when this item has task children folded behind a chevron. */
export function useHasFoldableChildren(itemId: string): boolean {
  return usePlannerStore((s) => hasNestedChildren(itemId, s.items));
}

/** All-day nested work drawn inside the parent card. */
export function useNestedChildren(itemId: string): PlanItem[] {
  return usePlannerStore(useShallow((s) => nestedChildren(itemId, s.items)));
}
