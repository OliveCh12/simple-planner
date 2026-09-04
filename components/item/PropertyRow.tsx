"use client";

import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface PropertyRowProps {
  label: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}

export function PropertyRow({ label, htmlFor, children, error, className }: PropertyRowProps) {
  return (
    <Field
      orientation="responsive"
      data-invalid={error ? true : undefined}
      className={cn("gap-x-3 gap-y-1 py-1.5", className)}
    >
      <FieldLabel
        htmlFor={htmlFor}
        className="w-28 shrink-0 font-normal text-muted-foreground @md/field-group:pt-0"
      >
        {label}
      </FieldLabel>
      <FieldContent className="min-w-0 gap-1">
        <div className="min-w-0">{children}</div>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldContent>
    </Field>
  );
}
