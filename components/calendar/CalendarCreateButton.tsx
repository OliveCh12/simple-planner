"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { describeQuickAdd, parseQuickAdd, type QuickAddCategory, type QuickAddResult } from "@/lib/quickadd";
import type { Executor, LocalDateTime } from "@/types";

interface CalendarCreateButtonProps {
  when: string;
  defaultStart: LocalDateTime;
  defaultEnd?: LocalDateTime;
  categories?: QuickAddCategory[];
  defaultExecutor?: Executor;
  disabled?: boolean;
  disabledReason?: string;
  onCreate: (draft: QuickAddResult) => void;
}

export function CalendarCreateButton({
  when,
  defaultStart,
  defaultEnd,
  categories = [],
  defaultExecutor,
  disabled,
  disabledReason,
  onCreate,
}: CalendarCreateButtonProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const draft = useMemo(
    () => parseQuickAdd(value, { defaultStart, defaultEnd, categories, defaultExecutor }),
    [value, defaultStart, defaultEnd, categories, defaultExecutor]
  );
  const hint = draft ? describeQuickAdd(draft, categories) : "";

  const submit = () => {
    if (!draft) return;
    onCreate(draft);
    setValue("");
    setOpen(false);
  };

  return (
    <Popover
      open={open && !disabled}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (!next) setValue("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          aria-label="Create item"
          disabled={disabled}
          title={disabled ? disabledReason : undefined}
        >
          <Plus />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            autoFocus
            value={value}
            placeholder="Gym every weekday 7am #health @ai"
            aria-label="New item"
            onChange={(event) => setValue(event.target.value)}
          />
          <p className="mt-2 text-xs text-muted-foreground">{hint || when}</p>
          <Button type="submit" size="sm" className="mt-3 w-full" disabled={!draft}>
            Add
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
