import { addSubtask, completeItem, createItem, updateItem, type CreateItemInput } from "@/lib/domain/items";
import type { ItemFilter, PlannerRepository } from "@/lib/repository/types";
import type { Executor, ItemKind, ItemStatus, LocalDateTime, PlanItem } from "@/types";

const SCHEMA_HREF = "/schema/planner.schema.json";

export function toAgentJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function listPlans(repo: PlannerRepository) {
  return repo.plans.list();
}

export async function listItems(repo: PlannerRepository, filter: ItemFilter = {}) {
  return repo.items.query(filter);
}

export async function getItem(repo: PlannerRepository, id: string) {
  const item = await repo.items.get(id);
  if (!item) return null;
  return { $schema: SCHEMA_HREF, version: 3 as const, items: [item] };
}

export async function createItemTool(repo: PlannerRepository, input: CreateItemInput) {
  const item = createItem(input);
  await repo.items.put(item);
  return item;
}

export async function updateItemTool(
  repo: PlannerRepository,
  id: string,
  patch: Partial<Omit<PlanItem, "id" | "planId" | "createdAt">>
) {
  const existing = await repo.items.get(id);
  if (!existing) return null;
  const next = updateItem(existing, patch);
  await repo.items.put(next);
  return next;
}

export async function completeItemTool(repo: PlannerRepository, id: string) {
  const existing = await repo.items.get(id);
  if (!existing) return null;
  const next = completeItem(existing);
  await repo.items.put(next);
  return next;
}

export async function addSubtaskTool(
  repo: PlannerRepository,
  parentId: string,
  input: Omit<CreateItemInput, "planId" | "parentId">
) {
  const parent = await repo.items.get(parentId);
  if (!parent) return null;
  const child = addSubtask(parent, input);
  await repo.items.put(child);
  return child;
}

export async function searchItems(
  repo: PlannerRepository,
  input: {
    query: string;
    planId?: string;
    kind?: ItemKind | ItemKind[];
    executor?: Executor | Executor[];
    status?: ItemStatus | ItemStatus[];
    from?: LocalDateTime;
    to?: LocalDateTime;
    assigneeId?: string;
  }
) {
  return repo.items.query(input);
}

/** Typical agent inbox: AI executor, not finished. */
export function aiQueueFilter(planId?: string): ItemFilter {
  return {
    planId,
    executor: "ai",
    status: ["pending", "in-progress"],
  };
}
