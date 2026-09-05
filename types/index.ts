import type { EnvironmentSettings } from '@/lib/environment/types';
import type { FontId } from '@/lib/fonts';
import type { AccentId } from '@/lib/themes';

/** Effort an item demands, to balance capacity at a glance. */
export type EnergyLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * What an item is. `event`: a dated moment. `task`: a concrete action.
 * `project`: a bounded initiative made of tasks. `objective`: a broader
 * direction that can group projects. Subtasks are tasks under a task.
 */
export type ItemKind = 'task' | 'event' | 'project' | 'objective';
export type CalendarProvider = 'local' | 'google' | 'icloud' | 'caldav';
export type CalendarAccess = 'readwrite' | 'readonly';

/** Where a calendar's events live. Planning (objectives, tasks) always stays in the app. */
export interface CalendarSource {
  provider: CalendarProvider;
  access: CalendarAccess;
  /** Email or account label, when connected. */
  account?: string;
  /** Provider calendar id (Google calendarId, CalDAV href). */
  externalId?: string;
  lastSyncedAt?: string;
}
/** Sync bookkeeping for an item that mirrors an external event. */
export interface ItemSync {
  /** `synced`: matches the provider. `pending`: local edit not pushed yet. `conflict`: both sides changed. */
  state: 'synced' | 'pending' | 'conflict';
  /** Provider version marker (Google etag, CalDAV etag). */
  etag?: string;
  syncedAt?: string;
}
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
  /** Present once the place was picked from geocoding; enables forecasts and sun times. */
  lat?: number;
  lon?: number;
  /** IANA zone of the place, e.g. `Europe/Lisbon`. */
  timezone?: string;
  country?: string;
}

export interface ItemImage {
  id: string;
  name: string;
  src: string;
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
  /**
   * Primary parent. objective > (project | task | event); project > (task | event);
   * event > prep task; task > subtask. Events never need one — a family lunch
   * does not belong to a goal.
   */
  parentId?: string;
  /**
   * Contextual links beyond the tree: a task that prepares an event while
   * belonging to a project, an event that matters to a second project.
   */
  linkedIds?: string[];
  /** Id on an external calendar. Present only for imported or synced events. */
  externalId?: string;
  /** Present when `externalId` is: how the local copy relates to the provider. */
  sync?: ItemSync;
  /**
   * In-progress create from an empty slot. Untitled drafts are not real events:
   * abandoning the editor deletes them. Confirmed once the title is set.
   */
  draft?: boolean;
  /**
   * Local civil time. Required for events. A task, project or objective
   * without `start` is unscheduled: it lives in Plan until placed in time.
   */
  start?: LocalDateTime;
  /** Absent = a point in time: a milestone, or an instant for events. */
  end?: LocalDateTime;
  /** Deadline (`YYYY-MM-DD`), independent of when the work is scheduled. Tasks and projects. */
  due?: string;
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
  /** Optional visual references stored as https or data URLs. */
  images?: ItemImage[];
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

/**
 * Plan row as stored in Dexie / export JSON. No embedded items.
 * Shown to the user as a "calendar": one area of life, business or project.
 */
export interface Plan {
  id: string;
  title: string;
  description?: string;
  /** Hex color used to tell calendars apart. */
  color?: string;
  /** Inclusive `YYYY-MM-DD`. */
  start: string;
  /** Inclusive `YYYY-MM-DD`. */
  end: string;
  /** Last scale used; absent means "pick from the plan duration". */
  scale?: TimeScale;
  /** Absent means a local calendar owned by this app. */
  source?: CalendarSource;
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
  /** Placement ghost under the mouse over empty time in week and day views. */
  hoverPreview: boolean;
  /** Weather, default place and daylight. Off unless the user opts in. */
  environment: EnvironmentSettings;
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
