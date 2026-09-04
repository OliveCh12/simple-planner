"use client";

import { PropertyChip } from "@/components/task/PropertyChip";
import { DateRangeField } from "@/components/item/DateRangeField";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ENERGY_LEVELS, KINDS, STATUSES, getEnergyOption, getKindOption, getStatusOption } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EnergyLevel, ItemKind, TaskStatus } from "@/types";

export { PropertyChip } from "@/components/task/PropertyChip";

const STATUS_SURFACE: Record<TaskStatus, string> = {
  pending: "",
  "in-progress": "bg-sky-500/10 hover:bg-sky-500/15 data-[state=open]:bg-sky-500/15",
  completed: "bg-emerald-500/10 hover:bg-emerald-500/15 data-[state=open]:bg-emerald-500/15",
  blocked: "bg-amber-500/10 hover:bg-amber-500/15 data-[state=open]:bg-amber-500/15",
  cancelled: "text-muted-foreground",
};

interface StatusChipProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}

export function StatusChip({ value, onChange }: StatusChipProps) {
  const option = getStatusOption(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PropertyChip
          tone="status"
          aria-label={`Status: ${option.label}`}
          className={STATUS_SURFACE[value]}
        >
          <option.icon className={option.className} />
          {option.label}
        </PropertyChip>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as TaskStatus)}>
          {STATUSES.map((status) => (
            <DropdownMenuRadioItem key={status.value} value={status.value}>
              <status.icon className={status.className} />
              {status.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface KindChipProps {
  value: ItemKind;
  onChange: (kind: ItemKind) => void;
}

export function KindChip({ value, onChange }: KindChipProps) {
  const option = getKindOption(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PropertyChip aria-label={`Kind: ${option.label}`}>
          <option.icon />
          {option.label}
        </PropertyChip>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Kind</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as ItemKind)}>
          {KINDS.map((kind) => (
            <DropdownMenuRadioItem key={kind.value} value={kind.value}>
              <kind.icon />
              {kind.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface EnergyChipProps {
  value: EnergyLevel;
  onChange: (level: EnergyLevel) => void;
}

export function EnergyChip({ value, onChange }: EnergyChipProps) {
  const option = getEnergyOption(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PropertyChip aria-label={`Energy: ${option.label}`}>
          <option.icon className={option.className} />
          {option.label}
        </PropertyChip>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Energy</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as EnergyLevel)}>
          {ENERGY_LEVELS.map((level) => (
            <DropdownMenuRadioItem key={level.value} value={level.value}>
              <level.icon className={cn(level.className)} />
              {level.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface DateRangeChipProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

export function DateRangeChip({ start, end, onChange }: DateRangeChipProps) {
  return (
    <DateRangeField
      start={start}
      end={end}
      onChange={(nextStart, nextEnd) => onChange(nextStart, nextEnd ?? nextStart)}
    />
  );
}
