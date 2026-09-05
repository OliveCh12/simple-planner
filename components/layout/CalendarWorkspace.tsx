"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { clampPanelWidth, PANEL_WIDTH } from "@/lib/layout/panel";
import { revealPane } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/uiStore";

type PanelSide = "left" | "right";

/**
 * Calendar page frame: optional left pane, the calendar, optional right pane.
 * On `md+` panes sit in the flow and shrink the calendar. Below that, an
 * open pane covers the workspace — no portal, no dim overlay.
 */
export function CalendarWorkspace({
  left,
  right,
  children,
}: {
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  const widths = useUIStore((s) => s.panelWidths);
  const setPanelWidth = useUIStore((s) => s.setPanelWidth);
  const frameRef = useRef<HTMLDivElement>(null);

  const both = Boolean(left && right);
  const share = both ? 0.32 : 0.45;

  const resize = useCallback(
    (side: PanelSide, width: number) => {
      setPanelWidth(side, clampPanelWidth(width, frameRef.current?.clientWidth, share));
    },
    [setPanelWidth, share]
  );

  return (
    <div ref={frameRef} className="relative flex min-h-0 flex-1 overflow-hidden">
      {left ? (
        <CalendarPanel
          side="left"
          width={widths.left}
          crowded={both}
          onWidthChange={(width) => resize("left", width)}
        >
          {left}
        </CalendarPanel>
      ) : null}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      {right ? (
        <CalendarPanel
          side="right"
          width={widths.right}
          crowded={both}
          onWidthChange={(width) => resize("right", width)}
        >
          {right}
        </CalendarPanel>
      ) : null}
    </div>
  );
}

function CalendarPanel({
  side,
  width,
  crowded,
  onWidthChange,
  children,
}: {
  side: PanelSide;
  width: number;
  crowded: boolean;
  onWidthChange: (width: number) => void;
  children: ReactNode;
}) {
  const [dragging, setDragging] = useState(false);
  const label = side === "right" ? "Details" : "Sidebar";
  const asideRef = useRef<HTMLElement>(null);

  // Grow into place on mount; the laid-out width is the target, whatever the clamp chose.
  useLayoutEffect(() => {
    const el = asideRef.current;
    if (!el || !window.matchMedia("(min-width: 768px)").matches) return;
    const target = el.getBoundingClientRect().width;
    if (target > 0) revealPane(el, target);
  }, []);

  return (
    <aside
      ref={asideRef}
      aria-label={label}
      data-calendar-panel={side}
      style={{ ["--panel-width" as string]: `${width}px` }}
      className={cn(
        "relative flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground",
        "max-md:absolute max-md:inset-0 max-md:z-20 max-md:w-full",
        "md:relative md:w-[var(--panel-width)] md:min-w-[16.25rem] md:shrink-0",
        crowded ? "md:max-w-[32%]" : "md:max-w-[45%]",
        side === "right" && "md:border-l md:border-cal-line-strong",
        side === "left" && "md:border-r md:border-cal-line-strong",
        !dragging && "md:transition-[width] md:duration-200 md:ease-out"
      )}
    >
      <PanelResizeHandle
        side={side}
        width={width}
        dragging={dragging}
        onDraggingChange={setDragging}
        onWidthChange={onWidthChange}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </aside>
  );
}

function PanelResizeHandle({
  side,
  width,
  dragging,
  onDraggingChange,
  onWidthChange,
}: {
  side: PanelSide;
  width: number;
  dragging: boolean;
  onDraggingChange: (dragging: boolean) => void;
  onWidthChange: (width: number) => void;
}) {
  const origin = useRef({ x: 0, width: 0 });

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
        "absolute inset-y-0 z-10 hidden w-1.5 cursor-col-resize touch-none md:block",
        side === "right" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
        dragging ? "bg-ring/40" : "bg-transparent hover:bg-ring/25"
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        origin.current = { x: event.clientX, width };
        onDraggingChange(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const delta = side === "right" ? origin.current.x - event.clientX : event.clientX - origin.current.x;
        onWidthChange(origin.current.width + delta);
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onDraggingChange(false);
      }}
      onPointerCancel={() => onDraggingChange(false)}
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
