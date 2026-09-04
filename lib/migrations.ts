import type { z } from "zod";
import type { appDataSchemaV1, roadmapSchemaV1 } from "@/lib/validation";
import { createId } from "@/lib/plan";
import { isValidLocal } from "@/lib/time/local";
import { createISODate, getDaysInMonthForDate } from "@/lib/date-utils";
import type { AppData, Plan, Task } from "@/types";

export type LegacyAppData = z.infer<typeof appDataSchemaV1>;
export type LegacyRoadmap = z.infer<typeof roadmapSchemaV1>;
export type LegacyMonth = LegacyRoadmap["months"][string];
export type LegacyObjective = LegacyMonth["objectives"][number];

function legacyDate(value: string, fallback: string): string {
  const date = value.slice(0, 10);
  return isValidLocal(date) ? date : fallback;
}

function monthBounds(month: LegacyMonth): { start: string; end: string } {
  return {
    start: createISODate(month.year, month.month, 1),
    end: createISODate(month.year, month.month, getDaysInMonthForDate(month.year, month.month)),
  };
}

export function migrateObjectiveToTask(
  objective: LegacyObjective,
  bounds: { start: string; end: string },
  id = objective.id
): Task {
  const start = legacyDate(objective.startDate, bounds.start);
  const rawEnd = legacyDate(objective.endDate, bounds.end);
  const task: Task = {
    id,
    title: objective.title,
    notes: objective.notes ?? objective.description ?? "",
    start,
    end: rawEnd < start ? start : rawEnd,
    status: objective.status,
    energy: objective.energyLevel,
    createdAt: objective.createdAt,
    updatedAt: objective.updatedAt,
  };
  if (objective.completedAt) task.completedAt = objective.completedAt;
  return task;
}

export function migrateRoadmapToPlan(roadmap: LegacyRoadmap): Plan {
  const seen = new Set<string>();
  const tasks: Task[] = [];

  const months = Object.values(roadmap.months).sort(
    (a, b) => a.year - b.year || a.month - b.month
  );
  for (const month of months) {
    const bounds = monthBounds(month);
    for (const objective of month.objectives) {
      const id = seen.has(objective.id) ? createId() : objective.id;
      seen.add(id);
      tasks.push(migrateObjectiveToTask(objective, bounds, id));
    }
  }

  let start = createISODate(roadmap.startYear, 1, 1);
  let end = createISODate(Math.max(roadmap.startYear, roadmap.endYear), 12, 31);
  for (const task of tasks) {
    if (task.start < start) start = task.start;
    if (task.end > end) end = task.end;
  }

  const plan: Plan = {
    id: roadmap.id,
    title: roadmap.title,
    start,
    end,
    tasks,
    createdAt: roadmap.createdAt,
    updatedAt: roadmap.updatedAt,
    lastAccessedAt: roadmap.lastAccessedAt,
  };
  if (roadmap.description) plan.description = roadmap.description;
  return plan;
}

export function migrateAppData(data: LegacyAppData): AppData {
  const migrated: AppData = {
    version: 2,
    plans: data.roadmaps.map(migrateRoadmapToPlan),
    settings: data.settings,
  };
  if (data.activeRoadmapId) migrated.activePlanId = data.activeRoadmapId;
  if (data.lastBackup) migrated.lastBackup = data.lastBackup;
  if (data.lastExport) migrated.lastExport = data.lastExport;
  return migrated;
}
