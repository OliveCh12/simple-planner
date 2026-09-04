"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { describeQuickAdd, parseQuickAdd, type QuickAddCategory, type QuickAddResult } from "@/lib/quickadd";
import type { Executor, LocalDateTime } from "@/types";

interface QuickAddProps {
  defaultStart: LocalDateTime;
  defaultEnd?: LocalDateTime;
  categories?: QuickAddCategory[];
  defaultExecutor?: Executor;
  placeholder?: string;
  onCreate: (draft: QuickAddResult) => void;
}

export function QuickAdd({
  defaultStart,
  defaultEnd,
  categories = [],
  defaultExecutor,
  placeholder = "Add a task",
  onCreate,
}: QuickAddProps) {
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
  };

  return (
    <div className="min-w-0">
      <InputGroup className="h-8 border-transparent bg-transparent shadow-none transition-colors hover:bg-muted/60 has-[[data-slot=input-group-control]:focus-visible]:bg-background dark:bg-transparent">
        <InputGroupAddon>
          <Plus />
        </InputGroupAddon>
        <InputGroupInput
          value={value}
          placeholder={placeholder}
          aria-label="New item"
          className="h-8"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
            if (event.key === "Escape") setValue("");
          }}
        />
        {value.trim() ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton variant="secondary" onClick={submit} disabled={!draft}>
              Add
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
      {hint ? <p className="truncate px-2 pt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
