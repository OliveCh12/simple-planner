# Complete Data Schema and Project Structure

Let me walk you through the data architecture and file organization for this application, explaining the reasoning behind each decision so you understand not just what we're building, but why it's structured this way.

## Understanding the Data Schema

The data schema represents the mental model of how information flows through your application. Think of it like the blueprint of a building where each room has a specific purpose and connects to others in meaningful ways. For our roadmap application, we have three primary entities that form a natural hierarchy.

At the top level sits the **Roadmap** entity. This is the container for an entire planning timeline, like "Career Development 2024-2027" or "Personal Growth Journey." Each roadmap is completely independent, allowing users to maintain separate planning streams without mixing contexts. The roadmap knows its own temporal boundaries through start and end years, carries metadata like creation timestamps, and holds a reference to all the months it contains.

Within each roadmap, we have **MonthBlock** entities. These represent individual calendar months and serve as organizational units. A month block doesn't just store a date reference; it also carries visual preferences like color themes that help users mentally segment their timeline. The month blocks contain collections of objectives, and this is where the chronological structure begins to take shape.

The **Objective** entity is where users actually define their goals and tasks. Each objective is rich with information that helps with planning, execution, and reflection. Beyond the basic title and description, objectives track their lifecycle through status changes, carry metadata about effort required through energy levels, and specify their temporal footprint through duration and date ranges.

Here's how this translates into TypeScript types that provide compile-time safety and excellent developer experience:

```typescript
// types/index.ts

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
 * The root application state that gets persisted.
 * This is what gets saved to IndexedDB.
 */
export interface AppData {
  version: number; // For handling migrations in future versions
  roadmaps: Roadmap[];
  
  // User preferences
  settings: {
    theme: 'light' | 'dark' | 'auto';
    defaultView: 'timeline' | 'list';
    firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
    dateFormat: string;
    showWeekNumbers: boolean;
  };
  
  // Application state
  activeRoadmapId?: string; // Currently selected roadmap
  
  // Backup metadata
  lastBackup?: string;
  lastExport?: string;
}
```

Notice how we use a Record (essentially a JavaScript object used as a map) to store months instead of an array. This design decision is deliberate and important for performance. When you need to access October 2024, you can directly retrieve it with the key "2024-10" rather than filtering through an array. This becomes crucial when roadmaps span multiple years with potentially hundreds of months.

## The IndexedDB Schema

IndexedDB is a sophisticated client-side database that lives in the browser. Unlike localStorage which is limited to simple key-value pairs, IndexedDB can handle complex queries, indexing, and transactions. Think of it as having a real database in the browser, complete with the ability to query by different fields and handle relationships between entities.

We'll use Dexie.js, which provides a clean abstraction over IndexedDB's somewhat verbose native API. Here's how we define our database structure:

