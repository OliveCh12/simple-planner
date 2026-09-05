"use client";

import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { useNestedChildren } from "@/hooks/useItemTree";
import { useSaveItem } from "@/hooks/useSaveItem";
import { applyStatus } from "@/lib/domain/items";
import { getStatusOption } from "@/lib/constants";
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
  if (children.length === 0) return null;
  const limit = compact ? 3 : 8;
  const visible = children.slice(0, limit);
  const extra = children.length - visible.length;

  return (
    <ul className={cn(depth === 0 && "border-t border-foreground/10 py-0.5")}>
      {visible.map((child, index) => (
        <SubtaskRow
          key={child.id}
          item={child}
          last={index === visible.length - 1 && extra <= 0}
          compact={compact}
          depth={depth}
        />
      ))}
      {extra > 0 && (
        <li className="px-2 py-0.5 pl-3 text-[10px] text-muted-foreground">+{extra} more</li>
      )}
    </ul>
  );
}

function SubtaskRow({
  item,
  last,
  compact,
  depth,
}: {
  item: PlanItem;
  last: boolean;
  compact: boolean;
  depth: number;
}) {
  const ui = useCalendarUi();
  const save = useSaveItem();
  const selected = ui?.selectedId === item.id;
  const done = item.status === "completed";
  const status = getStatusOption(item.status);
  const showNested = !compact && depth < 1;

  return (
    <li>
      <div
        className={cn(
          "flex min-w-0 items-center gap-1 py-0.5 pr-1.5 text-[11px] leading-4",
          "pl-2.5",
          done && "text-muted-foreground",
          selected && "bg-foreground/5"
        )}
      >
        <span aria-hidden className={cn("size-1 shrink-0 rounded-full bg-current/40", last && "opacity-70")} />
        {!compact && (
          <button
            type="button"
            aria-pressed={done}
            aria-label={done ? `Reopen ${item.title}` : `Complete ${item.title}`}
            className={cn(
              "flex size-3.5 shrink-0 items-center justify-center rounded-sm border border-current/35",
              done && "bg-current/15"
            )}
            onClick={(event) => {
              event.stopPropagation();
              void save(applyStatus(item, done ? "pending" : "completed"));
            }}
          />
        )}
        <button
          type="button"
          aria-current={selected ? "true" : undefined}
          aria-label={`Subtask: ${item.title}`}
          className={cn("min-w-0 flex-1 truncate text-left", done && "line-through")}
          onClick={(event) => {
            event.stopPropagation();
            ui?.onSelect(item.id);
          }}
        >
          {item.title}
        </button>
        <status.icon className={cn("size-3 shrink-0 opacity-70", status.className)} />
      </div>
      {showNested && <SubtaskTree parentId={item.id} depth={depth + 1} />}
    </li>
  );
}
