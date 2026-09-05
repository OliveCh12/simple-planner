import { gsap } from "gsap";

export { gsap };

/** Honour the OS setting; every animation goes through this gate. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isDesktop(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

/**
 * One vocabulary for the whole app. Everything starts fast and lands softly,
 * so the interface answers the hand at once and never feels like it is
 * waiting for a curve to finish.
 */
export const MOTION = {
  /** Small position changes: draft moves, drag settles. */
  settle: { duration: 0.24, ease: "power3.out" },
  /** Panes growing into the layout. */
  pane: { duration: 0.24, ease: "expo.out" },
  /** Panes leaving: shorter, and accelerating away. */
  paneOut: { duration: 0.16, ease: "power2.in" },
  /** A view replacing another in place. */
  swap: { duration: 0.18, ease: "power3.out" },
  /** Hints that fade in and out. */
  hint: { duration: 0.16, ease: "power1.out" },
  /** Content unfolding below its parent. */
  unfold: { duration: 0.18, ease: "power3.out" },
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

type PaneSide = "left" | "right";

function paneContent(el: HTMLElement): HTMLElement | null {
  return el.querySelector<HTMLElement>("[data-pane-content]");
}

/** Freeze the pane's content at a width so it does not reflow while the pane itself moves. */
function freezeContent(el: HTMLElement, side: PaneSide, width: number): () => void {
  const content = paneContent(el);
  el.style.overflow = "hidden";
  el.style.minWidth = "0";
  if (content) {
    content.style.width = `${width}px`;
    content.style.flex = "none";
    content.style.height = "100%";
    // A left pane reveals from its outer edge; anchoring the content there
    // makes it slide in with the pane instead of standing still behind a curtain.
    if (side === "left") content.style.alignSelf = "flex-end";
  }
  return () => {
    el.style.overflow = "";
    el.style.minWidth = "";
    if (content) {
      content.style.width = "";
      content.style.flex = "";
      content.style.height = "";
      content.style.alignSelf = "";
    }
  };
}

/** Natural width of a pane, ignoring any tween in progress. */
function restingWidth(el: HTMLElement): number {
  const inline = el.style.width;
  el.style.width = "";
  const width = el.getBoundingClientRect().width;
  el.style.width = inline;
  return width;
}

/**
 * Bring a pane into the layout. Desktop panes grow in place so the calendar
 * gives way smoothly; on small screens they slide over the workspace.
 * Reopening mid-close continues from wherever the pane is.
 */
export function openPane(el: HTMLElement, side: PaneSide): void {
  gsap.killTweensOf(el);
  el.style.pointerEvents = "";
  if (prefersReducedMotion()) {
    gsap.set(el, { clearProps: "width,transform,opacity" });
    return;
  }
  if (!isDesktop()) {
    if (!el.style.transform) gsap.set(el, { xPercent: side === "right" ? 100 : -100 });
    gsap.to(el, { xPercent: 0, ...MOTION.pane, clearProps: "transform" });
    return;
  }
  const target = restingWidth(el);
  if (target <= 0) return;
  const thaw = freezeContent(el, side, target);
  if (!el.style.width) gsap.set(el, { width: 0 });
  gsap.to(el, {
    width: target,
    ...MOTION.pane,
    onComplete: () => {
      thaw();
      gsap.set(el, { clearProps: "width" });
    },
  });
}

/** Take a pane out of the layout; resolves the callback once it is gone. Returns a cancel. */
export function closePane(el: HTMLElement, side: PaneSide, onDone: () => void): () => void {
  gsap.killTweensOf(el);
  el.style.pointerEvents = "none";
  if (prefersReducedMotion()) {
    onDone();
    return () => {};
  }
  let thaw = () => {};
  const tween = !isDesktop()
    ? gsap.to(el, { xPercent: side === "right" ? 100 : -100, ...MOTION.paneOut, onComplete: onDone })
    : (() => {
        const width = el.getBoundingClientRect().width;
        thaw = freezeContent(el, side, width);
        return gsap.to(el, { width: 0, ...MOTION.paneOut, onComplete: onDone });
      })();
  return () => {
    tween.kill();
    thaw();
  };
}

export type SwapKind = "next" | "previous" | "zoom" | "fade";

/** Play a new view into place: a short directional slide, a breath of zoom, or a plain fade. */
export function swapIn(el: HTMLElement, kind: SwapKind): void {
  if (prefersReducedMotion()) return;
  gsap.killTweensOf(el);
  const from =
    kind === "zoom"
      ? { opacity: 0, scale: 0.985, transformOrigin: "50% 40%" }
      : kind === "fade"
        ? { opacity: 0 }
        : { opacity: 0, x: kind === "next" ? 28 : -28 };
  gsap.fromTo(el, from, { opacity: 1, x: 0, scale: 1, ...MOTION.swap, clearProps: "transform,opacity" });
}

/** Grow a row into the layout from zero height. */
export function unfold(el: HTMLElement): void {
  if (prefersReducedMotion()) return;
  gsap.killTweensOf(el);
  const overflow = el.style.overflow;
  el.style.overflow = "hidden";
  gsap.from(el, {
    height: 0,
    opacity: 0,
    ...MOTION.unfold,
    clearProps: "height,opacity",
    onComplete: () => {
      el.style.overflow = overflow;
    },
  });
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
