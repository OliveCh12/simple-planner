import { addMonths, getDaysInMonth, setDate, startOfMonth } from "date-fns";
import { createCategory } from "@/lib/domain/categories";
import { createItem, type CreateItemInput } from "@/lib/domain/items";
import { createPerson } from "@/lib/domain/people";
import { createTask } from "@/lib/plan";
import { formatLocalDate, parseLocal } from "@/lib/time/local";
import type { EnergyLevel, PlanItem, Task, TaskStatus } from "@/types";

/** `[monthOffset, dayOfMonth]` relative to the first month of the plan. */
type Offset = [month: number, day: number];

interface SampleTask {
  title: string;
  notes: string;
  start: Offset;
  end: Offset;
  status?: TaskStatus;
  energy?: EnergyLevel;
}

export const samplePlan = {
  title: "Dev career plan",
  description: "A twelve-month sample plan to get started.",
  months: 12,
  tasks: [
    {
      title: "Set up development environment",
      notes: "VS Code, Node.js and the essential tools.",
      start: [0, 1],
      end: [0, 7],
      status: "completed",
      energy: "low",
    },
    {
      title: "Complete React advanced course",
      notes: "Finish the advanced React course to strengthen frontend skills.",
      start: [0, 1],
      end: [0, 31],
    },
    {
      title: "Build personal portfolio website",
      notes: "A professional portfolio showcasing projects and skills.",
      start: [0, 1],
      end: [1, 28],
      energy: "high",
    },
    {
      title: "Set up GitHub profile",
      notes: "Pinned repositories and a short bio.",
      start: [0, 1],
      end: [0, 15],
      energy: "low",
    },
    {
      title: "Learn Git advanced techniques",
      notes: "Branching strategies, rebasing and collaborative workflows.",
      start: [1, 1],
      end: [1, 15],
    },
    {
      title: "Build a simple REST API",
      notes: "Node.js and Express.",
      start: [1, 16],
      end: [1, 28],
      energy: "high",
    },
    {
      title: "Learn database fundamentals",
      notes: "SQL basics and relational concepts.",
      start: [1, 1],
      end: [1, 28],
    },
    {
      title: "Contribute to an open source project",
      notes: "Find a project on GitHub and land a first pull request.",
      start: [2, 1],
      end: [2, 31],
    },
    {
      title: "Attend a tech meetup",
      notes: "Network with local developers.",
      start: [2, 15],
      end: [2, 15],
      energy: "low",
    },
    {
      title: "Learn Docker basics",
      notes: "Images, containers and the basic commands.",
      start: [2, 1],
      end: [2, 15],
    },
    {
      title: "Master TypeScript fundamentals",
      notes: "Complete a TypeScript course and use it in personal projects.",
      start: [3, 1],
      end: [3, 30],
      energy: "high",
    },
    {
      title: "Build a full-stack application",
      notes: "Frontend and backend, deployed.",
      start: [3, 1],
      end: [4, 15],
      energy: "high",
    },
    {
      title: "Learn testing frameworks",
      notes: "Vitest, Testing Library and unit testing best practices.",
      start: [4, 1],
      end: [4, 31],
    },
    {
      title: "Prepare technical interview questions",
      notes: "Common coding questions and algorithms.",
      start: [5, 1],
      end: [5, 30],
      energy: "high",
    },
    {
      title: "Learn cybersecurity basics",
      notes: "Fundamental security concepts and practices.",
      start: [5, 1],
      end: [5, 15],
    },
    {
      title: "Start job applications",
      notes: "Target five applications a week.",
      start: [6, 1],
      end: [7, 31],
      energy: "high",
    },
    {
      title: "Learn agile methodologies",
      notes: "Scrum, Kanban and agile practices.",
      start: [6, 1],
      end: [6, 15],
    },
    {
      title: "Complete coding challenges",
      notes: "A hundred problems on LeetCode or HackerRank.",
      start: [7, 1],
      end: [7, 31],
      energy: "high",
    },
    {
      title: "Attend a tech conference",
      notes: "In person or virtual.",
      start: [8, 15],
      end: [8, 15],
    },
    {
      title: "Build a side project",
      notes: "Something useful, deployed live.",
      start: [8, 1],
      end: [8, 30],
      energy: "high",
    },
    {
      title: "Secure an internship",
      notes: "Apply for and land a software development internship.",
      start: [9, 1],
      end: [10, 30],
      energy: "high",
    },
    {
      title: "Learn Kubernetes",
      notes: "Container orchestration and deployment.",
      start: [9, 1],
      end: [9, 31],
    },
    {
      title: "Learn cloud technologies",
      notes: "AWS or Azure basics and deployment.",
      start: [10, 1],
      end: [10, 30],
    },
    {
      title: "Complete the internship",
      notes: "Finish with positive feedback.",
      start: [11, 1],
      end: [11, 31],
      energy: "high",
    },
    {
      title: "Reflect and plan next year",
      notes: "Review achievements and set goals for the next year.",
      start: [11, 20],
      end: [11, 31],
      energy: "low",
    },
  ] satisfies SampleTask[],
};

