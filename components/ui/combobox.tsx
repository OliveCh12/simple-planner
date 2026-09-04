"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
  keywords?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string | string[];
  onValueChange: (value: string | string[] | undefined) => void;
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  empty?: string;
  onCreate?: (label: string) => void;
  createLabel?: string;
  "aria-label"?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  multiple = false,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  empty = "No results.",
  onCreate,
  createLabel = "Create",
  "aria-label": ariaLabel,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : []);
  const selectedLabels = options.filter((option) => selected.has(option.value)).map((option) => option.label);
  const canCreate = Boolean(onCreate && query.trim() && !options.some((option) => option.label.toLowerCase() === query.trim().toLowerCase()));

  const toggle = (next: string) => {
    if (multiple) {
      const list = Array.isArray(value) ? [...value] : [];
      onValueChange(list.includes(next) ? list.filter((id) => id !== next) : [...list, next]);
      return;
    }
    onValueChange(next === value ? undefined : next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", selectedLabels.length === 0 && "text-muted-foreground")}>
            {selectedLabels.length > 0 ? selectedLabels.join(", ") : placeholder}
          </span>
          <ChevronsUpDown className="size-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.keywords ?? ""}`}
                  onSelect={() => toggle(option.value)}
                >
                  <Check className={cn("size-4", selected.has(option.value) ? "opacity-100" : "opacity-0")} />
                  {option.label}
                </CommandItem>
              ))}
              {canCreate && (
                <CommandItem value={`create ${query}`} onSelect={() => onCreate?.(query.trim())}>
                  <Plus className="size-4" />
                  {createLabel} “{query.trim()}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
