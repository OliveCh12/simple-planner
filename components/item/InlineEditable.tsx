"use client";

import { useRef, useState } from "react";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface InlineEditableProps {
  value: string;
  onSave: (value: string) => boolean | void | Promise<boolean | void>;
  placeholder: string;
  "aria-label": string;
  multiline?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export function InlineEditable({
  value,
  onSave,
  placeholder,
  "aria-label": ariaLabel,
  multiline = false,
  required = false,
  className,
  id,
}: InlineEditableProps) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const skipBlur = useRef(false);
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const shown = focused ? draft : value;

  const commit = async () => {
    let next = draft;
    if (required) {
      next = draft.trim();
      if (!next) {
        setDraft(value);
        setFocused(false);
        setStatus("idle");
        return;
      }
    }
    if (next === value) {
      setFocused(false);
      setStatus("idle");
      return;
    }
    setStatus("saving");
    const ok = await onSave(next);
    if (ok === false) {
      setStatus("error");
      return;
    }
    setStatus("idle");
    setFocused(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      skipBlur.current = true;
      setDraft(value);
      setFocused(false);
      setStatus("idle");
      ref.current?.blur();
      return;
    }
    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      void commit().then(() => ref.current?.blur());
    }
  };

  const restClass =
    "border-transparent bg-transparent shadow-none hover:bg-muted/50 dark:bg-transparent";
  const focusClass =
    "focus-visible:border-ring focus-visible:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:focus-visible:bg-muted/50";

  return (
    <div className="relative min-w-0 flex-1">
      {multiline ? (
        <Textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          id={id}
          value={shown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={status === "error" || undefined}
          rows={2}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => {
            setDraft(value);
            setFocused(true);
          }}
          onBlur={() => {
            if (skipBlur.current) {
              skipBlur.current = false;
              return;
            }
            void commit();
          }}
          onKeyDown={onKeyDown}
          className={cn(
            "min-h-[2.75rem] resize-none px-2 py-1.5 md:text-sm",
            restClass,
            focusClass,
            className
          )}
        />
      ) : (
        <Input
          ref={ref as React.RefObject<HTMLInputElement>}
          id={id}
          value={shown}
          placeholder={placeholder}
          aria-label={ariaLabel}
          aria-invalid={status === "error" || undefined}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => {
            setDraft(value);
            setFocused(true);
          }}
          onBlur={() => {
            if (skipBlur.current) {
              skipBlur.current = false;
              return;
            }
            void commit();
          }}
          onKeyDown={onKeyDown}
          className={cn("h-8 px-2 md:text-sm", restClass, focusClass, className)}
        />
      )}
      {status === "saving" && (
        <Spinner className="absolute top-2 right-2 size-3.5 text-muted-foreground" aria-label="Saving" />
      )}
      {status === "error" && <FieldError>Could not save.</FieldError>}
    </div>
  );
}
