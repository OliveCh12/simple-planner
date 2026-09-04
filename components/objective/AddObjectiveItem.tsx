"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

interface AddObjectiveItemProps {
  onCreate: (title: string) => void;
}

export function AddObjectiveItem({ onCreate }: AddObjectiveItemProps) {
  const [title, setTitle] = useState("");

  const submit = () => {
    const value = title.trim();
    if (!value) return;
    onCreate(value);
    setTitle("");
  };

  return (
    <InputGroup className="h-8 border-transparent bg-transparent shadow-none transition-colors hover:bg-muted/60 has-[[data-slot=input-group-control]:focus-visible]:bg-background dark:bg-transparent">
      <InputGroupAddon>
        <Plus />
      </InputGroupAddon>
      <InputGroupInput
        value={title}
        placeholder="Add a goal"
        aria-label="New goal"
        className="h-8"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
          if (e.key === "Escape") setTitle("");
        }}
      />
      {title.trim() ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton variant="secondary" onClick={submit}>
            Add
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
