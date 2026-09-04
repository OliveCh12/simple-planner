import { sampleCategories, samplePeople, samplePlan, sampleTasks } from "@/data/sampleData";
import { createItem } from "@/lib/domain/items";
import { createPlanRecord } from "@/lib/domain/plans";
import { getRepository } from "@/lib/repository/create";
import type { PlannerRepository } from "@/lib/repository/types";

export const DEMO_PLAN_ID = "plan-demo-career";

function currentYearRange() {
  const year = new Date().getFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export async function seedDirectory(repository: PlannerRepository): Promise<void> {
  const existing = await repository.people.list();
  await Promise.all(samplePeople.map((person) => repository.people.put(person)));
  await Promise.all(sampleCategories.map((category) => repository.categories.put(category)));
  const ownerId = samplePeople[0]?.id;
  const stale = existing.filter(
    (person) =>
      person.id === "person-you" || (person.email === "olivierchemla@gmail.com" && person.id !== ownerId)
  );
  await Promise.all(stale.map((person) => repository.people.delete(person.id)));
}

export async function seedDemoPlan(repository: PlannerRepository): Promise<string> {
  const { start, end } = currentYearRange();
  const record = createPlanRecord({
    id: DEMO_PLAN_ID,
    title: samplePlan.title,
    description: samplePlan.description,
    start,
    end,
  });
  await repository.plans.put(record);

  const ownerId = samplePeople[0]!.id;
  const careerId = sampleCategories.find((category) => category.id === "cat-career")?.id;
  const items = sampleTasks(start).map((task) =>
    createItem({
      id: task.id,
      planId: DEMO_PLAN_ID,
      title: task.title,
      notes: task.notes,
      start: task.start,
      end: task.end,
      status: task.status,
      energy: task.energy,
      assigneeIds: [ownerId],
      categoryId: careerId,
    })
  );
  const stale = (await repository.items.listByPlan(DEMO_PLAN_ID)).filter(
    (item) => !items.some((next) => next.id === item.id)
  );
  await Promise.all(stale.map((item) => repository.items.delete(item.id)));
  await repository.items.putMany(items);
  return DEMO_PLAN_ID;
}

/** Upserts Olivier, the agent, categories, and the demo plan when missing. */
export async function ensureDemoData(
  repository: PlannerRepository,
  options: { forcePlan?: boolean } = {}
): Promise<{ planId: string }> {
  await seedDirectory(repository);
  const existing = await repository.plans.get(DEMO_PLAN_ID);
  if (existing && !options.forcePlan) return { planId: existing.id };
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
