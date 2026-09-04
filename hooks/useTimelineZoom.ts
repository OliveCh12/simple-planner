import { useEffect, useRef } from "react";

const WHEEL_THROTTLE_MS = 150;

/**
 * Turns Ctrl/Cmd + wheel (which is also what a trackpad pinch sends) into zoom
 * steps anchored at the pointer. Keyboard zoom lives with the other board keys.
 */
export function useTimelineZoom(
  el: HTMLDivElement | null,
  onZoom: (direction: 1 | -1, clientX: number) => void
) {
  const onZoomRef = useRef(onZoom);
  useEffect(() => {
    onZoomRef.current = onZoom;
  });

  useEffect(() => {
    if (!el) return;
    let lastAt = 0;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      if (event.deltaY === 0) return;
      const now = performance.now();
      if (now - lastAt < WHEEL_THROTTLE_MS) return;
      lastAt = now;
      onZoomRef.current(event.deltaY < 0 ? 1 : -1, event.clientX);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [el]);
}
