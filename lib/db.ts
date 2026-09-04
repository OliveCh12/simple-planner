import Dexie, { type EntityTable } from "dexie";
import type { AppData, AppSettings, Roadmap } from "@/types";
import { parseAppData } from "@/lib/validation";

export class RoadmapDB extends Dexie {
  roadmaps!: EntityTable<Roadmap, "id">;
  appSettings!: EntityTable<AppSettings & { id: string }, "id">;

  constructor() {
    super("RoadmapDB");

    this.version(1).stores({
      roadmaps: "id, category, createdAt, lastAccessedAt",
      appSettings: "id",
    });
  }
}

export const db = new RoadmapDB();

export function getDefaultSettings(): AppSettings {
  return {
    theme: "auto",
    font: "ubuntu",
    defaultView: "timeline",
    firstDayOfWeek: 1,
    dateFormat: "MMM d, yyyy",
    showWeekNumbers: false,
  };
}

export async function getAllRoadmaps(): Promise<Roadmap[]> {
  return db.roadmaps.orderBy("lastAccessedAt").reverse().toArray();
}

export async function getRoadmap(id: string): Promise<Roadmap | undefined> {
  return db.roadmaps.get(id);
}

export async function saveRoadmap(roadmap: Roadmap): Promise<string> {
  const toSave: Roadmap = {
    ...roadmap,
    months: { ...roadmap.months },
    updatedAt: new Date().toISOString(),
  };
  await db.roadmaps.put(toSave);
  return toSave.id;
}

export async function deleteRoadmap(id: string): Promise<void> {
  await db.roadmaps.delete(id);
}

export async function touchRoadmap(id: string): Promise<void> {
  await db.roadmaps.update(id, {
    lastAccessedAt: new Date().toISOString(),
  });
}

export async function exportData(settings: AppSettings = getDefaultSettings()): Promise<string> {
  const roadmaps = await db.roadmaps.toArray();

  const payload: AppData = {
    version: 1,
    roadmaps,
    settings,
    lastExport: new Date().toISOString(),
  };

  return JSON.stringify(payload, null, 2);
}

export async function importData(jsonString: string): Promise<AppSettings> {
  const data = parseAppData(jsonString);

  await db.transaction("rw", db.roadmaps, db.appSettings, async () => {
    await db.roadmaps.clear();
    await db.roadmaps.bulkAdd(data.roadmaps);
    await db.appSettings.put({ ...data.settings, id: "default" });
  });

  return data.settings;
}

export async function clearAllData(): Promise<void> {
  await db.transaction("rw", db.roadmaps, db.appSettings, async () => {
    await db.roadmaps.clear();
    await db.appSettings.clear();
  });
}

export async function downloadBackup(settings: AppSettings): Promise<void> {
  const json = await exportData(settings);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `timeline-planner-backup-${new Date().toISOString().split("T")[0]}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
