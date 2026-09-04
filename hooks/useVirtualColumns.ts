import { useEffect, useState } from "react";

export interface ColumnWindow {
  from: number;
  to: number;
}

const BUFFER = 3;

/**
 * Index window of the columns worth rendering for a horizontally scrolling
 * board whose columns all share the same pitch (width + gap).
 */
export function useVirtualColumns(
  el: HTMLDivElement | null,
  count: number,
  pitch: number
): ColumnWindow {
  const [window, setWindow] = useState<ColumnWindow>({ from: 0, to: Math.min(count - 1, 12) });

  useEffect(() => {
    if (!el) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const padding = parseFloat(getComputedStyle(el).paddingLeft) || 0;
      const left = el.scrollLeft - padding;
      const from = Math.max(0, Math.floor(left / pitch) - BUFFER);
      const to = Math.min(count - 1, Math.ceil((left + el.clientWidth) / pitch) + BUFFER);
      setWindow((current) =>
        current.from === from && current.to === to ? current : { from, to }
      );
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    el.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", schedule);
      observer.disconnect();
    };
  }, [el, count, pitch]);

  return window;
}
