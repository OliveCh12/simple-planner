"use client";

import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ENERGY_LEVELS, STATUSES, getEnergyOption, getStatusOption } from "@/lib/constants";
import { defaultTaskRange } from "@/lib/plan";
import { shortDateRange } from "@/lib/time/labels";
import { isAllDay, isValidLocal, parseLocal } from "@/lib/time/local";
import type { TimeColumn } from "@/lib/time/scale";
import { cn } from "@/lib/utils";
import type { EnergyLevel, TaskStatus } from "@/types";

function PropertyChip({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="secondary"
      size="xs"
      className={cn(
        "gap-1 px-1.5 font-medium text-foreground/80 hover:text-foreground data-[state=open]:bg-accent data-[state=open]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

interface StatusChipProps {
  value: TaskStatus;
  onChange: (status: TaskStatus) => void;
}

export function StatusChip({ value, onChange }: StatusChipProps) {
  const option = getStatusOption(value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <PropertyChip aria-label={`Status: ${option.label}`}>
          <option.icon className={option.className} />
          {option.label}
        </PropertyChip>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as TaskStatus)}
        >
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
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as EnergyLevel)}
        >
          {ENERGY_LEVELS.map((level) => (
            <DropdownMenuRadioItem key={level.value} value={level.value}>
              <level.icon className={level.className} />
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
  column: TimeColumn;
  onChange: (start: string, end: string) => void;
}

export function DateRangeChip({ start, end, column, onChange }: DateRangeChipProps) {
  const allDay = isAllDay(start);
  const wholeColumn = defaultTaskRange(column);
  const fillsColumn = start === wholeColumn.start && end === wholeColumn.end;
  const label = fillsColumn
    ? `Whole ${column.scale}`
    : shortDateRange(parseLocal(start), parseLocal(end));

  const update = (value: string, which: "start" | "end") => {
    if (!isValidLocal(value)) return;
    if (which === "start") onChange(value, end < value ? value : end);
    else onChange(value < start ? value : start, value);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <PropertyChip aria-label={`Dates: ${label}`}>
          <CalendarRange className="text-muted-foreground" />
          {label}
        </PropertyChip>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <PopoverHeader>
          <PopoverTitle>Dates</PopoverTitle>
          <PopoverDescription>When this task starts and ends.</PopoverDescription>
        </PopoverHeader>
        <ButtonGroup
          orientation="vertical"
          className="mt-3 w-full [&>*]:focus-within:relative [&>*]:focus-within:z-10"
        >
          <InputGroup className="h-8">
            <InputGroupAddon>
              <InputGroupText className="w-9 text-xs">From</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type={allDay ? "date" : "datetime-local"}
              value={start}
              aria-label="Start"
              onChange={(e) => update(e.target.value, "start")}
              className="h-8"
            />
          </InputGroup>
          <InputGroup className="h-8">
            <InputGroupAddon>
              <InputGroupText className="w-9 text-xs">To</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type={allDay ? "date" : "datetime-local"}
              value={end}
              aria-label="End"
              min={start}
              onChange={(e) => update(e.target.value, "end")}
              className="h-8"
            />
          </InputGroup>
        </ButtonGroup>
        <Button
          variant="ghost"
          size="xs"
          className="mt-2 w-full"
          disabled={fillsColumn}
          onClick={() => onChange(wholeColumn.start, wholeColumn.end)}
        >
          Whole {column.scale}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
