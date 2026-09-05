import {
  Calendar,
  Circle,
  CircleAlert,
  CircleCheck,
  CircleDotDashed,
  CircleX,
  Flag,
  FolderKanban,
  ListTodo,
  Signal,
  SignalHigh,
  SignalLow,
  SignalMedium,
  type LucideIcon,
} from "lucide-react";
import type { EnergyLevel, ItemKind, TaskStatus } from "@/types";

export interface StatusOption {
  value: TaskStatus;
  label: string;
  icon: LucideIcon;
  className: string;
}

export const STATUSES: StatusOption[] = [
  { value: "pending", label: "Pending", icon: Circle, className: "text-muted-foreground" },
  { value: "in-progress", label: "In progress", icon: CircleDotDashed, className: "text-sky-500" },
  { value: "completed", label: "Completed", icon: CircleCheck, className: "text-emerald-500" },
  { value: "blocked", label: "Blocked", icon: CircleAlert, className: "text-amber-500" },
  { value: "cancelled", label: "Cancelled", icon: CircleX, className: "text-muted-foreground/60" },
];

export interface EnergyOption {
  value: EnergyLevel;
  label: string;
  icon: LucideIcon;
  className: string;
}

export const ENERGY_LEVELS: EnergyOption[] = [
  { value: "low", label: "Low", icon: SignalLow, className: "text-muted-foreground" },
  { value: "medium", label: "Medium", icon: SignalMedium, className: "text-sky-500" },
  { value: "high", label: "High", icon: SignalHigh, className: "text-amber-500" },
  { value: "critical", label: "Critical", icon: Signal, className: "text-red-500" },
];

export function getStatusOption(status: TaskStatus): StatusOption {
  return STATUSES.find((option) => option.value === status) ?? STATUSES[0];
}

export function getEnergyOption(level: EnergyLevel): EnergyOption {
  return ENERGY_LEVELS.find((option) => option.value === level) ?? ENERGY_LEVELS[1];
}

export interface KindOption {
  value: ItemKind;
  label: string;
  icon: LucideIcon;
}

export const KINDS: KindOption[] = [
  { value: "task", label: "Task", icon: ListTodo },
  { value: "event", label: "Event", icon: Calendar },
  { value: "project", label: "Project", icon: FolderKanban },
  { value: "objective", label: "Objective", icon: Flag },
];

export function getKindOption(kind: ItemKind): KindOption {
  return KINDS.find((option) => option.value === kind) ?? KINDS[0];
}
