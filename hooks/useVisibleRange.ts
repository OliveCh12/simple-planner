import { useEffect, useState } from "react";

export interface VisibleRange {
  fromX: number;
  toX: number;
  /** Visible left edge, without the render buffer. */
  visibleFrom: number;
}

const BUFFER = 400;
const SLACK = 200;

const EMPTY: VisibleRange = { fromX: 0, toX: -1, visibleFrom: 0 };

/**
 * Pixel window of a horizontally scrolling canvas, widened by a buffer and
 * only recomputed when the visible range approaches its edge.
 */
export function useVisibleRange(el: HTMLDivElement | null, totalWidth: number): VisibleRange {
  const [range, setRange] = useState<VisibleRange>(EMPTY);

  useEffect(() => {
    if (!el || totalWidth <= 0) return;

    let frame = 0;
    let padding = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    let rendered: VisibleRange = EMPTY;

    const measure = () => {
      frame = 0;
      const left = el.scrollLeft - padding;
      const visibleFrom = Math.max(0, left);
      const visibleTo = Math.min(totalWidth, left + el.clientWidth);
      const covered =
        rendered.toX >= rendered.fromX &&
        visibleFrom >= rendered.fromX + (rendered.fromX > 0 ? SLACK : 0) &&
        visibleTo <= rendered.toX - (rendered.toX < totalWidth ? SLACK : 0);
      if (covered) {
        setRange((prev) =>
          prev.visibleFrom === visibleFrom ? prev : { ...prev, visibleFrom }
        );
        return;
      }
      rendered = {
        fromX: Math.max(0, visibleFrom - BUFFER),
        toX: Math.min(totalWidth, visibleTo + BUFFER),
        visibleFrom,
      };
      setRange(rendered);
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
  }, [el, totalWidth]);

  if (!el || totalWidth <= 0) return EMPTY;
  if (range.toX < range.fromX) {
    return { fromX: 0, toX: Math.min(totalWidth, 4000), visibleFrom: 0 };
  }
  return range.toX <= totalWidth
    ? range
    : {
        fromX: Math.min(range.fromX, totalWidth),
        toX: totalWidth,
        visibleFrom: range.visibleFrom,
      };
}
