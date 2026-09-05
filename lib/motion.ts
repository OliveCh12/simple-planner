import { gsap } from "gsap";

export { gsap };

/** Honour the OS setting; every animation goes through this gate. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const MOTION = {
  /** Small position changes: draft moves, drag settles. */
  settle: { duration: 0.28, ease: "power2.out" },
  /** Panes sliding into the layout. */
  pane: { duration: 0.22, ease: "power2.out" },
  /** Hints that fade in and out. */
  hint: { duration: 0.18, ease: "power1.out" },
} as const;

const pendingRects = new Map<string, DOMRect>();

/**
 * FLIP, step one: remember where an element is before the state change that
 * moves it. Keyed by the element's `data-cal-item` occurrence id.
 */
export function captureRect(occurrenceId: string): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector<HTMLElement>(`[data-cal-item="${CSS.escape(occurrenceId)}"]`);
  if (!el) return;
  pendingRects.set(occurrenceId, el.getBoundingClientRect());
}

/** Same, from a rect already measured (a lifted card, a ghost about to become a draft). */
export function captureRectOf(key: string, rect: DOMRect): void {
  pendingRects.set(key, rect);
}

/** FLIP, step two: after layout, play from the remembered rect to the current one. */
export function playFlip(occurrenceId: string, el: HTMLElement | null): void {
  const from = pendingRects.get(occurrenceId);
  if (!from || !el) return;
  pendingRects.delete(occurrenceId);
  if (prefersReducedMotion()) return;
  const to = el.getBoundingClientRect();
  if (to.width === 0 || to.height === 0) return;
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
  gsap.killTweensOf(el);
  gsap.fromTo(
    el,
    { x: dx, y: dy, scaleX: sx, scaleY: sy, transformOrigin: "top left" },
    { x: 0, y: 0, scaleX: 1, scaleY: 1, ...MOTION.settle, clearProps: "transform" }
  );
}

/** Slide a pane into the layout by growing its width from zero. */
export function revealPane(el: HTMLElement, width: number): void {
  if (prefersReducedMotion()) return;
  gsap.killTweensOf(el);
  // The pane also has a CSS width transition for resizes; silence it while GSAP drives.
  const previousTransition = el.style.transition;
  el.style.transition = "none";
  gsap.fromTo(
    el,
    { width: 0, opacity: 0.6 },
    {
      width,
      opacity: 1,
      ...MOTION.pane,
      clearProps: "width,opacity",
      onComplete: () => {
        el.style.transition = previousTransition;
      },
    }
  );
}

/** Fade a small element in, hold, then out. Returns a cancel function. */
export function flashHint(el: HTMLElement, holdMs = 1200): () => void {
  gsap.killTweensOf(el);
  if (prefersReducedMotion()) {
    el.style.opacity = "1";
    const id = window.setTimeout(() => {
      el.style.opacity = "0";
    }, holdMs);
    return () => window.clearTimeout(id);
  }
  const timeline = gsap
    .timeline()
    .fromTo(el, { opacity: 0, y: 2 }, { opacity: 1, y: 0, ...MOTION.hint })
    .to(el, { opacity: 0, ...MOTION.hint, delay: holdMs / 1000 });
  return () => {
    timeline.kill();
  };
}
