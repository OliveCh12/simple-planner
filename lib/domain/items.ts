import { planItemSchema } from "@/lib/validation";
import { createId } from "@/lib/id";
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
  return parseItem({
    ...item,
    ...patch,
    id: item.id,
    planId: item.planId,
    createdAt: item.createdAt,
    updatedAt: nowIso(),
  });
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

export function setExecutor(item: PlanItem, executor: Executor): PlanItem {
  return parseItem({ ...item, executor, updatedAt: nowIso() });
}

export function addSubtask(parent: PlanItem, input: Omit<CreateItemInput, "planId" | "parentId">): PlanItem {
  if (parent.kind === "event") {
    throw new DomainError("Events cannot have children");
  }
  return createItem({
    ...input,
    planId: parent.planId,
    parentId: parent.id,
    kind: input.kind ?? "task",
  });
}
