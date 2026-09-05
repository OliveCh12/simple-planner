"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { clampPanelWidth, PANEL_WIDTH } from "@/lib/layout/panel";
import { useSwapMotion } from "@/hooks/useSwapMotion";
import { closePane, openPane } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

type PanelSide = "left" | "right";

/**
 * Keep the last content of a slot around while it animates out, so a pane
 * can leave the layout instead of vanishing on the frame it is closed.
 */
function usePresence(node: ReactNode): { shown: ReactNode; open: boolean; onExited: () => void } {
  const [shown, setShown] = useState<ReactNode>(node);
  const open = node !== null && node !== undefined && node !== false;
  if (open && node !== shown) setShown(node);
  const onExited = useCallback(() => setShown(null), []);
  return { shown: open ? node : shown, open, onExited };
}

/**
 * Calendar page frame: optional left pane, the calendar, optional right pane.
 * On `md+` panes sit in the flow and shrink the calendar. Below that, an
 * open pane covers the workspace — no portal, no dim overlay.
 */
export function CalendarWorkspace({
  left,
  right,
  rightKey,
  children,
}: {
  left?: ReactNode;
  right?: ReactNode;
  /** Identity of the right pane's content; a change fades the new content in. */
  rightKey?: string;
  children: ReactNode;
}) {
  const widths = useUIStore((s) => s.panelWidths);
  const setPanelWidth = useUIStore((s) => s.setPanelWidth);
  const frameRef = useRef<HTMLDivElement>(null);
  const leftPane = usePresence(left);
  const rightPane = usePresence(right);

  const both = leftPane.open && rightPane.open;
  const share = both ? 0.32 : 0.45;

  const clamp = useCallback(
    (width: number) => clampPanelWidth(width, frameRef.current?.clientWidth, share),
    [share]
  );
  const commit = useCallback(
    (side: PanelSide, width: number) => setPanelWidth(side, clamp(width)),
    [clamp, setPanelWidth]
  );

  return (
    <div ref={frameRef} className="relative flex min-h-0 flex-1 overflow-hidden">
      {leftPane.shown ? (
        <CalendarPanel
          side="left"
          width={widths.left}
          crowded={both}
          open={leftPane.open}
          clamp={clamp}
          onWidthChange={(width) => commit("left", width)}
          onExited={leftPane.onExited}
        >
          {leftPane.shown}
        </CalendarPanel>
      ) : null}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      {rightPane.shown ? (
        <CalendarPanel
          side="right"
          width={widths.right}
          crowded={both}
          open={rightPane.open}
          contentKey={rightKey}
          clamp={clamp}
          onWidthChange={(width) => commit("right", width)}
          onExited={rightPane.onExited}
        >
          {rightPane.shown}
        </CalendarPanel>
      ) : null}
    </div>
  );
}

function CalendarPanel({
  side,
  width,
  crowded,
  open,
  contentKey,
  clamp,
  onWidthChange,
  onExited,
  children,
}: {
  side: PanelSide;
  width: number;
  crowded: boolean;
  open: boolean;
  contentKey?: string;
  clamp: (width: number) => number;
  onWidthChange: (width: number) => void;
  onExited: () => void;
  children: ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const label = side === "right" ? "Details" : "Sidebar";
  const asideRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const exited = useRef(onExited);

  // New content in an open pane fades in; the first content arrives with the pane itself.
  useSwapMotion(contentRef, contentKey ?? "", () => "fade");

  useEffect(() => {
    exited.current = onExited;
  }, [onExited]);

  // Grow into place on mount, leave when the slot empties; reopening mid-close resumes.
  useLayoutEffect(() => {
    const el = asideRef.current;
    if (!el) return;
    if (open) {
      openPane(el, side);
      return;
    }
    return closePane(el, side, () => exited.current());
  }, [open, side]);

  return (
    <aside
      ref={asideRef}
      aria-label={label}
      aria-hidden={!open || undefined}
      data-calendar-panel={side}
      data-state={open ? "open" : "closed"}
      style={{ ["--panel-width" as string]: `${width}px` }}
      className={cn(
        "relative flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground",
        "max-md:absolute max-md:inset-0 max-md:z-20 max-md:w-full",
        "md:relative md:w-[var(--panel-width)] md:min-w-[16.25rem] md:shrink-0",
        crowded ? "md:max-w-[32%]" : "md:max-w-[45%]",
        side === "right" && "md:border-l md:border-cal-line-strong",
        side === "left" && "md:border-r md:border-cal-line-strong"
      )}
    >
      {open && (
        <PanelResizeHandle
          side={side}
          width={width}
          dragging={dragging}
          clamp={clamp}
          onDraggingChange={setDragging}
          onWidthChange={onWidthChange}
        />
      )}
      <div ref={contentRef} data-pane-content className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </aside>
  );
}

/**
 * The drag writes the width straight to the pane and commits to the store
 * on release: no render, no persistence, nothing between the hand and the edge.
 */
function PanelResizeHandle({
  side,
  width,
  dragging,
  clamp,
  onDraggingChange,
  onWidthChange,
}: {
  side: PanelSide;
  width: number;
  dragging: boolean;
  clamp: (width: number) => number;
  onDraggingChange: (dragging: boolean) => void;
  onWidthChange: (width: number) => void;
}) {
  const origin = useRef({ x: 0, width: 0, live: 0 });

  const pane = (el: HTMLElement) => el.closest<HTMLElement>("[data-calendar-panel]");
  const paint = (el: HTMLElement, next: number) => {
    origin.current.live = next;
    pane(el)?.style.setProperty("--panel-width", `${next}px`);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${side} panel`}
      aria-valuenow={Math.round(width)}
      aria-valuemin={PANEL_WIDTH.min}
      aria-valuemax={PANEL_WIDTH.max}
      tabIndex={0}
      className={cn(
        "absolute inset-y-0 z-10 hidden w-1.5 cursor-col-resize touch-none transition-colors duration-100 md:block",
        side === "right" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
        dragging ? "bg-ring/40" : "bg-transparent hover:bg-ring/25"
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        origin.current = { x: event.clientX, width, live: width };
        onDraggingChange(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const delta = side === "right" ? origin.current.x - event.clientX : event.clientX - origin.current.x;
        paint(event.currentTarget, clamp(origin.current.width + delta));
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onDraggingChange(false);
        onWidthChange(origin.current.live);
      }}
      onPointerCancel={(event) => {
        onDraggingChange(false);
        paint(event.currentTarget, width);
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 32 : 16;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onWidthChange(width + (side === "right" ? step : -step));
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onWidthChange(width + (side === "right" ? -step : step));
        }
      }}
    />
  );
}
