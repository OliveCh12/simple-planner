import { usePlannerStore } from "@/store/plannerStore";

export function usePlanItems() {
  return usePlannerStore((state) => state.items);
}
