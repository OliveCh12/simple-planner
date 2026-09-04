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
    <InputGroup className="bg-background/60">
      <InputGroupAddon>
        <Plus className="text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        value={title}
        placeholder="Add a goal"
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
          <InputGroupButton onClick={submit}>Add</InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
