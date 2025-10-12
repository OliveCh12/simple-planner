import type { EnergyLevel, Priority, ObjectiveStatus } from '@/types';

/**
 * Application constants
 */

export const ENERGY_LEVELS: { value: EnergyLevel; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500' }
];

export const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' }
];

export const STATUSES: { value: ObjectiveStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-200 text-gray-700' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-blue-200 text-blue-700' },
  { value: 'completed', label: 'Completed', color: 'bg-green-200 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-200 text-red-700' },
  { value: 'blocked', label: 'Blocked', color: 'bg-yellow-200 text-yellow-700' }
];

export const DEFAULT_ROADMAP_CATEGORIES = [
  'Personal',
  'Career',
  'Health',
  'Finance',
  'Learning',
  'Projects',
  'Other'
];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Helper functions
 */

export function getEnergyLevelColor(level: EnergyLevel): string {
  return ENERGY_LEVELS.find(e => e.value === level)?.color || 'bg-gray-500';
}

export function getPriorityColor(priority: Priority): string {
  return PRIORITIES.find(p => p.value === priority)?.color || 'text-gray-500';
}

export function getStatusColor(status: ObjectiveStatus): string {
  return STATUSES.find(s => s.value === status)?.color || 'bg-gray-200';
}

export function getStatusLabel(status: ObjectiveStatus): string {
  return STATUSES.find(s => s.value === status)?.label || status;
}
