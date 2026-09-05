import { planItemSchema } from "@/lib/validation";
import { createId } from "@/lib/id";
import { formatLocal, isAllDay, parseLocal } from "@/lib/time/local";
import { occurrenceEnd } from "@/lib/time/recurrence";
import type { Executor, ItemImage, ItemKind, ItemStatus, LocalDateTime, PlanItem } from "@/types";

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
  /** Omit to leave a task, project or objective unscheduled. Events need one. */
  start?: LocalDateTime;
  end?: LocalDateTime;
  due?: string;
  kind?: ItemKind;
  notes?: string;
  parentId?: string;
  linkedIds?: string[];
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
  images?: ItemImage[];
  externalId?: string;
  draft?: boolean;
  id?: string;
};

export function isUnconfirmedDraft(item: PlanItem): boolean {
  return Boolean(item.draft) && !item.title.trim();
}

export type ScheduledItem = PlanItem & { start: LocalDateTime };

/** An item with a place in time. Everything else lives in Plan until it gets one. */
export function isScheduled(item: PlanItem): item is ScheduledItem {
  return item.start !== undefined;
}

/** Code-point order, so the `~` sentinel really sorts after every date. */
export function compareKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Sort key that keeps unscheduled items after dated ones, then by deadline, then by creation. */
export function compareByTime(a: PlanItem, b: PlanItem): number {
  const aKey = a.start ?? a.due ?? "~";
  const bKey = b.start ?? b.due ?? "~";
  return compareKeys(aKey, bKey) || compareKeys(a.createdAt, b.createdAt);
}

export function createItem(input: CreateItemInput): PlanItem {
  const now = nowIso();
  const item: PlanItem = {
    id: input.id ?? createId(),
    planId: input.planId,
    kind: input.kind ?? "task",
    title: input.title.trim(),
    notes: input.notes?.trim() ?? "",
    status: input.status ?? "pending",
    energy: input.energy ?? "medium",
    executor: input.executor ?? "human",
    assigneeIds: input.assigneeIds ?? [],
    attendeeIds: input.attendeeIds ?? [],
    createdAt: now,
    updatedAt: now,
  };
  if (input.start !== undefined) item.start = input.start;
  if (input.end !== undefined) item.end = input.end;
  if (input.due) item.due = input.due;
  if (input.parentId) item.parentId = input.parentId;
  if (input.linkedIds?.length) item.linkedIds = input.linkedIds;
  if (input.recurrence) item.recurrence = input.recurrence;
  if (input.recurrenceExceptions) item.recurrenceExceptions = input.recurrenceExceptions;
  if (input.agentBrief) item.agentBrief = input.agentBrief;
  if (input.categoryId) item.categoryId = input.categoryId;
  if (input.location) item.location = input.location;
  if (input.images?.length) item.images = input.images;
  if (input.externalId) item.externalId = input.externalId;
  if (input.draft) item.draft = true;
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
  if ("start" in patch && patch.start === undefined) delete next.start;
  if ("end" in patch && patch.end === undefined) delete next.end;
  if ("due" in patch && !patch.due) delete next.due;
  if ("parentId" in patch && !patch.parentId) delete next.parentId;
  if ("linkedIds" in patch && !patch.linkedIds?.length) delete next.linkedIds;
  if ("sync" in patch && !patch.sync) delete next.sync;
  if ("recurrence" in patch && !patch.recurrence) delete next.recurrence;
  if ("categoryId" in patch && !patch.categoryId) delete next.categoryId;
  if ("agentBrief" in patch && !patch.agentBrief) delete next.agentBrief;
  if ("location" in patch && !patch.location) delete next.location;
  if ("images" in patch && !patch.images?.length) delete next.images;
  if ("completedAt" in patch && !patch.completedAt) delete next.completedAt;
  if ("draft" in patch && !patch.draft) delete next.draft;
  return parseItem(next);
}

export function duplicateItem(item: PlanItem): PlanItem {
  return createItem({
    planId: item.planId,
    title: item.title.endsWith(" copy") ? item.title : `${item.title} copy`,
    start: item.start,
    end: item.end,
    due: item.due,
    kind: item.kind,
    notes: item.notes,
    parentId: item.parentId,
    linkedIds: item.linkedIds,
    recurrence: item.recurrence,
    status: item.status === "completed" ? "pending" : item.status,
    energy: item.energy,
    executor: item.executor,
    agentBrief: item.agentBrief,
    assigneeIds: item.assigneeIds,
    attendeeIds: item.attendeeIds,
    categoryId: item.categoryId,
    location: item.location,
    images: item.images,
  });
}

