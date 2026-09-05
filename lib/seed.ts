import {
  olivierPlanItems,
  sampleCategories,
  samplePeople,
} from "@/data/sampleData";
import { createPlanRecord } from "@/lib/domain/plans";
import { getRepository } from "@/lib/repository/create";
import type { PlannerRepository } from "@/lib/repository/types";

export const DEMO_PLAN_ID = "plan-demo-career";
export const DEMO_EVENT_ID = "event-jazz";
export const DEMO_SEED_ITEM = "proj-cabin";

function currentYearRange() {
  const year = new Date().getFullYear();
  return { year, start: `${year}-01-01`, end: `${year}-12-31` };
}

export async function seedDirectory(repository: PlannerRepository): Promise<void> {
  const existing = await repository.people.list();
  await Promise.all(samplePeople.map((person) => repository.people.put(person)));
  await Promise.all(sampleCategories.map((category) => repository.categories.put(category)));
  const ownerId = samplePeople[0]?.id;
  const keep = new Set(samplePeople.map((person) => person.id));
  const stale = existing.filter(
    (person) =>
      !keep.has(person.id) &&
      (person.id === "person-you" || person.email === "olivierchemla@gmail.com" || person.id === ownerId)
  );
  await Promise.all(stale.map((person) => repository.people.delete(person.id)));
}

export async function seedDemoPlan(repository: PlannerRepository): Promise<string> {
  const { year, start, end } = currentYearRange();
  const record = createPlanRecord({
    id: DEMO_PLAN_ID,
    title: "Olivier's plan",
    description: "Work, health and nights out — a year in view.",
    color: "#2563eb",
    start,
    end,
    source: { provider: "local", access: "readwrite" },
  });
  await repository.plans.put(record);

  const items = olivierPlanItems(DEMO_PLAN_ID, year);
  const nextIds = new Set(items.map((item) => item.id));
  const stale = (await repository.items.listByPlan(DEMO_PLAN_ID)).filter((item) => !nextIds.has(item.id));
  await Promise.all(stale.map((item) => repository.items.delete(item.id)));
  await repository.items.putMany(items);
  return DEMO_PLAN_ID;
}

/** Upserts Olivier, directory data, and the demo plan when missing or stale. */
export async function ensureDemoData(
  repository: PlannerRepository,
  options: { forcePlan?: boolean } = {}
): Promise<{ planId: string }> {
  await seedDirectory(repository);
  const existing = await repository.plans.get(DEMO_PLAN_ID);
  const items = existing ? await repository.items.listByPlan(DEMO_PLAN_ID) : [];
  const stale =
    !existing ||
    !items.some((item) => item.id === DEMO_EVENT_ID) ||
    !items.some((item) => item.id === DEMO_SEED_ITEM);
  if (!stale && !options.forcePlan) return { planId: existing.id };
  const planId = await seedDemoPlan(repository);
  return { planId };
}

let inflight: Promise<{ planId: string }> | undefined;

export function startDemoSeed(forcePlan = false) {
  if (forcePlan || !inflight) {
    inflight = ensureDemoData(getRepository(), { forcePlan });
  }
  return inflight;
}
