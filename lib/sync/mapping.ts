import { createItem, updateItem } from "@/lib/domain/items";
import type { ExternalEvent } from "@/lib/sync/adapter";
import { providerInfo } from "@/lib/sync/providers";
import type { Plan, PlanItem } from "@/types";

/**
 * Event body that travels to a provider. Planning fields never leave: the
 * provider gets a calendar event, not a task tree.
 */
export function toExternalEvent(item: PlanItem, calendarId: string): Omit<ExternalEvent, "etag"> {
  if (item.kind !== "event" || !item.start) throw new Error("Only scheduled events sync");
  const event: Omit<ExternalEvent, "etag"> = {
    id: item.externalId ?? "",
    calendarId,
    title: item.title,
    start: item.start,
  };
  if (item.notes) event.notes = item.notes;
  if (item.end) event.end = item.end;
  if (item.recurrence) event.recurrence = item.recurrence;
  if (item.location?.name) event.location = item.location.address ? `${item.location.name}, ${item.location.address}` : item.location.name;
  if (item.status === "cancelled") event.cancelled = true;
  return event;
}

/**
 * Local copy of a provider event. With an `existing` item, the remote body
 * wins on title, time, notes and place, and every planning link on the
 * local side survives untouched.
 */
export function fromExternalEvent(event: ExternalEvent, planId: string, existing?: PlanItem): PlanItem {
  const sync = { state: "synced" as const, etag: event.etag, syncedAt: new Date().toISOString() };
  const body = {
    title: event.title,
    notes: event.notes ?? "",
    start: event.start,
    end: event.end,
    recurrence: event.recurrence,
    location: event.location ? { name: event.location } : undefined,
    externalId: event.id,
  };
  if (existing) {
    return updateItem(existing, {
      ...body,
      end: event.end,
      status: event.cancelled ? "cancelled" : existing.status === "cancelled" ? "pending" : existing.status,
      location: event.location ? (existing.location?.name === event.location ? existing.location : { name: event.location }) : undefined,
      sync,
    });
  }
  const created = createItem({ ...body, planId, kind: "event", status: event.cancelled ? "cancelled" : "pending" });
  return { ...created, sync };
}

export interface SyncPlan {
  /** Remote events with no local copy yet. */
  create: PlanItem[];
  /** Local copies refreshed from the provider. */
  update: PlanItem[];
  /** Local edits to send. */
  push: PlanItem[];
  /** Both sides changed since the last sync; the user decides. */
  conflict: PlanItem[];
  /** Deleted remotely: cancelled here, prep work kept. */
  cancel: PlanItem[];
}

/**
 * Decide what a sync round should do, without doing it. Pure so it can be
 * tested against every combination before a single connector exists.
 */
export function reconcile(local: PlanItem[], remote: ExternalEvent[], deletedIds: string[], planId: string): SyncPlan {
  const plan: SyncPlan = { create: [], update: [], push: [], conflict: [], cancel: [] };
  const byExternal = new Map(local.filter((item) => item.externalId).map((item) => [item.externalId!, item]));
  const seen = new Set<string>();

  for (const event of remote) {
    seen.add(event.id);
    const existing = byExternal.get(event.id);
    if (!existing) {
      if (!event.cancelled) plan.create.push(fromExternalEvent(event, planId));
      continue;
    }
    const remoteChanged = event.etag !== existing.sync?.etag;
    const localPending = existing.sync?.state === "pending";
    if (localPending && remoteChanged) plan.conflict.push(updateItem(existing, { sync: { ...existing.sync, state: "conflict" } }));
    else if (localPending) plan.push.push(existing);
    else if (remoteChanged) plan.update.push(fromExternalEvent(event, planId, existing));
  }

  const gone = new Set(deletedIds);
  for (const item of local) {
    if (item.kind !== "event") continue;
    if (!item.externalId) {
      if (item.start && item.status !== "cancelled") plan.push.push(item);
      continue;
    }
    if (gone.has(item.externalId) && item.status !== "cancelled") {
      plan.cancel.push(updateItem(item, { status: "cancelled", sync: { state: "synced", syncedAt: new Date().toISOString() } }));
    } else if (!seen.has(item.externalId) && item.sync?.state === "pending") {
      plan.push.push(item);
    }
  }
  return plan;
}

export type SyncTone = "local" | "synced" | "pending" | "conflict" | "readonly";

/** One honest line for the editor: where an event lives and what saving does. */
export function describeSync(item: PlanItem, plan?: Pick<Plan, "source"> | null): { label: string; tone: SyncTone } {
  const source = plan?.source;
  const info = providerInfo(source?.provider);
  if (!source || info.id === "local") {
    return { label: item.kind === "event" ? "Local calendar" : "Kept in this app", tone: "local" };
  }
  if (item.kind !== "event") return { label: `${info.short} calendar · planning stays here`, tone: "local" };
  if (source.access === "readonly") return { label: `${info.short} · read-only`, tone: "readonly" };
  if (item.sync?.state === "conflict") return { label: `${info.short} · changed on both sides`, tone: "conflict" };
  if (item.sync?.state === "pending" || !item.externalId) return { label: `${info.short} · syncs on next sync`, tone: "pending" };
  return { label: `${info.short} · in sync`, tone: "synced" };
}
