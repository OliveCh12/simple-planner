import type { EnergyLevel, MonthBlock, Objective, Priority } from "@/types";
import { createISODate, getDaysInMonthForDate } from "@/lib/date-utils";

export function createId(): string {
  return crypto.randomUUID();
}

export function createMonthBlock(
  monthKey: string,
  objectives: Objective[] = []
): MonthBlock {
  const [year, month] = monthKey.split("-").map(Number);
  const now = new Date().toISOString();

  return {
    id: createId(),
    year,
    month,
    objectives,
    createdAt: now,
    updatedAt: now,
  };
}

export function createObjective(input: {
  title: string;
  description?: string;
  monthKey: string;
  startDay?: number;
  endDay?: number;
  energyLevel?: EnergyLevel;
  priority?: Priority;
  category?: string;
  tags?: string[];
  notes?: string;
}): Objective {
  const [year, month] = input.monthKey.split("-").map(Number);
  const daysInMonth = getDaysInMonthForDate(year, month);
  const startDay = input.startDay ?? 1;
  const endDay = input.endDay ?? daysInMonth;
  const duration = endDay - startDay + 1;
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    startDate: createISODate(year, month, startDay),
    endDate: createISODate(year, month, endDay),
    duration,
    energyLevel: input.energyLevel ?? "medium",
    priority: input.priority ?? "medium",
    status: "pending",
    tags: input.tags ?? [],
    category: input.category,
    notes: input.notes,
    progress: 0,
    isPinned: duration >= 28,
    createdAt: now,
    updatedAt: now,
  };
}
