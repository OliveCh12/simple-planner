import { useCallback } from "react";
import { toast } from "sonner";
import { DomainError } from "@/lib/domain/items";
import { usePlannerStore } from "@/store/plannerStore";
import type { PlanItem } from "@/types";

/** Fired after a write attempt, so the editor can show a quiet "Saved" or an error. */
export const ITEM_SAVE_EVENT = "planner:item-save";

export interface ItemSaveDetail {
  id: string;
  ok: boolean;
}

function announce(detail: ItemSaveDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ItemSaveDetail>(ITEM_SAVE_EVENT, { detail }));
}

export function useSaveItem() {
  const putItem = usePlannerStore((s) => s.putItem);

  return useCallback(async (next: PlanItem): Promise<boolean> => {
    try {
      await putItem(next);
      if (!next.draft) announce({ id: next.id, ok: true });
      return true;
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
      announce({ id: next.id, ok: false });
      return false;
    }
  }, [putItem]);
}
