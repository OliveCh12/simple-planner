"use client";

import { useParams } from "next/navigation";
import { ItemPageState } from "@/components/item/ItemPage";
import { usePlan } from "@/hooks/usePlan";
import { usePlannerStore } from "@/store/plannerStore";

export default function PlanItemRoute() {
  const params = useParams();
  const planId = typeof params.planId === "string" ? params.planId : "";
  const itemId = typeof params.itemId === "string" ? params.itemId : "";
  const { plan, isLoading } = usePlan(planId || null);
  const items = usePlannerStore((s) => s.items);
  const item = items.find((candidate) => candidate.id === itemId);

  return (
    <ItemPageState planId={planId} isLoading={isLoading} plan={plan} item={item} />
  );
}
