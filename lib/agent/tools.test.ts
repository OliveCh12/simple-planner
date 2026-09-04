import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addSubtaskTool,
  aiQueueFilter,
  completeItemTool,
  createItemTool,
  getItem,
  listItems,
  listPlans,
  searchItems,
  updateItemTool,
} from "@/lib/agent/tools";
import { MemoryRepository } from "@/lib/repository/memory";
import { parseAppData } from "@/lib/validation";

const fixturePath = path.resolve(__dirname, "fixture.json");

describe("agent tools", () => {
  let repo: MemoryRepository;

  beforeEach(async () => {
    repo = new MemoryRepository();
    await repo.importAll(parseAppData(readFileSync(fixturePath, "utf8")));
  });

  it("lists plans from a v3 backup", async () => {
    const plans = await listPlans(repo);
    expect(plans).toEqual([expect.objectContaining({ id: "plan-1", title: "Career" })]);
  });

  it("filters the AI queue and searches by text", async () => {
    const queue = await listItems(repo, aiQueueFilter("plan-1"));
    expect(queue.map((item) => item.id)).toEqual(["task-ai"]);

    const blocked = await listItems(repo, { planId: "plan-1", executor: "ai", status: "completed" });
    expect(blocked).toEqual([]);

    const hits = await searchItems(repo, { query: "launch", planId: "plan-1" });
    expect(hits.map((item) => item.id)).toEqual(["task-ai"]);
  });

  it("creates, completes and nests items through the domain", async () => {
    const created = await createItemTool(repo, {
      planId: "plan-1",
      title: "Write outline",
      start: "2026-09-10",
      executor: "ai",
    });
    expect(created.executor).toBe("ai");

    const completed = await completeItemTool(repo, created.id);
    expect(completed?.status).toBe("completed");

    const child = await addSubtaskTool(repo, "task-human", { title: "Warm-up", start: "2026-09-01" });
    expect(child?.parentId).toBe("task-human");

    const renamed = await updateItemTool(repo, "task-human", { title: "Ship it" });
    expect(renamed?.title).toBe("Ship it");

    const document = await getItem(repo, "task-ai");
    expect(document?.$schema).toBe("/schema/planner.schema.json");
    expect(document?.items[0]?.title).toBe("Draft the launch note");
  });
});
