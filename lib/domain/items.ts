import { planItemSchema } from "@/lib/validation";
import { createId } from "@/lib/id";
import { formatLocal, isAllDay, parseLocal } from "@/lib/time/local";
import { occurrenceEnd } from "@/lib/time/recurrence";
import type { Executor, ItemKind, ItemStatus, LocalDateTime, PlanItem } from "@/types";

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

function nowIso() {
  return new Date().toISOString();
}

export type CreateItemInput = {
  planId: string;
  title: string;
  start: LocalDateTime;
  end?: LocalDateTime;
  kind?: ItemKind;
  notes?: string;
  parentId?: string;
  recurrence?: string;
  recurrenceExceptions?: LocalDateTime[];
  status?: ItemStatus;
  energy?: PlanItem["energy"];
  executor?: Executor;
  agentBrief?: string;
  assigneeIds?: string[];
  attendeeIds?: string[];
  categoryId?: string;
  location?: PlanItem["location"];
  id?: string;
};

export function createItem(input: CreateItemInput): PlanItem {
  const now = nowIso();
  const item: PlanItem = {
    id: input.id ?? createId(),
    planId: input.planId,
    kind: input.kind ?? "task",
    title: input.title.trim(),
    notes: input.notes?.trim() ?? "",
    start: input.start,
    status: input.status ?? "pending",
    energy: input.energy ?? "medium",
    executor: input.executor ?? "human",
    assigneeIds: input.assigneeIds ?? [],
    attendeeIds: input.attendeeIds ?? [],
    createdAt: now,
    updatedAt: now,
  };
  if (input.end !== undefined) item.end = input.end;
  if (input.parentId) item.parentId = input.parentId;
  if (input.recurrence) item.recurrence = input.recurrence;
  if (input.recurrenceExceptions) item.recurrenceExceptions = input.recurrenceExceptions;
  if (input.agentBrief) item.agentBrief = input.agentBrief;
  if (input.categoryId) item.categoryId = input.categoryId;
  if (input.location) item.location = input.location;
  return parseItem(item);
}

export function parseItem(item: PlanItem): PlanItem {
  const parsed = planItemSchema.safeParse(item);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new DomainError(first?.message ?? "Invalid plan item");
  }
  return parsed.data;
}

export function updateItem(item: PlanItem, patch: Partial<Omit<PlanItem, "id" | "planId" | "createdAt">>): PlanItem {
  const next: PlanItem = {
    ...item,
    ...patch,
    id: item.id,
    planId: item.planId,
    createdAt: item.createdAt,
    updatedAt: nowIso(),
  };
  if ("end" in patch && patch.end === undefined) delete next.end;
  if ("parentId" in patch && !patch.parentId) delete next.parentId;
  if ("recurrence" in patch && !patch.recurrence) delete next.recurrence;
  if ("categoryId" in patch && !patch.categoryId) delete next.categoryId;
  if ("agentBrief" in patch && !patch.agentBrief) delete next.agentBrief;
  if ("location" in patch && !patch.location) delete next.location;
  if ("completedAt" in patch && !patch.completedAt) delete next.completedAt;
  return parseItem(next);
}

export function moveItem(item: PlanItem, start: LocalDateTime, end?: LocalDateTime): PlanItem {
  const next: PlanItem = { ...item, start, updatedAt: nowIso() };
  if (end === undefined) delete next.end;
  else next.end = end;
  return parseItem(next);
}

export function completeItem(item: PlanItem, at = nowIso()): PlanItem {
  return parseItem({
    ...item,
    status: "completed",
    completedAt: at,
    updatedAt: at,
  });
}

export function applyStatus(item: PlanItem, status: ItemStatus): PlanItem {
  if (status === "completed") return completeItem(item);
  if (item.status === "completed") return updateItem(reopenItem(item), { status });
  return updateItem(item, { status });
}

export function setExecutor(item: PlanItem, executor: Executor): PlanItem {
  return parseItem({ ...item, executor, updatedAt: nowIso() });
}

