import Dexie, { type EntityTable } from 'dexie';
import type { Roadmap, AppSettings, AppData } from '@/types';

/**
 * Our application database class.
 * Dexie gives us a clean, promise-based API over IndexedDB.
 */
export class RoadmapDB extends Dexie {
  // Define typed tables for compile-time safety
  roadmaps!: EntityTable<Roadmap, 'id'>;
  appSettings!: EntityTable<AppSettings & { id: string }, 'id'>;

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
 * Gets application settings, or returns defaults if not found.
 */
export async function getSettings(): Promise<AppSettings> {
  const settings = await db.appSettings.get('default');
  return settings || getDefaultSettings();
}

/**
 * Saves application settings.
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.appSettings.put({ ...settings, id: 'default' });
}

/**
 * Returns default application settings.
 */
export function getDefaultSettings(): AppSettings {
  return {
    theme: 'auto',
    defaultView: 'timeline',
    firstDayOfWeek: 1,
    dateFormat: 'MMM d, yyyy',
    showWeekNumbers: false
  };
}

/**
 * Exports all application data as a JSON blob.
 * This provides users with a complete backup they can save anywhere.
 */
export async function exportData(): Promise<string> {
  const roadmaps = await db.roadmaps.toArray();
  const settings = await getSettings();
  
  const exportData: AppData = {
    version: 1,
    roadmaps,
    settings,
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
  
  // Validate data version
  if (data.version !== 1) {
    throw new Error(`Unsupported data version: ${data.version}`);
  }
  
  // Clear existing data
  await db.roadmaps.clear();
  
  // Import roadmaps
  await db.roadmaps.bulkAdd(data.roadmaps);
  
  // Import settings
  await saveSettings(data.settings);
}

/**
 * Clears all data from the database.
 * Use with caution!
 */
export async function clearAllData(): Promise<void> {
  await db.roadmaps.clear();
  await db.appSettings.clear();
}
