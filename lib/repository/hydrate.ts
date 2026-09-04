import { hydratePlan } from "@/lib/domain/convert";
import type { PlannerRepository } from "@/lib/repository/types";
import type { HydratedPlan, PlanItem } from "@/types";

export async function loadHydratedPlan(
  id: string,
  repository: PlannerRepository
): Promise<HydratedPlan | undefined> {
  const plan = await repository.plans.get(id);
  if (!plan) return undefined;
  const items = await repository.items.listByPlan(id);
  return hydratePlan(plan, items);
}

export async function listHydratedPlans(repository: PlannerRepository): Promise<HydratedPlan[]> {
  const [plans, items] = await Promise.all([repository.plans.list(), repository.items.query({})]);
  const byPlan = new Map<string, PlanItem[]>();
  for (const item of items) {
    const list = byPlan.get(item.planId);
    if (list) list.push(item);
    else byPlan.set(item.planId, [item]);
  }
  return plans
    .slice()
    .sort((a, b) => (a.lastAccessedAt < b.lastAccessedAt ? 1 : -1))
    .map((plan) => hydratePlan(plan, byPlan.get(plan.id) ?? []));
}
