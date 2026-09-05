"use client";

import { useState } from "react";
import { InlineEditable } from "@/components/item/InlineEditable";
import { Button } from "@/components/ui/button";
import { renderMarkdown } from "@/lib/markdown";

interface MarkdownNoteProps {
  value: string;
  onSave: (value: string) => void | Promise<boolean | void>;
}

export function MarkdownNote({ value, onSave }: MarkdownNoteProps) {
  const [editing, setEditing] = useState(!value);

  if (!value && !editing) {
    return (
      <Button type="button" variant="ghost" size="xs" className="text-muted-foreground" onClick={() => setEditing(true)}>
        Add a description
      </Button>
    );
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <InlineEditable
          multiline
          value={value}
          placeholder="Notes, links, **markdown**…"
          aria-label="Description"
          onSave={async (next) => {
            await onSave(next);
            setEditing(false);
          }}
        />
        {value ? (
          <Button type="button" variant="ghost" size="xs" onClick={() => setEditing(false)}>
            Preview
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <button type="button" className="w-full rounded-md text-left" onClick={() => setEditing(true)}>
      {renderMarkdown(value)}
    </button>
  );
}
