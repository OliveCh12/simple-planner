"use client";

import { useLayoutEffect, useRef } from "react";
import { Check } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { useNestedChildren } from "@/hooks/useItemTree";
import { useSaveItem } from "@/hooks/useSaveItem";
import { applyStatus } from "@/lib/domain/items";
import { gsap, unfold } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { PlanItem } from "@/types";

interface SubtaskTreeProps {
  parentId: string;
  /** Month cells stay at a handful of one-line rows. */
  compact?: boolean;
  depth?: number;
}

export function SubtaskTree({ parentId, compact = false, depth = 0 }: SubtaskTreeProps) {
  const children = useNestedChildren(parentId);
  const listRef = useRef<HTMLUListElement>(null);

  // Unfold from the parent instead of popping in; the height settles, then clears.
  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el || depth > 0) return;
    unfold(el);
    return () => {
      gsap.killTweensOf(el);
    };
  }, [depth]);

  if (children.length === 0) return null;
  const limit = compact ? 3 : 8;
  const visible = children.slice(0, limit);
  const extra = children.length - visible.length;

  return (
    <ul ref={listRef} className={cn("overflow-hidden", depth === 0 && "border-t border-current/15 py-0.5")}>
      {visible.map((child) => (
        <SubtaskRow key={child.id} item={child} compact={compact} depth={depth} />
      ))}
      {extra > 0 && (
        <li className="px-2 py-0.5 pl-3 text-[11.5px] opacity-70">{extra} more</li>
      )}
    </ul>
  );
}

function SubtaskRow({ item, compact, depth }: { item: PlanItem; compact: boolean; depth: number }) {
  const ui = useCalendarUi();
  const save = useSaveItem();
  const selected = ui?.selectedId === item.id;
  const done = item.status === "completed";
  const showNested = !compact && depth < 1;

  return (
    <li>
      <div
        className={cn(
          "flex min-w-0 items-center gap-1.5 py-px pr-1.5 pl-2 text-[11.5px] leading-4",
          done && "opacity-60",
          selected && "bg-foreground/[0.06]"
        )}
      >
        {compact ? (
          <span aria-hidden className={cn("size-1 shrink-0 rounded-full bg-current opacity-50")} />
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={done}
            aria-label={done ? `Reopen ${item.title}` : `Complete ${item.title}`}
            className={cn(
              "flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border border-current/40 outline-none focus-visible:ring-2 focus-visible:ring-ring",
              done && "border-transparent bg-current/25"
            )}
            onClick={(event) => {
              event.stopPropagation();
              void save(applyStatus(item, done ? "pending" : "completed"));
            }}
          >
            {done && <Check className="size-2.5" strokeWidth={3} />}
          </button>
        )}
        <button
          type="button"
          aria-current={selected ? "true" : undefined}
          aria-label={`Subtask: ${item.title}`}
          className={cn(
            "min-w-0 flex-1 truncate rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
            done && "line-through"
          )}
          onClick={(event) => {
            event.stopPropagation();
            ui?.onSelect(item.id);
          }}
        >
          {item.title}
        </button>
      </div>
      {showNested && <SubtaskTree parentId={item.id} depth={depth + 1} />}
    </li>
  );
}
