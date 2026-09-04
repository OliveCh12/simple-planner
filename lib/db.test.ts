import { afterEach, describe, expect, it } from "vitest";
import {
  clearAllData,
  db,
  exportData,
  getDefaultSettings,
  getRoadmap,
  importData,
  saveRoadmap,
} from "@/lib/db";
import type { Roadmap } from "@/types";

function sampleRoadmap(): Roadmap {
  const now = "2026-01-15T12:00:00.000Z";
  return {
    id: "roadmap-1",
    title: "Career",
    startYear: 2026,
    endYear: 2026,
    months: {},
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
  };
}

afterEach(async () => {
  await db.roadmaps.clear();
  await db.appSettings.clear();
});

describe("saveRoadmap / getRoadmap", () => {
  it("persists a copy and does not mutate the input object", async () => {
    const roadmap = sampleRoadmap();
    const originalUpdatedAt = roadmap.updatedAt;

    await saveRoadmap(roadmap);

    expect(roadmap.updatedAt).toBe(originalUpdatedAt);

    const loaded = await getRoadmap(roadmap.id);
    expect(loaded?.title).toBe("Career");
    expect(loaded?.updatedAt).not.toBe(originalUpdatedAt);
  });
});

describe("importData", () => {
  it("rejects invalid JSON and does not wipe existing data", async () => {
    await saveRoadmap(sampleRoadmap());

    await expect(importData("{not-json")).rejects.toThrow(/not valid JSON/);
    await expect(getRoadmap("roadmap-1")).resolves.toMatchObject({ title: "Career" });
  });

  it("rejects an unexpected payload shape", async () => {
    await expect(importData(JSON.stringify({ version: 99, roadmaps: [] }))).rejects.toThrow(
      /unexpected data shape|Invalid backup/
    );
  });

  it("replaces roadmaps from a valid backup", async () => {
    await saveRoadmap(sampleRoadmap());

    const incoming: Roadmap = {
      ...sampleRoadmap(),
      id: "roadmap-2",
      title: "Health",
    };

    const settings = await importData(
      JSON.stringify({
        version: 1,
        roadmaps: [incoming],
        settings: getDefaultSettings(),
      })
    );

    expect(settings.theme).toBe("auto");
    expect(settings.font).toBe("ubuntu");
    await expect(getRoadmap("roadmap-1")).resolves.toBeUndefined();
    await expect(getRoadmap("roadmap-2")).resolves.toMatchObject({ title: "Health" });
  });
});

describe("importData font default", () => {
  it("defaults font when the backup omits it", async () => {
    const settings = await importData(
      JSON.stringify({
        version: 1,
        roadmaps: [],
        settings: {
          theme: "dark",
          defaultView: "timeline",
          firstDayOfWeek: 1,
          dateFormat: "MMM d, yyyy",
          showWeekNumbers: false,
        },
      })
    );

    expect(settings.font).toBe("ubuntu");
    expect(settings.theme).toBe("dark");
  });
});

describe("exportData", () => {
  it("serializes roadmaps and the provided settings", async () => {
    await saveRoadmap(sampleRoadmap());
    const json = await exportData({ ...getDefaultSettings(), theme: "dark" });
    const parsed = JSON.parse(json) as { settings: { theme: string }; roadmaps: Roadmap[] };

    expect(parsed.settings.theme).toBe("dark");
    expect(parsed.roadmaps).toHaveLength(1);
  });
});

describe("clearAllData", () => {
  it("empties roadmaps", async () => {
    await saveRoadmap(sampleRoadmap());
    await clearAllData();
    await expect(getRoadmap("roadmap-1")).resolves.toBeUndefined();
  });
});
