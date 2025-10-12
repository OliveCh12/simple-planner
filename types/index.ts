/**
 * Represents the energy or effort required for an objective.
 * This helps users understand the commitment level at a glance
 * and balance their capacity across multiple objectives.
 */
export type EnergyLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Tracks the lifecycle of an objective from conception through completion.
 * This progression helps users see momentum and identify stalled objectives.
 */
export type ObjectiveStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'blocked';

/**
 * Priority helps with ordering when multiple objectives compete for
 * attention within the same timeframe.
 */
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * The core planning unit. Each objective represents something
 * the user wants to accomplish within a specific timeframe.
 */
export interface Objective {
  id: string; // UUID for unique identification
  title: string;
  description: string;
  
  // Temporal properties that define when this objective lives
  startDate: string; // ISO date string for the start within the month
  endDate: string; // ISO date string for the end within the month
  duration: number; // Number of days this objective spans
  
  // Properties that help with planning and prioritization
  energyLevel: EnergyLevel;
  priority: Priority;
  status: ObjectiveStatus;
  
  // For organizing and filtering across the roadmap
  tags: string[];
  category?: string;
  
  // Tracking actual completion vs planned completion
  completedAt?: string; // ISO date string when actually completed
  
  // Rich metadata
  notes?: string;
  progress: number; // 0-100 percentage for month-long objectives
  
  // For breaking down complex objectives
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  
  // Determines if this objective is pinned to the top of the month
  // This happens automatically when duration equals the full month
  isPinned: boolean;
  
  // Audit trail
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a calendar month within a roadmap.
 * This is the organizational unit that contains objectives.
 */
export interface MonthBlock {
  id: string;
  year: number;
  month: number; // 1-12, matching JavaScript Date conventions
  
  // Visual customization for this month
  colorTheme?: string; // Hex color or theme name
  
  // Collection of objectives for this month
  objectives: Objective[];
  
  // Optional monthly reflection after the month has passed
  reflection?: {
    summary: string;
    lessons: string[];
    rating?: number; // 1-5 stars
    addedAt: string;
  };
  
  // Audit trail
  createdAt: string;
  updatedAt: string;
}

/**
 * The top-level container representing a complete planning timeline.
 * Users can have multiple roadmaps for different life areas.
 */
export interface Roadmap {
  id: string;
  title: string;
  description?: string;
  
  // Temporal boundaries of this roadmap
  startYear: number;
  endYear: number;
  
  // The actual data structure containing all months
  // Organized as a Map for O(1) lookup by year-month key
  months: Record<string, MonthBlock>; // Key format: "2024-10"
  
  // Metadata
  colorTheme?: string; // Overall theme for this roadmap
  icon?: string; // Emoji or icon identifier
  
  // For organizing multiple roadmaps
  category?: string; // "Personal", "Career", "Health", etc.
  
  // Audit trail
  createdAt: string;
  updatedAt: string;
  lastAccessedAt: string;
}

/**
 * User preferences and settings
 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  defaultView: 'timeline' | 'list';
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  dateFormat: string;
  showWeekNumbers: boolean;
}

/**
 * The root application state that gets persisted.
 * This is what gets saved to IndexedDB.
 */
export interface AppData {
  version: number; // For handling migrations in future versions
  roadmaps: Roadmap[];
  
  // User preferences
  settings: AppSettings;
  
  // Application state
  activeRoadmapId?: string; // Currently selected roadmap
  
  // Backup metadata
  lastBackup?: string;
  lastExport?: string;
}
