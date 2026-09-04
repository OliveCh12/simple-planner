import { addMonths, getDaysInMonth, setDate, startOfMonth } from "date-fns";
import { createCategory } from "@/lib/domain/categories";
import { createPerson } from "@/lib/domain/people";
import { createTask } from "@/lib/plan";
import { formatLocalDate, parseLocal } from "@/lib/time/local";
import type { EnergyLevel, Task, TaskStatus } from "@/types";

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

export const samplePeople = [
  createPerson({ id: "person-you", name: "You", kind: "human", color: "#2563eb" }),
  createPerson({
    id: "person-agent",
    name: "Planner agent",
    kind: "agent",
    color: "#7c3aed",
  }),
];

export const sampleCategories = [
  createCategory({ id: "cat-health", name: "Health", color: "#16a34a" }),
  createCategory({ id: "cat-career", name: "Career", color: "#2563eb" }),
  createCategory({ id: "cat-home", name: "Home", color: "#ea580c" }),
];

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
