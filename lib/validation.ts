import { z } from "zod";
import { FONT_IDS } from "@/lib/fonts";
import type { AppData } from "@/types";

const energyLevelSchema = z.enum(["low", "medium", "high", "critical"]);
const objectiveStatusSchema = z.enum([
  "pending",
  "in-progress",
  "completed",
  "cancelled",
  "blocked",
]);
const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);

const objectiveSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  duration: z.number(),
  energyLevel: energyLevelSchema,
  priority: prioritySchema,
  status: objectiveStatusSchema,
  tags: z.array(z.string()),
  category: z.string().optional(),
  completedAt: z.string().optional(),
  notes: z.string().optional(),
  progress: z.number(),
  subtasks: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
      })
    )
    .optional(),
  isPinned: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const monthBlockSchema = z.object({
  id: z.string().min(1),
  year: z.number(),
  month: z.number().min(1).max(12),
  colorTheme: z.string().optional(),
  objectives: z.array(objectiveSchema),
  reflection: z
    .object({
      summary: z.string(),
      lessons: z.array(z.string()),
      rating: z.number().optional(),
      addedAt: z.string(),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const roadmapSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  startYear: z.number(),
  endYear: z.number(),
  months: z.record(z.string(), monthBlockSchema),
  colorTheme: z.string().optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastAccessedAt: z.string(),
});

export const appSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]),
  font: z.enum(FONT_IDS).default("ubuntu"),
  defaultView: z.enum(["timeline", "list"]),
  firstDayOfWeek: z.union([z.literal(0), z.literal(1)]),
  dateFormat: z.string(),
  showWeekNumbers: z.boolean(),
});

export const appDataSchema = z.object({
  version: z.literal(1),
  roadmaps: z.array(roadmapSchema),
  settings: appSettingsSchema,
  activeRoadmapId: z.string().optional(),
  lastBackup: z.string().optional(),
  lastExport: z.string().optional(),
});

export function parseAppData(jsonString: string): AppData {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    throw new Error("Invalid backup file: not valid JSON");
  }

  const parsed = appDataSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Invalid backup file: unexpected data shape");
  }

  return parsed.data;
}
