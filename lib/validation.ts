import { z } from "zod";
import { FONT_IDS } from "@/lib/fonts";
import { ACCENT_IDS, DEFAULT_ACCENT } from "@/lib/themes";
import { migrateAppData, migrateV2ToV3 } from "@/lib/migrations";
import { isValidLocal } from "@/lib/time/local";
import type { AppData } from "@/types";

const energyLevelSchema = z.enum(["low", "medium", "high", "critical"]);
const itemStatusSchema = z.enum(["pending", "in-progress", "completed", "cancelled", "blocked"]);
const taskStatusSchema = itemStatusSchema;
const prioritySchema = z.enum(["low", "medium", "high", "urgent"]);
const timeScaleSchema = z.enum(["year", "month", "week", "day", "hour"]);
const itemKindSchema = z.enum(["task", "event", "objective"]);
const executorSchema = z.enum(["human", "ai"]);

const localDateSchema = z
  .string()
  .refine((value) => isValidLocal(value) && !value.includes("T"), "Expected YYYY-MM-DD");
const localDateTimeSchema = z.string().refine(isValidLocal, "Expected a local date or datetime");

export const appSettingsSchema = z.object({
  theme: z.enum(["light", "dark", "auto"]),
  accent: z.enum(ACCENT_IDS).default(DEFAULT_ACCENT),
  font: z.enum(FONT_IDS).default("ubuntu"),
  defaultView: z.enum(["timeline", "list"]),
  firstDayOfWeek: z.union([z.literal(0), z.literal(1)]),
  dateFormat: z.string(),
  showWeekNumbers: z.boolean(),
});

// --- Version 1: roadmaps → months → objectives -------------------------------

const objectiveSchemaV1 = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  duration: z.number(),
  energyLevel: energyLevelSchema,
  priority: prioritySchema,
  status: taskStatusSchema,
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

const monthBlockSchemaV1 = z.object({
  id: z.string().min(1),
  year: z.number(),
  month: z.number().min(1).max(12),
  colorTheme: z.string().optional(),
  objectives: z.array(objectiveSchemaV1),
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

export const roadmapSchemaV1 = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  startYear: z.number(),
  endYear: z.number(),
  months: z.record(z.string(), monthBlockSchemaV1),
  colorTheme: z.string().optional(),
  icon: z.string().optional(),
  category: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastAccessedAt: z.string(),
});

export const appDataSchemaV1 = z.object({
  version: z.literal(1),
  roadmaps: z.array(roadmapSchemaV1),
  settings: appSettingsSchema,
  activeRoadmapId: z.string().optional(),
  lastBackup: z.string().optional(),
  lastExport: z.string().optional(),
});

// --- Version 2: plans → tasks ---------------------------------------------------

export const taskSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  notes: z.string(),
  start: localDateTimeSchema,
  end: localDateTimeSchema,
  status: taskStatusSchema,
  energy: energyLevelSchema,
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const planSchemaV2 = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  start: localDateSchema,
  end: localDateSchema,
  tasks: z.array(taskSchema),
  scale: timeScaleSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastAccessedAt: z.string(),
});

/** @deprecated Use `planSchemaV2`. v2 plan with embedded tasks. */
export const planSchema = planSchemaV2;

export const appDataSchemaV2 = z.object({
  version: z.literal(2),
  plans: z.array(planSchemaV2),
  settings: appSettingsSchema,
  activePlanId: z.string().optional(),
  lastBackup: z.string().optional(),
  lastExport: z.string().optional(),
});

// --- Version 3: plans + items + people + categories ---------------------------

export const locationSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  url: z.string().optional(),
});

export const planItemSchema = z
  .object({
    id: z.string().min(1),
    planId: z.string().min(1),
    kind: itemKindSchema,
    title: z.string(),
    notes: z.string(),
    parentId: z.string().min(1).optional(),
    start: localDateTimeSchema,
    end: localDateTimeSchema.optional(),
    recurrence: z.string().min(1).optional(),
    recurrenceExceptions: z.array(localDateTimeSchema).optional(),
    status: itemStatusSchema,
    energy: energyLevelSchema,
    executor: executorSchema,
    agentBrief: z.string().optional(),
    assigneeIds: z.array(z.string()),
    attendeeIds: z.array(z.string()),
    categoryId: z.string().min(1).optional(),
    location: locationSchema.optional(),
    images: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          src: z.string().min(1),
        })
      )
      .optional(),
    externalId: z.string().min(1).optional(),
    draft: z.boolean().optional(),
    completedAt: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .superRefine((item, ctx) => {
    if (item.kind === "objective" && item.parentId) {
      ctx.addIssue({
        code: "custom",
        path: ["parentId"],
        message: "Objectives cannot have a parent",
      });
    }
    if (item.end !== undefined) {
      const start = item.start;
      const end = item.end;
      const startAllDay = !start.includes("T");
      const endAllDay = !end.includes("T");
      if (startAllDay === endAllDay && end < start) {
        ctx.addIssue({
          code: "custom",
          path: ["end"],
          message: "end must not be before start",
        });
      }
    }
  });

export const colorHexSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Expected a hex color");

export const personSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["human", "agent"]),
  email: z.email().optional(),
  color: colorHexSchema.optional(),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: colorHexSchema,
  icon: z.string().optional(),
});

export const calendarSourceSchema = z.object({
  provider: z.enum(["local", "google", "icloud", "caldav"]),
  access: z.enum(["readwrite", "readonly"]),
  account: z.string().optional(),
  externalId: z.string().optional(),
  lastSyncedAt: z.string().optional(),
});

export const planSchemaV3 = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  color: colorHexSchema.optional(),
  start: localDateSchema,
  end: localDateSchema,
  scale: timeScaleSchema.optional(),
  source: calendarSourceSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastAccessedAt: z.string(),
});

export const appDataSchemaV3 = z.object({
  version: z.literal(3),
  plans: z.array(planSchemaV3),
  items: z.array(planItemSchema),
  people: z.array(personSchema),
  categories: z.array(categorySchema),
  settings: appSettingsSchema,
  activePlanId: z.string().optional(),
  lastBackup: z.string().optional(),
  lastExport: z.string().optional(),
});

export const appDataSchema = z.discriminatedUnion("version", [
  appDataSchemaV1,
  appDataSchemaV2,
  appDataSchemaV3,
]);

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

  if (parsed.data.version === 1) return migrateV2ToV3(migrateAppData(parsed.data));
  if (parsed.data.version === 2) return migrateV2ToV3(parsed.data);
  return parsed.data;
}
