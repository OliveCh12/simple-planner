"use client";

import { FieldError } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface PropertyRowProps {
  label: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}

/** Label column on the left, control on the right, rows aligned on one grid. */
export function PropertyRow({ label, htmlFor, children, error, className }: PropertyRowProps) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div
      role="group"
      data-invalid={error ? true : undefined}
      className={cn("grid min-h-8 grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-x-3 py-0.5", className)}
    >
      <Label htmlFor={htmlFor} className="text-xs leading-snug text-muted-foreground">
        {label}
      </Label>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center">{children}</div>
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </div>
  );
}
