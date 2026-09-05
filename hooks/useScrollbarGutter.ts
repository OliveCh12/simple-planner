"use client";

import { useEffect, useState } from "react";

/**
 * Width of the vertical scrollbar a scroller currently shows, so sibling rows
 * above it (day headers, all-day lane) can reserve the same space and keep
 * every column on one reference grid. Zero with overlay scrollbars.
 */
export function useScrollbarGutter(scroller: HTMLElement | null): number {
  const [gutter, setGutter] = useState(0);

  useEffect(() => {
    if (!scroller) return;
    const measure = () => {
      const next = Math.max(0, scroller.offsetWidth - scroller.clientWidth);
      setGutter((current) => (current === next ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [scroller]);

  return gutter;
}
