import type { FontId } from '@/lib/fonts';
import type { AccentId } from '@/lib/themes';

/** Effort an item demands, to balance capacity at a glance. */
export type EnergyLevel = 'low' | 'medium' | 'high' | 'critical';

export type ItemKind = 'task' | 'event' | 'objective';
export type Executor = 'human' | 'ai';
export type ItemStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'blocked';

/** @deprecated Use `ItemStatus`. Kept so the current timeline can keep compiling. */
export type TaskStatus = ItemStatus;

/** Zoom level of the timeline. */
export type TimeScale = 'year' | 'month' | 'week' | 'day' | 'hour';

/**
 * Local civil time as a string: `YYYY-MM-DD` for all-day values,
 * `YYYY-MM-DDTHH:mm` for timed values. Never shifted by timezone.
 */
export type LocalDateTime = string;

export interface Location {
  name: string;
  address?: string;
  url?: string;
}

/**
 * One timed entity in a plan. Differentiated by `kind`.
 * Named `PlanItem` to avoid colliding with the shadcn `Item` component.
 */
export interface PlanItem {
  id: string;
  planId: string;
  kind: ItemKind;
  title: string;
  notes: string;
  /** Tree: objective > task > subtask, any depth. Events cannot be parents. */
  parentId?: string;
  /** Local civil time. Required. */
  start: LocalDateTime;
  /** Absent = a point in time: a milestone, or an instant for events. */
  end?: LocalDateTime;
  /** RFC 5545 RRULE body, e.g. `FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20260831`. */
  recurrence?: string;
  /** Occurrence starts removed from a recurring series. */
  recurrenceExceptions?: LocalDateTime[];
  status: ItemStatus;
  energy: EnergyLevel;
  /** Who is expected to do it. Agents filter on this. */
  executor: Executor;
  /** Instructions and acceptance criteria written for an AI executor. */
  agentBrief?: string;
  assigneeIds: string[];
  attendeeIds: string[];
  categoryId?: string;
  location?: Location;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  kind: 'human' | 'agent';
  email?: string;
  color?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

/**
 * Compact view of a `PlanItem` used by the current timeline.
 * `end` is always set (`item.end ?? item.start`) so existing layout code keeps working.
 */
export interface Task {
  id: string;
  title: string;
  notes: string;
  /** All-day: inclusive date. Timed: start instant. */
  start: LocalDateTime;
  /** All-day: inclusive date. Timed: end instant. Same form as `start`. */
  end: LocalDateTime;
  status: TaskStatus;
  energy: EnergyLevel;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Plan row as stored in Dexie / export JSON. No embedded items. */
export interface Plan {
  id: string;
  title: string;
  description?: string;
  /** Inclusive `YYYY-MM-DD`. */
  start: string;
  /** Inclusive `YYYY-MM-DD`. */
  end: string;
  /** Last scale used; absent means "pick from the plan duration". */
  scale?: TimeScale;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

/**
 * Plan with task-shaped items reconstructed for the current UI.
 * Persistence never writes `tasks` onto the plan row.
 */
export type HydratedPlan = Plan & { tasks: Task[] };

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  accent: AccentId;
  font: FontId;
  defaultView: 'timeline' | 'list';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  dateFormat: string;
  showWeekNumbers: boolean;
}

/** Backup payload written by export and accepted by import. */
export interface AppData {
  version: 3;
  plans: Plan[];
  items: PlanItem[];
  people: Person[];
  categories: Category[];
  settings: AppSettings;
  activePlanId?: string;
  lastBackup?: string;
  lastExport?: string;
}

/** v2 backup shape, used as the migrateV2ToV3 input. */
export interface AppDataV2 {
  version: 2;
  plans: Array<Plan & { tasks: Task[] }>;
  settings: AppSettings;
  activePlanId?: string;
  lastBackup?: string;
  lastExport?: string;
}
