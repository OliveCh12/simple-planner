import { createId } from "@/lib/id";
import { planSchemaV3 } from "@/lib/validation";
import type { Plan, TimeScale } from "@/types";
import { DomainError } from "@/lib/domain/items";

function nowIso() {
  return new Date().toISOString();
}

export function createPlanRecord(input: {
  title: string;
  start: string;
  end: string;
  description?: string;
  scale?: TimeScale;
  id?: string;
}): Plan {
  const now = nowIso();
  const plan: Plan = {
    id: input.id ?? createId(),
    title: input.title.trim(),
    start: input.start,
    end: input.end,
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
  };
  const description = input.description?.trim();
  if (description) plan.description = description;
  if (input.scale) plan.scale = input.scale;
  return parsePlan(plan);
}

export function parsePlan(plan: Plan): Plan {
  const parsed = planSchemaV3.safeParse(plan);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new DomainError(first?.message ?? "Invalid plan");
  }
  return parsed.data;
}

export function updatePlanRecord(plan: Plan, patch: Partial<Omit<Plan, "id" | "createdAt">>): Plan {
  return parsePlan({
    ...plan,
    ...patch,
    id: plan.id,
    createdAt: plan.createdAt,
    updatedAt: nowIso(),
  });
}
