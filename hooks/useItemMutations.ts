import { toast } from "sonner";
import { useSaveItem } from "@/hooks/useSaveItem";
import {
  applyStatus,
  DomainError,
  moveItem,
  setKind,
  updateItem,
} from "@/lib/domain/items";
import { usePlannerStore } from "@/store/plannerStore";
import type { EnergyLevel, ItemKind, ItemStatus, PlanItem } from "@/types";

export function useItemMutations(item: PlanItem) {
  const save = useSaveItem();
  const items = usePlannerStore((s) => s.items);

  const run = (build: () => PlanItem) => {
    try {
      return save(build());
    } catch (error) {
      toast.error(error instanceof DomainError ? error.message : "Failed to save item.");
      return Promise.resolve(false);
    }
  };

  const saveTitle = (title: string) => run(() => updateItem(item, { title }));
  const saveNotes = (notes: string) => run(() => updateItem(item, { notes }));
  const saveBrief = (brief: string) =>
    run(() => updateItem(item, { agentBrief: brief.trim() || undefined }));
  const setStatus = (status: ItemStatus) => run(() => applyStatus(item, status));
  const setEnergy = (energy: EnergyLevel) => run(() => updateItem(item, { energy }));
  const setDates = (start: string, end?: string) => run(() => moveItem(item, start, end));
  const changeKind = (kind: ItemKind) => run(() => setKind(item, kind, items));

  return { saveTitle, saveNotes, saveBrief, setStatus, setEnergy, setDates, changeKind };
}
