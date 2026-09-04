import { useEffect, useState, type RefObject } from "react";

const NO_PAN = 'input, textarea, select, button, a, [data-slot="input-group"], [data-no-pan]';

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

function canStartPan(event: PointerEvent, spaceHeld: boolean) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  if (target.closest(NO_PAN)) return false;

  const onItem = Boolean(target.closest("[data-objective]"));
  const modifierPan = event.button === 1 || event.altKey || spaceHeld;

  if (onItem) return modifierPan;
  if (modifierPan) return true;
  return event.button === 0;
}

export function useTimelinePan(
  scrollRef: RefObject<HTMLDivElement | null>,
  enabled: boolean
) {
  const [panning, setPanning] = useState(false);
  const [panReady, setPanReady] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !enabled) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let moved = false;
    let frame = 0;
    let spaceHeld = false;

    const stopInertia = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isTypingTarget(event.target)) return;
      if (event.code === "Space") {
        event.preventDefault();
        spaceHeld = true;
        setPanReady(true);
      }
      if (event.key === "Alt") setPanReady(true);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") spaceHeld = false;
      if (event.code === "Space" || event.key === "Alt") setPanReady(false);
    };

    const clearModifiers = () => {
      spaceHeld = false;
      setPanReady(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!canStartPan(event, spaceHeld)) return;
      stopInertia();
      pointerId = event.pointerId;
      startX = event.clientX;
      lastX = event.clientX;
      lastTime = performance.now();
      startScroll = el.scrollLeft;
      moved = false;
      velocity = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      if (!moved) {
        if (Math.abs(dx) < 6) return;
        moved = true;
        setPanning(true);
        try {
          el.setPointerCapture(event.pointerId);
        } catch {
          /* ignore */
        }
      }
      el.scrollLeft = startScroll - dx;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = (event.clientX - lastX) / dt;
      lastX = event.clientX;
      lastTime = now;
      event.preventDefault();
    };

    const finish = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      setPanning(false);
      if (!moved) return;

      let remaining = -velocity * 14;
      const tick = () => {
        remaining *= 0.92;
        if (Math.abs(remaining) < 0.35) return;
        el.scrollLeft += remaining;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!moved) return;
      event.preventDefault();
      event.stopPropagation();
      moved = false;
    };

    const onWheel = (event: WheelEvent) => {
      const column =
        event.target instanceof Element ? event.target.closest(".month-scroll") : null;
      if (column instanceof HTMLElement && column.scrollHeight > column.clientHeight + 1) {
        const atTop = column.scrollTop <= 0 && event.deltaY < 0;
        const atBottom =
          column.scrollTop + column.clientHeight >= column.scrollHeight - 1 && event.deltaY > 0;
        if (!atTop && !atBottom) return;
      }

      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearModifiers);
    el.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      stopInertia();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearModifiers);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("wheel", onWheel);
    };
  }, [enabled, scrollRef]);

  return { panning, panReady };
}

export function getCenteredMonthKey(board: HTMLElement): string | null {
  const columns = [...board.querySelectorAll<HTMLElement>("[data-month-key]")];
  if (columns.length === 0) return null;

  const mid = board.getBoundingClientRect().left + board.clientWidth / 2;
  let best: string | null = null;
  let bestDist = Infinity;

  for (const column of columns) {
    const rect = column.getBoundingClientRect();
    const dist = Math.abs(rect.left + rect.width / 2 - mid);
    if (dist < bestDist) {
      bestDist = dist;
      best = column.dataset.monthKey ?? null;
    }
  }

  return best;
}