```typescript
// lib/db.ts

import Dexie, { Table } from 'dexie';
import { Roadmap, AppData } from '@/types';

/**
 * Our application database class.
 * Dexie gives us a clean, promise-based API over IndexedDB.
 */
export class RoadmapDB extends Dexie {
  // Define typed tables for compile-time safety
  roadmaps!: Table<Roadmap>;
  appSettings!: Table<AppData['settings'] & { id: string }>;

  constructor() {
    super('RoadmapDB');
    
    /**
     * Version 1 of our database schema.
     * The numbers after field names indicate indexed fields.
     * Indexing makes queries on those fields much faster.
     */
    this.version(1).stores({
      // Index roadmaps by id and category for fast filtering
      roadmaps: 'id, category, createdAt, lastAccessedAt',
      
      // Settings is a singleton, but we still need an id for Dexie
      appSettings: 'id'
    });
  }
}

// Create a singleton instance that we'll import throughout the app
export const db = new RoadmapDB();

/**
 * Helper functions for common database operations.
 * These encapsulate the complexity of IndexedDB transactions.
 */

/**
 * Retrieves all roadmaps, sorted by last access (most recent first).
 * This ensures users see their most relevant roadmaps at the top.
 */
export async function getAllRoadmaps(): Promise<Roadmap[]> {
  return db.roadmaps
    .orderBy('lastAccessedAt')
    .reverse()
    .toArray();
}

/**
 * Gets a specific roadmap by ID with error handling.
 */
export async function getRoadmap(id: string): Promise<Roadmap | undefined> {
  return db.roadmaps.get(id);
}

/**
 * Creates or updates a roadmap.
 * This function handles the common pattern of "upsert" operations.
 */
export async function saveRoadmap(roadmap: Roadmap): Promise<string> {
  roadmap.updatedAt = new Date().toISOString();
  return db.roadmaps.put(roadmap);
}

/**
 * Removes a roadmap permanently.
 * Consider adding a "soft delete" flag in production for safety.
 */
export async function deleteRoadmap(id: string): Promise<void> {
  await db.roadmaps.delete(id);
}

/**
 * Updates the last accessed timestamp.
 * Call this when a user opens a roadmap.
 */
export async function touchRoadmap(id: string): Promise<void> {
  await db.roadmaps.update(id, {
    lastAccessedAt: new Date().toISOString()
  });
}

/**
 * Exports all application data as a JSON blob.
 * This provides users with a complete backup they can save anywhere.
 */
export async function exportData(): Promise<string> {
  const roadmaps = await db.roadmaps.toArray();
  const settings = await db.appSettings.get('default');
  
  const exportData: AppData = {
    version: 1,
    roadmaps,
    settings: settings || getDefaultSettings(),
    lastExport: new Date().toISOString()
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Imports previously exported data, replacing all current data.
 * In production, you'd want to add validation and merge strategies.
 */
export async function importData(jsonString: string): Promise<void> {
  const data: AppData = JSON.parse(jsonString);
  
  // Clear existing data
  await db.roadmaps.clear();
  
  // Import roadmaps
  await db.roadmaps.bulkAdd(data.roadmaps);
  
  // Import settings
  await db.appSettings.put({ ...data.settings, id: 'default' });
}

function getDefaultSettings(): AppData['settings'] {
  return {
    theme: 'auto',
    defaultView: 'timeline',
    firstDayOfWeek: 1,
    dateFormat: 'MMM d, yyyy',
    showWeekNumbers: false
  };
}
```

## Project Structure and File Organization

The folder structure reflects both Next.js conventions and clean architecture principles. Each directory has a specific purpose, making the codebase intuitive to navigate even as it grows. Let me walk you through the complete structure with explanations for each part:

```
roadmap-app/
├── app/                          # Next.js App Router directory
│   ├── layout.tsx               # Root layout with providers and global styles
│   ├── page.tsx                 # Homepage - dashboard showing all roadmaps
│   ├── globals.css              # Global styles and Tailwind directives
│   │
│   ├── roadmap/                 # Roadmap-related pages
│   │   └── [id]/               # Dynamic route for viewing a specific roadmap
│   │       ├── page.tsx        # The main timeline view for a roadmap
│   │       └── layout.tsx      # Layout specific to roadmap pages
│   │
│   └── api/                     # Optional: API routes if adding server features later
│
├── components/                   # React components organized by feature
│   ├── ui/                      # Reusable UI primitives (buttons, inputs, modals)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   └── Dropdown.tsx
│   │
│   ├── roadmap/                 # Roadmap-specific components
│   │   ├── RoadmapDashboard.tsx      # Grid/list of all roadmaps
│   │   ├── RoadmapCard.tsx           # Preview card for a roadmap
│   │   ├── RoadmapForm.tsx           # Create/edit roadmap form
│   │   └── RoadmapHeader.tsx         # Header with roadmap title and actions
│   │
│   ├── timeline/                # Timeline view components
│   │   ├── TimelineContainer.tsx     # Main horizontal scroll container
│   │   ├── MonthBlock.tsx            # Individual month card
│   │   ├── MonthHeader.tsx           # Month title and metadata
│   │   ├── CurrentDateIndicator.tsx  # Visual marker for "today"
│   │   └── YearDivider.tsx           # Visual separator between years
│   │
│   ├── objective/               # Objective-related components
│   │   ├── ObjectiveCard.tsx         # Display card for an objective
│   │   ├── ObjectiveForm.tsx         # Create/edit objective form
│   │   ├── ObjectiveList.tsx         # List of objectives in a month
│   │   ├── PinnedObjective.tsx       # Special display for month-long objectives
│   │   ├── ObjectiveProgress.tsx     # Progress bar and completion tracking
│   │   └── ObjectiveDetail.tsx       # Expanded view with all details
│   │
│   └── layout/                  # Layout components
│       ├── Header.tsx           # App header with navigation
│       ├── Sidebar.tsx          # Optional sidebar for filters/navigation
│       └── Footer.tsx           # App footer
│
├── lib/                         # Core library code and utilities
│   ├── db.ts                    # IndexedDB setup and operations (shown above)
│   ├── date-utils.ts            # Date manipulation helpers using date-fns
│   ├── objective-utils.ts       # Business logic for objectives
│   ├── export-import.ts         # Data export/import functionality
│   └── constants.ts             # Application constants
│
├── hooks/                       # Custom React hooks
│   ├── useRoadmap.ts           # Hook for managing roadmap state
│   ├── useObjectives.ts        # Hook for objective CRUD operations
│   ├── useTimelineScroll.ts    # Hook for timeline scroll behavior
│   ├── useCurrentDate.ts       # Hook for tracking current date and highlighting
│   └── useLocalStorage.ts      # Hook for localStorage operations
│
├── store/                       # Zustand state management
│   ├── roadmapStore.ts         # Global state for roadmap data
│   ├── uiStore.ts              # Global state for UI preferences
│   └── index.ts                # Export all stores
│
├── types/                       # TypeScript type definitions
│   └── index.ts                # All interfaces shown earlier
│
├── utils/                       # Pure utility functions
│   ├── validation.ts           # Zod schemas for data validation
│   ├── formatters.ts           # String formatting helpers
│   └── calculations.ts         # Calculations for energy, duration, etc.
│
└── public/                      # Static assets
    └── icons/                   # Custom icons if not using a library
```

