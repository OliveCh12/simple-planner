import { createId } from "@/lib/id";
import { normalizeHex, SWATCH_COLORS } from "@/lib/colors";
import { planSchemaV3 } from "@/lib/validation";
import type { CalendarSource, Plan, TimeScale } from "@/types";
import { DomainError } from "@/lib/domain/items";

function nowIso() {
  return new Date().toISOString();
}

export function createPlanRecord(input: {
  title: string;
  start: string;
  end: string;
  description?: string;
  color?: string;
  scale?: TimeScale;
  source?: CalendarSource;
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
  if (input.color) plan.color = normalizeHex(input.color);
  if (input.scale) plan.scale = input.scale;
  if (input.source) plan.source = input.source;
  return parsePlan(plan);
}

/** First swatch no calendar uses yet, so new calendars stay distinguishable. */
export function suggestPlanColor(plans: Pick<Plan, "color">[]): string {
  const used = new Set(plans.map((plan) => plan.color).filter(Boolean));
  const free = SWATCH_COLORS.find((swatch) => !used.has(swatch.hex));
  return free?.hex ?? SWATCH_COLORS[plans.length % SWATCH_COLORS.length].hex;
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
  const next: Plan = {
    ...plan,
    ...patch,
    id: plan.id,
    createdAt: plan.createdAt,
    updatedAt: nowIso(),
  };
  if ("color" in patch) {
    if (patch.color) next.color = normalizeHex(patch.color);
    else delete next.color;
  }
  if ("description" in patch && !patch.description) delete next.description;
  if ("source" in patch && !patch.source) delete next.source;
  return parsePlan(next);
}