export function moveItem(item: PlanItem, start: LocalDateTime, end?: LocalDateTime): PlanItem {
  const next: PlanItem = { ...item, start, updatedAt: nowIso() };
  if (end === undefined) delete next.end;
  else next.end = end;
  return parseItem(next);
}

/** Take an item off the clock. It keeps its deadline, parent and links. */
export function unscheduleItem(item: PlanItem): PlanItem {
  if (item.kind === "event") throw new DomainError("An event always has a date");
  return updateItem(item, { start: undefined, end: undefined, recurrence: undefined });
}

export function setDue(item: PlanItem, due: string | undefined): PlanItem {
  if (item.kind === "event") throw new DomainError("Events have a date, not a deadline");
  return updateItem(item, { due });
}

/** Add or remove a contextual link. Links are symmetric in meaning but stored on one side. */
export function toggleLink(item: PlanItem, otherId: string, items: PlanItem[]): PlanItem {
  if (otherId === item.id) throw new DomainError("An item cannot link to itself");
  if (!items.some((candidate) => candidate.id === otherId)) throw new DomainError("Linked item not found");
  const current = item.linkedIds ?? [];
  const linkedIds = current.includes(otherId) ? current.filter((id) => id !== otherId) : [...current, otherId];
  return updateItem(item, { linkedIds });
}

/** Which kinds may sit directly under a parent of `parentKind`. */
export function allowedChildKinds(parentKind: ItemKind): ItemKind[] {
  switch (parentKind) {
    case "objective":
      return ["project", "task", "event"];
    case "project":
      return ["task", "event"];
    case "event":
      return ["task"];
    case "task":
      return ["task"];
  }
}

export function canParent(childKind: ItemKind, parentKind: ItemKind): boolean {
  return allowedChildKinds(parentKind).includes(childKind);
}

function parentRuleMessage(childKind: ItemKind, parentKind: ItemKind): string {
  if (childKind === "objective") return "Objectives cannot have a parent";
  if (childKind === "project") return "A project can only belong to an objective";
  if (childKind === "event") return "An event can only belong to an objective or a project";
  if (parentKind === "event") return "Only tasks can prepare an event";
  return "Only tasks can nest under a task";
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
  const kind = input.kind ?? "task";
  if (!canParent(kind, parent.kind)) throw new DomainError(parentRuleMessage(kind, parent.kind));
  return createItem({
    ...input,
    planId: parent.planId,
    parentId: parent.id,
    kind,
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
  if (parent.planId !== item.planId) throw new DomainError("Parent must be in the same calendar");
  if (descendantIds(item.id, items).has(parentId)) {
    throw new DomainError("Cannot parent an item under its descendant");
  }
  if (!canParent(item.kind, parent.kind)) throw new DomainError(parentRuleMessage(item.kind, parent.kind));
  return updateItem(item, { parentId });
}

export function setKind(item: PlanItem, kind: ItemKind, items: PlanItem[]): PlanItem {
  if (kind === item.kind) return item;
  const children = items.filter((candidate) => candidate.parentId === item.id);
  const offending = children.find((child) => !canParent(child.kind, kind));
  if (offending) throw new DomainError(`A ${kind} cannot contain a ${offending.kind}`);
  if (item.parentId) {
    const parent = items.find((candidate) => candidate.id === item.parentId);
    if (parent && !canParent(kind, parent.kind)) throw new DomainError(parentRuleMessage(kind, parent.kind));
  }
  const patch: Partial<Omit<PlanItem, "id" | "planId" | "createdAt">> = { kind };
  if (kind === "event") {
    patch.due = undefined;
    if (!item.start) patch.start = item.due ?? formatLocal(new Date(), true);
  }
  return updateItem(item, patch);
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
  if (!isScheduled(item)) throw new DomainError("Item is not scheduled");
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
  if (!isScheduled(item)) throw new DomainError("Item is not scheduled");
  return moveItem(
    item,
    shiftByDelta(item.start, from, to),
    item.end ? shiftByDelta(item.end, from, to) : undefined
  );
}