Let me explain the key architectural decisions reflected in this structure. The components directory is organized by feature rather than by type because this scales better as your application grows. When you need to work on objective-related functionality, everything you need is in one place rather than scattered across "containers," "presentational," and "forms" directories.

The lib directory contains pure functions and setup code that doesn't depend on React. This makes testing easier and keeps business logic separate from presentation logic. For example, the date-utils file might contain functions like these:

```typescript
// lib/date-utils.ts

import { 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  format,
  differenceInDays,
  isSameMonth,
  parseISO
} from 'date-fns';

/**
 * Generates a unique key for a month block.
 * Format: "YYYY-MM" for consistent indexing.
 */
export function getMonthKey(year: number, month: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

/**
 * Parses a month key back into year and month numbers.
 */
export function parseMonthKey(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

/**
 * Determines if a given date falls within an objective's timeframe.
 * This is used for highlighting the current objective.
 */
export function isDateInObjectiveRange(
  date: Date,
  objective: Objective
): boolean {
  const start = parseISO(objective.startDate);
  const end = parseISO(objective.endDate);
  
  return isWithinInterval(date, { start, end });
}

/**
 * Calculates if an objective should be pinned to the top.
 * An objective is pinned if it spans the entire month.
 */
export function shouldPinObjective(
  objective: Objective,
  monthYear: number,
  monthNumber: number
): boolean {
  const start = parseISO(objective.startDate);
  const end = parseISO(objective.endDate);
  const monthStart = startOfMonth(new Date(monthYear, monthNumber - 1));
  const monthEnd = endOfMonth(new Date(monthYear, monthNumber - 1));
  
  return (
    isSameMonth(start, monthStart) &&
    isSameMonth(end, monthEnd) &&
    differenceInDays(end, start) >= 28
  );
}

/**
 * Sorts objectives chronologically within a month,
 * with pinned objectives always at the top.
 */
export function sortObjectivesInMonth(objectives: Objective[]): Objective[] {
  return [...objectives].sort((a, b) => {
    // Pinned objectives always come first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then sort by start date
    const dateA = parseISO(a.startDate);
    const dateB = parseISO(b.startDate);
    
    return dateA.getTime() - dateB.getTime();
  });
}
```

The hooks directory contains custom hooks that encapsulate complex stateful logic. Here's what a typical hook might look like:

