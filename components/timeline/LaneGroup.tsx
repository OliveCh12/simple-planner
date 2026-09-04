"use client";

import { ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface LaneGroupProps {
  title: string;
  done: number;
  total: number;
  color?: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  children: React.ReactNode;
}

export function LaneGroup({
  title,
  done,
  total,
  color,
  collapsed,
  onCollapsedChange,
  children,
}: LaneGroupProps) {
  return (
    <Collapsible open={!collapsed} onOpenChange={(open) => onCollapsedChange(!open)}>
      <section className="relative">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="sticky left-0 z-30 flex h-8 items-center gap-2 bg-background/90 px-2 text-left text-sm backdrop-blur-sm"
          >
            <ChevronRight
              className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", !collapsed && "rotate-90")}
            />
            {color ? (
              <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            ) : null}
            <span className="min-w-0 flex-1 truncate font-medium">{title}</span>
            <span className="tabular-nums text-xs text-muted-foreground">
              {done}/{total}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}