export function addSubtask(parent: PlanItem, input: Omit<CreateItemInput, "planId" | "parentId">): PlanItem {
  if (parent.kind === "event" && input.kind && input.kind !== "task") {
    throw new DomainError("Only tasks can prepare an event");
  }
  return createItem({
    ...input,
    planId: parent.planId,
    parentId: parent.id,
    kind: input.kind ?? "task",
  });
}

export function reopenItem(item: PlanItem): PlanItem {
  return updateItem(item, { status: "pending", completedAt: undefined });
}

export function descendantIds(rootId: string, items: PlanItem[]): Set<string> {
  const byParent = new Map<string, string[]>();
  for (const item of items) {
    if (!item.parentId) continue;
    const list = byParent.get(item.parentId) ?? [];
    list.push(item.id);
    byParent.set(item.parentId, list);
  }
  const out = new Set<string>();
  const walk = (id: string) => {
    for (const childId of byParent.get(id) ?? []) {
      if (out.has(childId)) continue;
      out.add(childId);
      walk(childId);
    }
  };
  walk(rootId);
  return out;
}

export function setParent(item: PlanItem, parentId: string | undefined, items: PlanItem[]): PlanItem {
  if (!parentId) return updateItem(item, { parentId: undefined });
  if (parentId === item.id) throw new DomainError("An item cannot be its own parent");
  const parent = items.find((candidate) => candidate.id === parentId);
  if (!parent) throw new DomainError("Parent not found");
  if (parent.planId !== item.planId) throw new DomainError("Parent must be in the same plan");
  if (item.kind === "event" && parent.kind !== "objective") {
    throw new DomainError("An event can only belong to an objective");
  }
  if (parent.kind === "event" && item.kind !== "task") {
    throw new DomainError("Only tasks can prepare an event");
  }
  if (descendantIds(item.id, items).has(parentId)) {
    throw new DomainError("Cannot parent an item under its descendant");
  }
  return updateItem(item, { parentId });
}

export function setKind(item: PlanItem, kind: ItemKind, items: PlanItem[]): PlanItem {
  if (kind === "event" && items.some((candidate) => candidate.parentId === item.id && candidate.kind !== "task")) {
    throw new DomainError("An event can only have tasks as children");
  }
  if (kind === "event" && item.parentId) {
    const parent = items.find((candidate) => candidate.id === item.parentId);
    if (parent && parent.kind !== "objective") {
      throw new DomainError("An event can only belong to an objective");
    }
  }
  return updateItem(item, { kind });
}

export function excludeOccurrence(item: PlanItem, occurrenceStart: LocalDateTime): PlanItem {
  if (!item.recurrence) throw new DomainError("Item is not recurring");
  const exceptions = new Set(item.recurrenceExceptions ?? []);
  exceptions.add(occurrenceStart);
  return updateItem(item, { recurrenceExceptions: [...exceptions].sort() });
}

/** EXDATE the occurrence and return a standalone copy at that start. */
export function splitOccurrence(
  item: PlanItem,
  occurrenceStart: LocalDateTime
): { series: PlanItem; detached: PlanItem } {
  const series = excludeOccurrence(item, occurrenceStart);
  const end = occurrenceEnd(occurrenceStart, item);
  const detached = createItem({
    planId: item.planId,
    title: item.title,
    notes: item.notes,
    start: occurrenceStart,
    end,
    kind: item.kind,
    parentId: item.parentId,
    status: item.status,
    energy: item.energy,
    executor: item.executor,
    agentBrief: item.agentBrief,
    assigneeIds: item.assigneeIds,
    attendeeIds: item.attendeeIds,
    categoryId: item.categoryId,
    location: item.location,
  });
  return { series, detached };
}

export function shiftByDelta(value: LocalDateTime, from: LocalDateTime, to: LocalDateTime): LocalDateTime {
  const delta = parseLocal(to).getTime() - parseLocal(from).getTime();
  return formatLocal(new Date(parseLocal(value).getTime() + delta), isAllDay(value));
}

export function shiftSeries(item: PlanItem, from: LocalDateTime, to: LocalDateTime): PlanItem {
  return moveItem(
    item,
    shiftByDelta(item.start, from, to),
    item.end ? shiftByDelta(item.end, from, to) : undefined
  );
}
