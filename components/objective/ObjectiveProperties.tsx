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
import { cn } from "@/lib/utils";
import type { EnergyLevel, ObjectiveStatus } from "@/types";

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
  value: ObjectiveStatus;
  onChange: (status: ObjectiveStatus) => void;
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
          onValueChange={(next) => onChange(next as ObjectiveStatus)}
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

interface DaysChipProps {
  start: number;
  end: number;
  daysInMonth: number;
  onChange: (start: number, end: number) => void;
}

export function DaysChip({ start, end, daysInMonth, onChange }: DaysChipProps) {
  const wholeMonth = start === 1 && end === daysInMonth;
  const label = wholeMonth ? "All month" : start === end ? `Day ${start}` : `${start}–${end}`;

  const update = (raw: number, which: "start" | "end") => {
    if (!Number.isFinite(raw)) return;
    if (which === "start") onChange(raw, end);
    else onChange(start, raw);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <PropertyChip aria-label={`Days: ${label}`}>
          <CalendarRange className="text-muted-foreground" />
          {label}
        </PropertyChip>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-3">
        <PopoverHeader>
          <PopoverTitle>Days</PopoverTitle>
          <PopoverDescription>Which days of the month this takes.</PopoverDescription>
        </PopoverHeader>
        <ButtonGroup className="mt-3 w-full [&>*]:flex-1 [&>*]:focus-within:relative [&>*]:focus-within:z-10">
          <InputGroup className="h-8">
            <InputGroupAddon>
              <InputGroupText className="text-xs">From</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              inputMode="numeric"
              min={1}
              max={daysInMonth}
              value={start}
              aria-label="First day"
              onChange={(e) => update(e.target.valueAsNumber, "start")}
              className="h-8 text-center"
            />
          </InputGroup>
          <InputGroup className="h-8">
            <InputGroupAddon>
              <InputGroupText className="text-xs">To</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              inputMode="numeric"
              min={1}
              max={daysInMonth}
              value={end}
              aria-label="Last day"
              onChange={(e) => update(e.target.valueAsNumber, "end")}
              className="h-8 text-center"
            />
          </InputGroup>
        </ButtonGroup>
        <Button
          variant="ghost"
          size="xs"
          className="mt-2 w-full"
          disabled={wholeMonth}
          onClick={() => onChange(1, daysInMonth)}
        >
          Whole month
        </Button>
      </PopoverContent>
    </Popover>
  );
}
