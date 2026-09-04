"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CalendarCreateButtonProps {
  when: string;
  onCreate: (title: string) => void;
}

export function CalendarCreateButton({ when, onCreate }: CalendarCreateButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const submit = () => {
    const next = title.trim();
    if (!next) return;
    onCreate(next);
    setTitle("");
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTitle("");
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" size="sm" aria-label="Create item">
          <Plus />
          <span className="hidden sm:inline">Create</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            autoFocus
            value={title}
            placeholder="Item title"
            aria-label="Item title"
            onChange={(event) => setTitle(event.target.value)}
          />
          <p className="mt-2 text-xs text-muted-foreground">{when}</p>
          <Button type="submit" size="sm" className="mt-3 w-full" disabled={!title.trim()}>
            Add
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
