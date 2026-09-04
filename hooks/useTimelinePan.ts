import { useEffect, useState } from "react";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function useTimelinePan(el: HTMLDivElement | null, enabled: boolean) {
  const [panning, setPanning] = useState(false);
  const [panReady, setPanReady] = useState(false);

  useEffect(() => {
    if (!el || !enabled) return;

    let pointerId: number | null = null;
    let startX = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let moved = false;
    let inertiaFrame = 0;
    let spaceHeld = false;
    let lockedScroll = 0;

    const stopInertia = () => {
      cancelAnimationFrame(inertiaFrame);
      inertiaFrame = 0;
    };

    const setSpace = (held: boolean) => {
      if (spaceHeld === held) return;
      spaceHeld = held;
      if (held) lockedScroll = el.scrollLeft;
      setPanReady(held);
      stopInertia();
      if (!held && pointerId !== null && !moved) pointerId = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTypingTarget(event.target)) return;
      event.preventDefault();
      if (event.repeat) return;
      setSpace(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code !== "Space" || isTypingTarget(event.target)) return;
      event.preventDefault();
      setSpace(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!spaceHeld || event.button !== 0) return;
      if (isTypingTarget(event.target)) return;
      stopInertia();
      pointerId = event.pointerId;
      startX = event.clientX;
      lastX = event.clientX;
      lastTime = performance.now();
      moved = false;
      velocity = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId || !spaceHeld) return;
      const dx = event.clientX - lastX;
      if (!moved) {
        if (Math.abs(event.clientX - startX) < 4) return;
        moved = true;
        setPanning(true);
        try {
          el.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
      el.scrollLeft -= dx;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = dx / dt;
      lastX = event.clientX;
      lastTime = now;
      event.preventDefault();
    };

    const finish = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      setPanning(false);
      lockedScroll = el.scrollLeft;
      if (!moved) return;

      let remaining = -velocity * 14;
      const tick = () => {
        remaining *= 0.92;
        if (Math.abs(remaining) < 0.35) return;
        el.scrollLeft += remaining;
        lockedScroll = el.scrollLeft;
        inertiaFrame = requestAnimationFrame(tick);
      };
      inertiaFrame = requestAnimationFrame(tick);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      const timed =
        event.target instanceof Element ? event.target.closest("[data-timed-scroll]") : null;
      if (timed instanceof HTMLElement && timed.scrollHeight > timed.clientHeight + 1) {
        const atTop = timed.scrollTop <= 0 && event.deltaY < 0;
        const atBottom =
          timed.scrollTop + timed.clientHeight >= timed.scrollHeight - 1 && event.deltaY > 0;
        if (!atTop && !atBottom) return;
      }

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      event.preventDefault();
      el.scrollLeft += event.deltaY;
      lockedScroll = el.scrollLeft;
    };

    const onSelectStart = (event: Event) => {
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
    };

    const onScroll = () => {
      if (!spaceHeld || pointerId !== null || inertiaFrame !== 0) return;
      el.scrollLeft = lockedScroll;
    };

    const clearSpace = () => setSpace(false);
    const onVisibility = () => {
      if (document.hidden) setSpace(false);
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    window.addEventListener("blur", clearSpace);
    document.addEventListener("visibilitychange", onVisibility);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("selectstart", onSelectStart);
    el.addEventListener("scroll", onScroll);

    return () => {
      stopInertia();
      setPanReady(false);
      setPanning(false);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      window.removeEventListener("blur", clearSpace);
      document.removeEventListener("visibilitychange", onVisibility);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("selectstart", onSelectStart);
      el.removeEventListener("scroll", onScroll);
    };
  }, [el, enabled]);

  return { panning, panReady };
}
