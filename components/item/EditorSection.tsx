"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EditorSectionProps {
  title: string;
  /** Small control aligned to the right of the eyebrow. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Editorial block of the details pane: quiet eyebrow, then the content. */
export function EditorSection({ title, action, children, className }: EditorSectionProps) {
  return (
    <section className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex h-5 items-center justify-between gap-2">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
