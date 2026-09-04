import { describe, expect, it } from "vitest";
import {
  migrateAppData,
  migrateRoadmapToPlan,
  type LegacyObjective,
  type LegacyRoadmap,
} from "@/lib/migrations";
import { getDefaultSettings } from "@/lib/db";

const now = "2026-01-15T12:00:00.000Z";

function objective(
  id: string,
  startDate: string,
  endDate: string,
  extra: Partial<LegacyObjective> = {}
): LegacyObjective {
  return {
    id,
    title: id,
    description: `About ${id}`,
    startDate,
    endDate,
    duration: 1,
    energyLevel: "high",
    priority: "urgent",
    status: "pending",
    tags: ["x"],
    progress: 0,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
    ...extra,
  };
}

function month(year: number, monthNumber: number, objectives: LegacyObjective[]) {
  return {
    id: `${year}-${monthNumber}`,
    year,
    month: monthNumber,
    objectives,
    createdAt: now,
    updatedAt: now,
  };
}

function roadmap(months: LegacyRoadmap["months"], extra: Partial<LegacyRoadmap> = {}): LegacyRoadmap {
  return {
    id: "roadmap-1",
    title: "Career",
    startYear: 2027,
    endYear: 2027,
    months,
    createdAt: now,
    updatedAt: now,
    lastAccessedAt: now,
    ...extra,
  };
}

describe("migrateRoadmapToPlan", () => {
  it("flattens months into tasks and derives the plan range from the years", () => {
    const plan = migrateRoadmapToPlan(
      roadmap({
        "2027-03": month(2027, 3, [objective("a", "2027-03-05", "2027-03-10")]),
        "2027-01": month(2027, 1, [objective("b", "2027-01-01", "2027-01-31")]),
      })
    );

    expect(plan).toMatchObject({
      id: "roadmap-1",
      title: "Career",
      start: "2027-01-01",
      end: "2027-12-31",
    });
    expect(plan.tasks.map((task) => task.id)).toEqual(["b", "a"]);
    expect(plan.tasks[1]).toEqual({
      id: "a",
      title: "a",
      notes: "About a",
      start: "2027-03-05",
      end: "2027-03-10",
      status: "pending",
      energy: "high",
      createdAt: now,
      updatedAt: now,
    });
    expect(plan.scale).toBeUndefined();
    expect(plan.description).toBeUndefined();
  });

  it("keeps multi-month objectives as one task and extends the plan to fit", () => {
    const plan = migrateRoadmapToPlan(
      roadmap({
        "2027-11": month(2027, 11, [objective("long", "2027-11-01", "2028-03-15")]),
      })
    );
    expect(plan.tasks).toHaveLength(1);
    expect(plan.tasks[0]).toMatchObject({ start: "2027-11-01", end: "2028-03-15" });
    expect(plan.end).toBe("2028-03-15");
  });

  it("prefers notes over description and keeps completedAt", () => {
    const plan = migrateRoadmapToPlan(
      roadmap({
        "2027-01": month(2027, 1, [
          objective("done", "2027-01-02", "2027-01-03", {
            notes: "Real notes",
            status: "completed",
            completedAt: "2027-01-03T10:00:00.000Z",
          }),
        ]),
      })
    );
    expect(plan.tasks[0]).toMatchObject({
      notes: "Real notes",
      status: "completed",
      completedAt: "2027-01-03T10:00:00.000Z",
    });
  });

  it("falls back to the month bounds for invalid dates and fixes inverted ranges", () => {
    const plan = migrateRoadmapToPlan(
      roadmap({
        "2027-02": month(2027, 2, [
          objective("bad", "not-a-date", "2027-02-30"),
          objective("iso", "2027-02-10T00:00:00.000Z", "2027-02-12T00:00:00.000Z"),
          objective("inverted", "2027-02-20", "2027-02-10"),
        ]),
      })
    );
    expect(plan.tasks[0]).toMatchObject({ start: "2027-02-01", end: "2027-02-28" });
    expect(plan.tasks[1]).toMatchObject({ start: "2027-02-10", end: "2027-02-12" });
    expect(plan.tasks[2]).toMatchObject({ start: "2027-02-20", end: "2027-02-20" });
  });

  it("gives a fresh id to duplicated objective ids", () => {
    const plan = migrateRoadmapToPlan(
      roadmap({
        "2027-01": month(2027, 1, [objective("dup", "2027-01-01", "2027-01-02")]),
        "2027-02": month(2027, 2, [objective("dup", "2027-02-01", "2027-02-02")]),
      })
    );
    const ids = plan.tasks.map((task) => task.id);
    expect(ids[0]).toBe("dup");
    expect(ids[1]).not.toBe("dup");
    expect(new Set(ids).size).toBe(2);
  });

  it("keeps the description and tolerates inverted years", () => {
    const plan = migrateRoadmapToPlan(
      roadmap({}, { description: "Why", startYear: 2028, endYear: 2027 })
    );
    expect(plan.description).toBe("Why");
    expect(plan.start).toBe("2028-01-01");
    expect(plan.end).toBe("2028-12-31");
  });
});

describe("migrateAppData", () => {
  it("bumps the version and carries settings and metadata over", () => {
    const migrated = migrateAppData({
      version: 1,
      roadmaps: [roadmap({})],
      settings: getDefaultSettings(),
      activeRoadmapId: "roadmap-1",
      lastExport: now,
    });
    expect(migrated.version).toBe(2);
    expect(migrated.plans).toHaveLength(1);
    expect(migrated.activePlanId).toBe("roadmap-1");
    expect(migrated.lastExport).toBe(now);
    expect(migrated.settings.theme).toBe("auto");
  });
});
