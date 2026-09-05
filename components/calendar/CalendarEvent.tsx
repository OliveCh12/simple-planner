"use client";

import { useRef, type CSSProperties } from "react";
import { ChevronRight, CornerDownRight, Repeat } from "lucide-react";
import { useCalendarUi } from "@/components/calendar/calendar-ui";
import { SubtaskTree } from "@/components/calendar/SubtaskTree";
import { EventWeatherGlyph } from "@/components/environment/EventWeather";
import { SourceMark } from "@/components/plan/SourceMark";
import { useFlip } from "@/hooks/useFlip";
import { useChildProgress, useHasFoldableChildren, useIsSubtask } from "@/hooks/useItemTree";
import { timedLabel, type CalendarOccurrence } from "@/lib/calendar";
import { categorySurface, surfaceTone } from "@/lib/colors";
import { getKindOption, getStatusOption } from "@/lib/constants";
import { isElapsedOccurrence } from "@/lib/time/presence";
import { cn } from "@/lib/utils";
import { usePlannerStore } from "@/store/plannerStore";

export type CalendarEventVariant = "chip" | "block" | "dot";

/** Below this height a block goes single-line; below `TINY_PX` it keeps the title only. */
const COMPACT_PX = 40;
const TINY_PX = 26;

interface CalendarEventProps {
  occurrence: CalendarOccurrence;
  time?: string;
  /**
   * `chip`: one tinted row (all-day lanes, lists). `block`: fills a timed
   * slot in week/day grids. `dot`: plain text with a color dot, for timed
   * items listed inside a month cell.
   */
  variant?: CalendarEventVariant;
  /** Rendered height of the slot, so short blocks can lay out in one line. */
  height?: number;
  className?: string;
  highlight?: boolean;
  draggable?: boolean;
  dimmed?: boolean;
  /** Past occurrence while the visible range still contains now. */
  elapsed?: boolean;
}

/** Grab zone on the edge with a small pill that only shows on hover or selection. */
function ResizeHandle({
  edge,
  block,
  compact,
  visible,
}: {
  edge: "start" | "end";
  block: boolean;
  compact: boolean;
  visible: boolean;
}) {
  return (
    <span
      data-cal-resize={edge}
      aria-hidden
      className={cn(
        "absolute z-[3] flex opacity-0 transition-opacity duration-150 group-hover/cal:opacity-100",
        visible && "opacity-100",
        block
          ? cn(
              "inset-x-0 cursor-ns-resize justify-center",
              compact ? "h-1.5" : "h-2.5",
              edge === "start" ? "top-0 items-start" : "bottom-0 items-end"
            )
          : cn("inset-y-0 w-2.5 cursor-ew-resize items-center", edge === "start" ? "left-0 justify-start" : "right-0 justify-end")
      )}
    >
      <span
        className={cn(
          "rounded-full bg-current/45",
          block
            ? cn("h-[3px] w-5", compact ? (edge === "start" ? "mt-px" : "mb-px") : edge === "start" ? "mt-[3px]" : "mb-[3px]")
            : cn("h-3 w-[3px]", edge === "start" ? "ml-[3px]" : "mr-[3px]")
        )}
      />
    </span>
  );
}

