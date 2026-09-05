"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { InlineEditable } from "@/components/item/InlineEditable";
import { Button } from "@/components/ui/button";
import { renderMarkdown } from "@/lib/markdown";

interface MarkdownNoteProps {
  value: string;
  onSave: (value: string) => void | Promise<boolean | void>;
}

export function MarkdownNote({ value, onSave }: MarkdownNoteProps) {
  const [editing, setEditing] = useState(false);

  if (!value && !editing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className="-ml-1.5 w-fit text-muted-foreground"
        onClick={() => setEditing(true)}
      >
        <Plus />
        Add notes
      </Button>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
        <InlineEditable
          multiline
          autoFocus
          value={value}
          placeholder="Notes, links, **markdown**…"
          aria-label="Notes"
          className="-mx-2"
          onSave={async (next) => {
            await onSave(next);
            setEditing(false);
          }}
        />
        <Button type="button" variant="ghost" size="xs" className="w-fit text-muted-foreground" onClick={() => setEditing(false)}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label="Edit notes"
      className="-mx-2 w-[calc(100%+1rem)] rounded-md px-2 py-1 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => setEditing(true)}
    >
      {renderMarkdown(value)}
    </button>
  );
}