function offsetDate(base: Date, [month, day]: Offset): string {
  const target = addMonths(base, month);
  return formatLocalDate(setDate(target, Math.min(day, getDaysInMonth(target))));
}

export const DEFAULT_USER_ID = "person-olivier";

export const AGENT_ID = "person-agent";
export const GUEST_ID = "person-maya";

export const samplePeople = [
  createPerson({
    id: DEFAULT_USER_ID,
    name: "Olivier Chemla",
    kind: "human",
    email: "olivierchemla@gmail.com",
    color: "#2563eb",
  }),
  createPerson({
    id: AGENT_ID,
    name: "Planner agent",
    kind: "agent",
    color: "#7c3aed",
  }),
  createPerson({
    id: GUEST_ID,
    name: "Maya Chen",
    kind: "human",
    email: "maya@example.com",
    color: "#e11d48",
  }),
];

export const sampleCategories = [
  createCategory({ id: "cat-health", name: "Health", color: "#16a34a" }),
  createCategory({ id: "cat-career", name: "Career", color: "#2563eb" }),
  createCategory({ id: "cat-home", name: "Home", color: "#ea580c" }),
  createCategory({ id: "cat-family", name: "Family", color: "#e11d48" }),
  createCategory({ id: "cat-learning", name: "Learning", color: "#7c3aed" }),
  createCategory({ id: "cat-finance", name: "Finance", color: "#0d9488" }),
];

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

function local(year: number, month: number, day: number, time?: string): string {
  const date = `${year}-${pad(month)}-${pad(day)}`;
  return time ? `${date}T${time}` : date;
}