export function CalendarEvent({
  occurrence,
  time,
  variant = "chip",
  height,
  className,
  highlight,
  draggable = false,
  dimmed = false,
  elapsed = false,
}: CalendarEventProps) {
  const item = usePlannerStore((s) => s.items.find((entry) => entry.id === occurrence.itemId));
  const currentPlan = usePlannerStore((s) => s.currentPlan);
  const ui = useCalendarUi();
  const { done, total } = useChildProgress(occurrence.itemId);
  const foldable = useHasFoldableChildren(occurrence.itemId);
  const subtask = useIsSubtask({ kind: occurrence.kind, parentId: item?.parentId });
  const rootRef = useRef<HTMLDivElement>(null);
  useFlip(occurrence.id, rootRef);
  if (!item) return null;

  const kind = getKindOption(occurrence.kind);
  const status = getStatusOption(occurrence.status);
  const tint = occurrence.categoryColor ?? currentPlan?.color;
  const surface = tint ? categorySurface(tint, surfaceTone(occurrence.kind, subtask)) : undefined;
  const label = time ?? timedLabel(occurrence);
  const block = variant === "block";
  const dot = variant === "dot";
  const draft = Boolean(item.draft);
  const tinted = !dot;
  const isEvent = occurrence.kind === "event";
  const expanded = foldable && Boolean(ui?.showSubtasks || ui?.expandedIds.has(occurrence.itemId));
  const selected = Boolean(highlight || ui?.selectedId === occurrence.itemId);
  const untitled = !occurrence.title.trim();
  const displayTitle = untitled ? `New ${kind.label.toLowerCase()}` : occurrence.title;
  const showStatus = !draft && (!isEvent || occurrence.status !== "pending");
  const Icon = subtask ? CornerDownRight : kind.icon;
  const compact = block && height !== undefined && height < COMPACT_PX && !expanded;
  const tiny = block && height !== undefined && height < TINY_PX && !expanded;
  const tooltip = [`${draft ? "Draft " : ""}${subtask ? "Subtask" : kind.label}: ${displayTitle}`, label]
    .filter(Boolean)
    .join(" · ");

  const style: CSSProperties | undefined = surface
    ? {
        ["--cat" as string]: surface.color,
        ["--cat-surface" as string]: surface.backgroundImage,
        ...(tinted ? { color: surface.ink } : {}),
      }
    : undefined;

  return (
    <div
      ref={rootRef}
      data-cal-item={occurrence.id}
      data-item-id={occurrence.itemId}
      data-occurrence-start={occurrence.start}
      data-start={occurrence.start}
      data-end={occurrence.end ?? ""}
      data-all-day={occurrence.allDay ? "true" : "false"}
      data-draft={draft ? "true" : undefined}
      data-cat={surface?.color}
      data-kind={occurrence.kind}
      data-title={displayTitle}
      data-tinted={tinted && surface ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
      data-expanded={expanded ? "true" : undefined}
      className={cn(
        "cal-card group/cal relative flex w-full min-w-0 flex-col rounded-[5px] text-xs leading-4 will-change-transform",
        draggable && "cursor-grab",
        expanded ? "overflow-visible" : "overflow-hidden",
        block && "h-full",
        tinted && surface && "[background-image:var(--cat-surface)]",
        tinted && !surface && "bg-foreground/[0.07]",
        tinted && isEvent && !draft && "before:absolute before:left-1 before:w-[3px] before:rounded-full before:bg-[var(--cat,var(--primary))]",
        tinted && isEvent && !draft && (block ? "before:top-1.5 before:bottom-1.5" : "before:top-[5px] before:bottom-[5px]"),
        dot && "hover:bg-accent/70",
        dot && selected && "ring-2 ring-ring",
        draft && "border border-dashed border-current/50",
        (occurrence.status === "completed" || dimmed) && "opacity-50",
        elapsed && !draft && occurrence.status !== "completed" && "opacity-65",
        className
      )}
      style={style}
      onClick={(event) => event.stopPropagation()}
    >
      {draggable && (
        <>
          <ResizeHandle edge="start" block={block} compact={compact} visible={selected} />
          <ResizeHandle edge="end" block={block} compact={compact} visible={selected} />
        </>
      )}
      <div className={cn("flex min-w-0 items-stretch", block && "min-h-0 flex-1")}>
        {foldable && !tiny && (
          <button
            type="button"
            data-expand
            aria-expanded={expanded}
            aria-label={expanded ? `Hide subtasks of ${displayTitle}` : `Show subtasks of ${displayTitle}`}
            title={expanded ? "Hide subtasks" : "Show subtasks"}
            className="flex w-5 shrink-0 items-center justify-center rounded-l-[5px] opacity-70 outline-none hover:bg-foreground/5 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(event) => {
              event.stopPropagation();
              ui?.onToggleExpand(occurrence.itemId);
            }}
          >
            <ChevronRight className={cn("size-3 transition-transform", expanded && "rotate-90")} />
          </button>
        )}
        <button
          type="button"
          title={tooltip}
          aria-label={tooltip}
          aria-current={selected ? "true" : undefined}
          className={cn(
            "flex min-w-0 flex-1 rounded-[5px] text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
            block && !compact && "flex-col items-start gap-0 px-1.5 py-1",
            block && compact && "items-center gap-1.5 px-1.5",
            !block && "items-center gap-1.5 px-1.5 py-[3px]",
            tinted && isEvent && !draft && "pl-2.5",
            occurrence.status === "completed" && "line-through"
          )}
          onClick={(event) => {
            event.stopPropagation();
            ui?.onSelect(occurrence.itemId, item.recurrence ? occurrence.start : undefined);
          }}
        >
          {block && !compact ? (
            <>
              <span className="flex w-full min-w-0 items-center gap-1">
                {!isEvent && <Icon className="size-3 shrink-0 text-[var(--cat,currentColor)]" />}
                <span className={cn("min-w-0 flex-1 truncate font-medium", untitled && "font-normal italic opacity-70")}>
                  {displayTitle}
                </span>
                {item.recurrence && <Repeat className="size-3 shrink-0 opacity-60" />}
                {total > 0 && (
                  <span className="shrink-0 text-[11.5px] tabular-nums opacity-80" aria-label={`${done} of ${total} done`}>
                    {done}/{total}
                  </span>
                )}
                {showStatus && <status.icon className={cn("size-3 shrink-0", status.className)} />}
              </span>
              {(label || (isEvent && item.location?.lat !== undefined)) && (
                <span className="flex w-full min-w-0 items-center gap-1.5">
                  {label && <span className="truncate text-[11.5px] tabular-nums opacity-85">{label}</span>}
                  {isEvent && item.location?.lat !== undefined && <EventWeatherGlyph item={item} />}
                </span>
              )}
            </>
          ) : block ? (
            <>
              {!isEvent && !tiny && <Icon className="size-3 shrink-0 text-[var(--cat,currentColor)]" />}
              <span className={cn("min-w-0 flex-1 truncate font-medium", untitled && "font-normal italic opacity-70")}>
                {displayTitle}
              </span>
              {label && !tiny && (
                <span className="shrink-0 text-[11.5px] tabular-nums opacity-85">{label.split("–")[0]}</span>
              )}
            </>
          ) : (
            <>
              {dot && <span aria-hidden className="size-2 shrink-0 rounded-full bg-[var(--cat,var(--primary))]" />}
              {!dot && !isEvent && <Icon className="size-3 shrink-0 text-[var(--cat,currentColor)]" />}
              {item.recurrence && <Repeat className="size-3 shrink-0 opacity-60" />}
              {isEvent && <SourceMark source={currentPlan?.source} />}
              {label && (
                <span className={cn("shrink-0 text-[11.5px] tabular-nums", dot ? "text-muted-foreground" : "opacity-85")}>
                  {label}
                </span>
              )}
              <span className={cn("min-w-0 flex-1 truncate", isEvent && "font-medium", untitled && "font-normal italic opacity-70")}>
                {displayTitle}
              </span>
              {total > 0 && (
                <span
                  className={cn("shrink-0 text-[11.5px] tabular-nums", dot ? "text-muted-foreground" : "opacity-80")}
                  aria-label={`${done} of ${total} done`}
                >
                  {done}/{total}
                </span>
              )}
              {showStatus && <status.icon className={cn("size-3 shrink-0", status.className)} />}
            </>
          )}
        </button>
      </div>
      {expanded && <SubtaskTree parentId={occurrence.itemId} compact={!block} />}
    </div>
  );
}

export function CalendarOccurrenceList({
  occurrences,
  highlightId,
  now,
}: {
  occurrences: CalendarOccurrence[];
  highlightId?: string | null;
  now?: Date;
}) {
  if (occurrences.length === 0) {
    return <p className="px-1.5 py-1 text-xs text-muted-foreground">Nothing on this day.</p>;
  }

  return (
    <ul className="flex flex-col gap-px">
      {occurrences.map((occurrence) => (
        <li key={occurrence.id}>
          <CalendarEvent
            occurrence={occurrence}
            variant={occurrence.allDay ? "chip" : "dot"}
            highlight={occurrence.itemId === highlightId}
            elapsed={now ? isElapsedOccurrence(occurrence, now) : false}
          />
        </li>
      ))}
    </ul>
  );
}
