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
      notes:
        "## Scope\n\nOne calendar per area of life, goals on top, tasks folded into their parent.\n\n- [x] Item page\n- [x] Calendar that reads at a glance\n- [ ] Lane timeline\n- [ ] Launch note\n\nDesign notes in [the Figma file](https://figma.com).",
      images: [
        {
          id: "img-planner-wireframe",
          name: "Week view wireframe",
          src: "data:image/svg+xml;utf8," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f4f4f5"/><g stroke="#d4d4d8"><path d="M60 40H400M60 80H400M60 120H400M60 160H400M60 200H400M60 240H400"/><path d="M110 20V300M160 20V300M210 20V300M260 20V300M310 20V300M360 20V300"/></g><rect x="112" y="84" width="46" height="60" rx="4" fill="#2563eb" fill-opacity=".25" stroke="#2563eb"/><rect x="212" y="124" width="46" height="36" rx="4" fill="#16a34a" fill-opacity=".25" stroke="#16a34a"/><rect x="312" y="44" width="46" height="90" rx="4" fill="#ea580c" fill-opacity=".25" stroke="#ea580c"/><path d="M60 150H400" stroke="#e11d48" stroke-width="2"/></svg>'
            ),
        },
      ],
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
    item("event-offsite", {
      kind: "event",
      parentId: "obj-product",
      title: "Team offsite in Lisbon",
      notes:
        "### Agenda\n\n- Thursday: arrival, dinner by the river\n- Friday: roadmap workshop, then demos\n- Saturday: free morning, flight at 16:10\n\n**Bring** the projector adapter. [Hotel](https://maps.google.com)",
      start: local(year, 9, 10),
      end: local(year, 9, 12),
      energy: "medium",
      categoryId: "cat-career",
      assigneeIds: olivier,
      attendeeIds: [DEFAULT_USER_ID, GUEST_ID],
      location: { name: "Lisbon", address: "LX Factory, R. Rodrigues de Faria 103" },
    }),
    item("task-offsite-slides", {
      parentId: "event-offsite",
      title: "Prepare the roadmap slides",
      notes: "Ten slides, one per quarter. Reuse the launch note.",
      start: local(year, 9, 8),
      energy: "high",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("task-offsite-book", {
      parentId: "event-offsite",
      title: "Book the train to the airport",
      start: local(year, 9, 9),
      status: "completed",
      energy: "low",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("event-weekly-review", {
      kind: "event",
      parentId: "obj-product",
      title: "Weekly review",
      notes: "What shipped, what slipped, what is next.",
      start: local(year, 9, 4, "17:00"),
      end: local(year, 9, 4, "17:45"),
      recurrence: `FREQ=WEEKLY;BYDAY=FR;UNTIL=${year}1218`,
      energy: "medium",
      categoryId: "cat-career",
      assigneeIds: olivier,
    }),
    item("event-coffee", {
      kind: "event",
      title: "Coffee with Sam",
      start: local(year, 9, 8, "08:30"),
      end: local(year, 9, 8, "09:00"),
      energy: "low",
      categoryId: "cat-family",
      assigneeIds: olivier,
      location: { name: "Ten Belles" },
    }),
    item("task-vat", {
      title: "File the quarterly VAT return",
      notes: "Portal closes at midnight. Have the invoices folder ready.",
      start: local(year, 9, 25),
      energy: "medium",
      categoryId: "cat-finance",
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
      recurrence: `FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=${year}1231`,
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
      notes: "Duo piano / double bass. Table booked under *Chemla*.\n\n[Venue](https://ducdeslombards.com)",
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
    item("task-book-notes", {
      parentId: "obj-learn",
      title: "Write notes on three chapters",
      notes: "One page each. Replication, partitioning, transactions.",
      start: local(year, 9, 1),
      end: local(year, 11, 15),
      energy: "medium",
      categoryId: "cat-learning",
      assigneeIds: olivier,
    }),
    item("event-book-club", {
      kind: "event",
      parentId: "obj-learn",
      title: "Book club",
      start: local(year, 9, 3, "19:00"),
      end: local(year, 9, 3, "21:00"),
      energy: "low",
      categoryId: "cat-learning",
      assigneeIds: olivier,
      location: { name: "Shakespeare and Company" },
    }),
    item("obj-ardeche", {
      kind: "objective",
      title: "A week in the Ardèche",
      notes: "Leave the laptop. The river does the rest.",
      start: local(year, 10, 1),
      end: local(year, 10, 31),
      status: "in-progress",
      energy: "medium",
      categoryId: "cat-family",
      assigneeIds: olivier,
    }),
    item("event-ardeche", {
      kind: "event",
      parentId: "obj-ardeche",
      title: "Ardèche trip",
      notes:
        "Leave Friday after lunch.\n\n- [Cottage](https://www.gites-de-france.com)\n- Swim in the river, no laptop.\n\n**Bring** cash for the baker.",
      start: local(year, 10, 17),
      end: local(year, 10, 24),
      energy: "low",
      categoryId: "cat-family",
      assigneeIds: olivier,
      attendeeIds: [DEFAULT_USER_ID, GUEST_ID],
      location: { name: "Vallon-Pont-d'Arc" },
      images: [
        {
          id: "img-ardeche",
          name: "River",
          src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&w=800&q=80",
        },
      ],
    }),
    item("task-cottage", {
      parentId: "event-ardeche",
      title: "Book the cottage",
      start: local(year, 10, 5),
      energy: "medium",
      categoryId: "cat-family",
      assigneeIds: olivier,
    }),
    item("task-car", {
      parentId: "event-ardeche",
      title: "Reserve the car",
      start: local(year, 10, 12),
      energy: "low",
      categoryId: "cat-family",
      assigneeIds: olivier,
    }),
    item("task-pack", {
      parentId: "event-ardeche",
      title: "Pack bags",
      start: local(year, 10, 16),
      energy: "low",
      categoryId: "cat-family",
      assigneeIds: olivier,
    }),
    // A project: bounded work with a deadline, tasks in every state of planning.
    item("proj-cabin", {
      kind: "project",
      parentId: "obj-summer",
      title: "Build the garden cabin",
      notes: "Before the first frost. Wood from the sawmill in Cellettes, tools borrowed from Paul.",
      due: local(year, 10, 15),
      status: "in-progress",
      energy: "high",
      categoryId: "cat-home",
      assigneeIds: olivier,
    }),
    item("task-cabin-wood", {
      parentId: "proj-cabin",
      title: "Buy the wood",
      notes: "Douglas fir, 45 mm. Ask for delivery on a Saturday.",
      due: local(year, 9, 12),
      energy: "medium",
      categoryId: "cat-home",
      assigneeIds: olivier,
    }),
    item("task-cabin-tools", {
      parentId: "proj-cabin",
      title: "Choose the tools",
      energy: "low",
      categoryId: "cat-home",
      assigneeIds: olivier,
    }),
    item("task-cabin-ground", {
      parentId: "proj-cabin",
      title: "Prepare the ground",
      start: local(year, 9, 13),
      end: local(year, 9, 14),
      energy: "high",
      categoryId: "cat-home",
      assigneeIds: olivier,
    }),
    item("task-cabin-measure", {
      parentId: "task-cabin-ground",
      title: "Measure and stake the plot",
      energy: "low",
      categoryId: "cat-home",
      assigneeIds: olivier,
    }),
    item("task-cabin-permit", {
      parentId: "proj-cabin",
      title: "Check the permit rules",
      status: "completed",
      energy: "low",
      categoryId: "cat-home",
      assigneeIds: olivier,
    }),
    // Captured, not sorted yet: the inbox.
    item("task-inbox-plumber", {
      title: "Call the plumber about the kitchen tap",
      energy: "low",
      assigneeIds: olivier,
    }),
    item("task-inbox-article", {
      title: "Read the article Sam sent on habit stacking",
      energy: "low",
      assigneeIds: olivier,
    }),
    item("task-inbox-gift", {
      title: "Gift idea for Maya's birthday",
      energy: "low",
      assigneeIds: olivier,
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