/** Full demo items for Olivier's plan: objectives, recurrences, an event, an AI task. */
export function olivierPlanItems(planId: string, year: number): PlanItem[] {
  const olivier = [DEFAULT_USER_ID];
  const item = (id: string, input: Omit<CreateItemInput, "id" | "planId">) =>
    createItem({ id, planId, ...input });

  return [
    item("obj-product", {
      kind: "objective",
      title: "Ship a product people love",
      notes: "The planner, in public, by year end.",
      start: local(year, 1, 1),
      end: local(year, 12, 31),
      status: "in-progress",
      energy: "high",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-planner-v3", {
      parentId: "obj-product",
      title: "Ship planner v3",
      notes: "Model, item page, then the lane timeline.",
      start: local(year, 9, 1),
      end: local(year, 9, 30),
      status: "in-progress",
      energy: "high",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-item-page", {
      parentId: "task-planner-v3",
      title: "Item page",
      notes: "Dedicated editor, tree, properties.",
      start: local(year, 9, 1),
      end: local(year, 9, 12),
      status: "completed",
      energy: "medium",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-lane", {
      parentId: "task-planner-v3",
      title: "Lane timeline",
      notes: "One bar per item, no repeats.",
      start: local(year, 9, 15),
      end: local(year, 9, 30),
      energy: "high",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-calendar-pass", {
      parentId: "task-planner-v3",
      title: "Calendar that reads at a glance",
      notes: "Hierarchy, details beside the grid, stronger week chips.",
      start: local(year, 9, 3),
      end: local(year, 9, 8),
      status: "in-progress",
      energy: "high",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-week-fills", {
      parentId: "task-calendar-pass",
      title: "Stronger week chips",
      start: local(year, 9, 4),
      end: local(year, 9, 5),
      energy: "medium",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-sidebar", {
      parentId: "task-calendar-pass",
      title: "Details beside the grid",
      start: local(year, 9, 5),
      end: local(year, 9, 6),
      energy: "high",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-headers", {
      parentId: "task-calendar-pass",
      title: "Fluid chrome",
      start: local(year, 9, 5),
      energy: "low",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("event-standup", {
      kind: "event",
      title: "Stand-up",
      notes: "Fifteen minutes, cameras on.",
      start: local(year, 9, 1, "09:30"),
      end: local(year, 9, 1, "09:50"),
      recurrence: `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=${year}0930`,
      energy: "low",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("event-dentist", {
      kind: "event",
      title: "Dentist",
      start: local(year, 9, 2, "14:00"),
      end: local(year, 9, 2, "15:00"),
      energy: "low",
      categoryId: "cat-health",
      assigneeIds: olivier,
      location: { name: "Cabinet rue des Martyrs" },
    }),
    item("task-ai-launch", {
      parentId: "obj-product",
      title: "Draft the launch note",
      notes: "Short post: what changed and why it is free.",
      start: local(year, 9, 18),
      end: local(year, 9, 22),
      executor: "ai",
      energy: "low",
      categoryId: "cat-career",
      assigneeIds: [AGENT_ID],
      agentBrief:
        "Write a 200-word launch note in English. Audience: indie hackers. Mention local-first, no account, AI-readable JSON. Do not oversell.",
    }),
    item("obj-summer", {
      kind: "objective",
      title: "Stay in shape",
      notes: "Train through the year, then keep the habit.",
      start: local(year, 5, 1),
      end: local(year, 12, 31),
      status: "in-progress",
      energy: "high",
      categoryId: "cat-health",
      assigneeIds: olivier,
    }),
    item("task-gym", {
      parentId: "obj-summer",
      title: "Gym",
      notes: "Strength, 60 minutes.",
      start: local(year, 5, 4, "07:00"),
      end: local(year, 5, 4, "08:00"),
      recurrence: `FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=${year}1231`,
      energy: "high",
      categoryId: "cat-health",
      assigneeIds: olivier,
    }),
    item("task-shoes", {
      parentId: "task-gym",
      title: "Buy lifting shoes",
      notes: "Flat sole.",
      start: local(year, 5, 2),
      end: local(year, 5, 6),
      status: "completed",
      energy: "low",
      categoryId: "cat-health",
      assigneeIds: olivier,
    }),
    item("task-coach", {
      parentId: "task-gym",
      title: "Book a form check",
      start: local(year, 5, 10),
      end: local(year, 5, 20),
      energy: "medium",
      categoryId: "cat-health",
      assigneeIds: olivier,
    }),
    item("task-meals", {
      parentId: "obj-summer",
      title: "Meal prep",
      notes: "Cook on Sunday night.",
      start: local(year, 5, 3, "18:00"),
      end: local(year, 5, 3, "20:00"),
      recurrence: `FREQ=WEEKLY;BYDAY=SU;UNTIL=${year}1231`,
      energy: "medium",
      categoryId: "cat-health",
      assigneeIds: olivier,
    }),
    item("event-jazz", {
      kind: "event",
      title: "Jazz night",
      notes: "Duo piano / double bass.",
      start: local(year, 9, 20, "20:00"),
      end: local(year, 9, 20, "23:00"),
      energy: "low",
      categoryId: "cat-home",
      assigneeIds: olivier,
      attendeeIds: [DEFAULT_USER_ID, GUEST_ID],
      location: {
        name: "Duc des Lombards",
        address: "42 rue des Lombards, 75001 Paris",
        url: "https://ducdeslombards.com",
      },
    }),
    item("task-visa", {
      title: "Visa appointment",
      notes: "Bring the folder. Milestone.",
      start: local(year, 10, 3, "09:30"),
      energy: "medium",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-clean", {
      title: "Deep-clean the apartment",
      start: local(year, 9, 6),
      end: local(year, 9, 7),
      energy: "medium",
      categoryId: "cat-home",
      assigneeIds: olivier,
    }),
    item("event-family-lunch", {
      kind: "event",
      title: "Lunch with Maya",
      notes: "Catch up before she flies out.",
      start: local(year, 9, 5, "13:00"),
      end: local(year, 9, 5, "15:00"),
      energy: "low",
      categoryId: "cat-family",
      assigneeIds: olivier,
      attendeeIds: [DEFAULT_USER_ID, GUEST_ID],
      location: { name: "Chez Janou" },
    }),
    item("task-call-parents", {
      title: "Call home",
      start: local(year, 9, 7, "18:00"),
      end: local(year, 9, 7, "18:30"),
      energy: "low",
      categoryId: "cat-family",
      assigneeIds: olivier,
    }),
    item("task-budget", {
      title: "Review September budget",
      notes: "Exports first, then the spreadsheet.",
      start: local(year, 9, 4),
      end: local(year, 9, 5),
      energy: "medium",
      categoryId: "cat-finance",
      assigneeIds: olivier,
    }),
    item("task-bank-csv", {
      parentId: "task-budget",
      title: "Export bank CSV",
      start: local(year, 9, 4),
      status: "completed",
      energy: "low",
      categoryId: "cat-finance",
      assigneeIds: olivier,
    }),
    item("task-spreadsheet", {
      parentId: "task-budget",
      title: "Update the spreadsheet",
      start: local(year, 9, 5),
      energy: "medium",
      categoryId: "cat-finance",
      assigneeIds: olivier,
    }),
    item("obj-learn", {
      kind: "objective",
      title: "Read like an engineer",
      start: local(year, 1, 1),
      end: local(year, 12, 31),
      status: "in-progress",
      energy: "medium",
      categoryId: "cat-learning",
      assigneeIds: olivier,
    }),
    item("task-systems-book", {
      parentId: "obj-learn",
      title: "Finish Designing Data-Intensive Applications",
      start: local(year, 8, 1),
      end: local(year, 10, 31),
      energy: "high",
      categoryId: "cat-learning",
      assigneeIds: olivier,
    }),
    item("event-book-club", {
      kind: "event",
      title: "Book club",
      start: local(year, 9, 3, "19:00"),
      end: local(year, 9, 3, "21:00"),
      energy: "low",
      categoryId: "cat-learning",
      assigneeIds: olivier,
      location: { name: "Shakespeare and Company" },
    }),
  ];
}

/** Materialises the sample tasks relative to `planStart`. */
export function sampleTasks(planStart: string): Task[] {
  const base = startOfMonth(parseLocal(planStart));
  return samplePlan.tasks.map((sample) =>
    createTask({
      title: sample.title,
      notes: sample.notes,
      start: offsetDate(base, sample.start),
      end: offsetDate(base, sample.end),
      status: sample.status,
      energy: sample.energy,
    })
  );
}
