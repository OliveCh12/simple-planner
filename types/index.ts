import type { FontId } from '@/lib/fonts';
import type { AccentId } from '@/lib/themes';

/** Effort a task demands, to balance capacity at a glance. */
export type EnergyLevel = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'blocked';

/** Zoom level of the timeline: one column per unit of this scale. */
export type TimeScale = 'year' | 'month' | 'week' | 'day' | 'hour';

/**
 * Local civil time as a string: `YYYY-MM-DD` for all-day values,
 * `YYYY-MM-DDTHH:mm` for timed values. Never shifted by timezone.
 */
export type LocalDateTime = string;

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

export interface Plan {
  id: string;
  title: string;
  description?: string;
  /** Inclusive `YYYY-MM-DD`. */
  start: string;
  /** Inclusive `YYYY-MM-DD`. */
  end: string;
  tasks: Task[];
  /** Last scale used; absent means "pick from the plan duration". */
  scale?: TimeScale;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  accent: AccentId;
  font: FontId;
  defaultView: 'timeline' | 'list';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  dateFormat: string;
  showWeekNumbers: boolean;
}

/** Backup payload: what export writes and import reads. */
export interface AppData {
  version: 2;
  plans: Plan[];
  settings: AppSettings;
  activePlanId?: string;
  lastBackup?: string;
  lastExport?: string;
}
