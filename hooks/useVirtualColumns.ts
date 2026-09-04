import { useEffect, useState } from "react";

export interface ColumnWindow {
  from: number;
  to: number;
}

/** Columns rendered on each side of the visible range. */
const BUFFER = 4;
/** Re-render only once the visible range gets this close to the rendered edge. */
const SLACK = 2;

const EMPTY: ColumnWindow = { from: 0, to: -1 };

/**
 * Index window of the columns worth rendering for a horizontally scrolling
 * board whose columns all share the same pitch (width + gap). The window is
 * widened by a buffer and only recomputed when the visible range approaches
 * its edge, so scrolling does not re-render on every frame.
 */
export function useVirtualColumns(
  el: HTMLDivElement | null,
  count: number,
  pitch: number
): ColumnWindow {
  const [window, setWindow] = useState<ColumnWindow>(EMPTY);

  useEffect(() => {
    if (!el || count === 0) return;

    let frame = 0;
    let padding = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    let rendered: ColumnWindow = EMPTY;

    const measure = () => {
      frame = 0;
      const left = el.scrollLeft - padding;
      const visibleFrom = Math.max(0, Math.floor(left / pitch));
      const visibleTo = Math.min(count - 1, Math.ceil((left + el.clientWidth) / pitch));
      const covered =
        rendered.to >= rendered.from &&
        visibleFrom >= rendered.from + (rendered.from > 0 ? SLACK : 0) &&
        visibleTo <= rendered.to - (rendered.to < count - 1 ? SLACK : 0);
      if (covered) return;
      rendered = {
        from: Math.max(0, visibleFrom - BUFFER),
        to: Math.min(count - 1, visibleTo + BUFFER),
      };
      setWindow(rendered);
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    const onResize = () => {
      padding = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      rendered = EMPTY;
      schedule();
    };

    measure();
    el.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(onResize);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [el, count, pitch]);

  if (!el || count === 0) return EMPTY;
  return window.to < count ? window : { from: Math.min(window.from, count - 1), to: count - 1 };
}
