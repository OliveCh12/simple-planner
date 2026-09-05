import { describe, expect, it } from "vitest";
import { createItem } from "@/lib/domain/items";
import type { ExternalEvent } from "@/lib/sync/adapter";
import { describeSync, fromExternalEvent, reconcile, toExternalEvent } from "@/lib/sync/mapping";

const remote: ExternalEvent = {
  id: "g-1",
  calendarId: "primary",
  title: "Dentist",
  start: "2026-09-02T14:00",
  end: "2026-09-02T15:00",
  location: "Rue des Lilas",
  etag: "v1",
};

describe("external event mapping", () => {
  it("imports a provider event as a synced local event", () => {
    const item = fromExternalEvent(remote, "plan");
    expect(item.kind).toBe("event");
    expect(item.externalId).toBe("g-1");
    expect(item.sync).toMatchObject({ state: "synced", etag: "v1" });
    expect(item.location).toEqual({ name: "Rue des Lilas" });
  });

  it("keeps planning links when the remote body changes", () => {
    const local = { ...fromExternalEvent(remote, "plan"), parentId: "project-1", linkedIds: ["task-9"], categoryId: "cat-health" };
    const next = fromExternalEvent({ ...remote, title: "Dentist (moved)", start: "2026-09-03T14:00", end: "2026-09-03T15:00", etag: "v2" }, "plan", local);
    expect(next.title).toBe("Dentist (moved)");
    expect(next.parentId).toBe("project-1");
    expect(next.linkedIds).toEqual(["task-9"]);
    expect(next.categoryId).toBe("cat-health");
    expect(next.sync?.etag).toBe("v2");
  });

  it("sends only the event body, never the tree", () => {
    const item = createItem({ planId: "plan", kind: "event", title: "Trip", start: "2026-10-01", end: "2026-10-03", parentId: "obj" });
    const out = toExternalEvent(item, "primary");
    expect(out).toEqual({ id: "", calendarId: "primary", title: "Trip", start: "2026-10-01", end: "2026-10-03" });
    expect(() => toExternalEvent(createItem({ planId: "plan", title: "Task" }), "primary")).toThrow();
  });
});

describe("reconcile", () => {
  const synced = fromExternalEvent(remote, "plan");

  it("creates, updates, pushes and flags conflicts", () => {
    const pendingLocal = { ...synced, id: "local-2", externalId: "g-2", title: "Edited here", sync: { state: "pending" as const, etag: "v1" } };
    const untouched = { ...synced, id: "local-3", externalId: "g-3" };
    const newLocal = createItem({ planId: "plan", kind: "event", title: "Made here", start: "2026-09-10T09:00" });
    const plan = reconcile(
      [synced, pendingLocal, untouched, newLocal],
      [
        { ...remote, id: "g-new", title: "New on provider" },
        { ...remote, id: "g-2", etag: "v2" },
        { ...remote, id: "g-3", title: "Renamed remotely", etag: "v2" },
        remote,
      ],
      [],
      "plan"
    );
    expect(plan.create.map((item) => item.title)).toEqual(["New on provider"]);
    expect(plan.conflict.map((item) => item.id)).toEqual(["local-2"]);
    expect(plan.update.map((item) => item.title)).toEqual(["Renamed remotely"]);
    expect(plan.push.map((item) => item.title)).toEqual(["Made here"]);
  });

  it("cancels a locally known event deleted on the provider instead of deleting planning", () => {
    const plan = reconcile([synced], [], ["g-1"], "plan");
    expect(plan.cancel).toHaveLength(1);
    expect(plan.cancel[0].status).toBe("cancelled");
    expect(plan.cancel[0].id).toBe(synced.id);
  });
});

describe("describeSync", () => {
  it("tells the user where an item lives and what a save does", () => {
    const event = createItem({ planId: "plan", kind: "event", title: "E", start: "2026-09-01" });
    const task = createItem({ planId: "plan", title: "T" });
    expect(describeSync(event, null).tone).toBe("local");
    expect(describeSync(event, { source: { provider: "google", access: "readonly" } }).tone).toBe("readonly");
    expect(describeSync(event, { source: { provider: "google", access: "readwrite" } }).tone).toBe("pending");
    expect(describeSync({ ...event, externalId: "g", sync: { state: "synced" } }, { source: { provider: "google", access: "readwrite" } }).tone).toBe("synced");
    expect(describeSync(task, { source: { provider: "icloud", access: "readonly" } }).tone).toBe("local");
  });
});