```typescript
// hooks/useRoadmap.ts

import { useEffect } from 'react';
import { useRoadmapStore } from '@/store/roadmapStore';
import { getRoadmap, saveRoadmap, touchRoadmap } from '@/lib/db';
import { Roadmap } from '@/types';

/**
 * Custom hook for managing a single roadmap's lifecycle.
 * Handles loading, updating, and persisting roadmap data.
 */
export function useRoadmap(roadmapId: string) {
  const { 
    currentRoadmap, 
    setCurrentRoadmap,
    updateRoadmap,
    isLoading,
    setIsLoading 
  } = useRoadmapStore();

  // Load roadmap on mount
  useEffect(() => {
    async function loadRoadmap() {
      setIsLoading(true);
      try {
        const roadmap = await getRoadmap(roadmapId);
        if (roadmap) {
          setCurrentRoadmap(roadmap);
          // Touch the roadmap to update last accessed time
          await touchRoadmap(roadmapId);
        }
      } catch (error) {
        console.error('Failed to load roadmap:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRoadmap();
  }, [roadmapId]);

  // Save roadmap to IndexedDB
  const save = async (updates: Partial<Roadmap>) => {
    if (!currentRoadmap) return;
    
    const updatedRoadmap = {
      ...currentRoadmap,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    await saveRoadmap(updatedRoadmap);
    updateRoadmap(updatedRoadmap);
  };

  return {
    roadmap: currentRoadmap,
    isLoading,
    save
  };
}
```

Finally, here's how the Zustand store brings everything together for global state management:

```typescript
// store/roadmapStore.ts

import { create } from 'zustand';
import { Roadmap, MonthBlock, Objective } from '@/types';

interface RoadmapStore {
  // Current state
  currentRoadmap: Roadmap | null;
  selectedMonthKey: string | null;
  isLoading: boolean;
  
  // Actions
  setCurrentRoadmap: (roadmap: Roadmap) => void;
  updateRoadmap: (roadmap: Roadmap) => void;
  setSelectedMonth: (monthKey: string) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Objective operations
  addObjective: (monthKey: string, objective: Objective) => void;
  updateObjective: (monthKey: string, objectiveId: string, updates: Partial<Objective>) => void;
  deleteObjective: (monthKey: string, objectiveId: string) => void;
}

export const useRoadmapStore = create<RoadmapStore>((set) => ({
  currentRoadmap: null,
  selectedMonthKey: null,
  isLoading: false,
  
  setCurrentRoadmap: (roadmap) => set({ currentRoadmap: roadmap }),
  
  updateRoadmap: (roadmap) => set({ currentRoadmap: roadmap }),
  
  setSelectedMonth: (monthKey) => set({ selectedMonthKey: monthKey }),
  
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  addObjective: (monthKey, objective) => set((state) => {
    if (!state.currentRoadmap) return state;
    
    const month = state.currentRoadmap.months[monthKey];
    if (!month) return state;
    
    return {
      currentRoadmap: {
        ...state.currentRoadmap,
        months: {
          ...state.currentRoadmap.months,
          [monthKey]: {
            ...month,
            objectives: [...month.objectives, objective],
            updatedAt: new Date().toISOString()
          }
        }
      }
    };
  }),
  
  updateObjective: (monthKey, objectiveId, updates) => set((state) => {
    if (!state.currentRoadmap) return state;
    
    const month = state.currentRoadmap.months[monthKey];
    if (!month) return state;
    
    return {
      currentRoadmap: {
        ...state.currentRoadmap,
        months: {
          ...state.currentRoadmap.months,
          [monthKey]: {
            ...month,
            objectives: month.objectives.map(obj =>
              obj.id === objectiveId
                ? { ...obj, ...updates, updatedAt: new Date().toISOString() }
                : obj
            ),
            updatedAt: new Date().toISOString()
          }
        }
      }
    };
  }),
  
  deleteObjective: (monthKey, objectiveId) => set((state) => {
    if (!state.currentRoadmap) return state;
    
    const month = state.currentRoadmap.months[monthKey];
    if (!month) return state;
    
    return {
      currentRoadmap: {
        ...state.currentRoadmap,
        months: {
          ...state.currentRoadmap.months,
          [monthKey]: {
            ...month,
            objectives: month.objectives.filter(obj => obj.id !== objectiveId),
            updatedAt: new Date().toISOString()
          }
        }
      }
    };
  })
}));
```

This architecture provides a clean separation of concerns where data flows predictably through your application. Components remain focused on presentation, hooks handle React-specific logic, the store manages global state, and the lib directory contains pure business logic that could theoretically run anywhere. This makes testing straightforward and keeps your codebase maintainable as it grows.

Would you like me to dive deeper into any specific part of this architecture, such as how the timeline scroll mechanics would work or how to implement the current date highlighting system?