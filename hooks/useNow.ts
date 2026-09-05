"use client";

import { useEffect, useState } from "react";

const MINUTE_MS = 60_000;

interface UseNowOptions {
  /** Fire on the boundary of `intervalMs` (e.g. exactly on each minute). */
  align?: boolean;
}

/**
 * Wall clock that ticks on an interval and re-reads the real time whenever
 * the tab, window or page comes back: sleep, tab switch, timezone change.
 * Keep consumers small; every tick re-renders the caller.
 */
export function useNow(intervalMs = MINUTE_MS, { align = false }: UseNowOptions = {}): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeout: number | undefined;
    let interval: number | undefined;

    const tick = () => setNow(new Date());
    const stop = () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      if (interval !== undefined) window.clearInterval(interval);
      timeout = undefined;
      interval = undefined;
    };
    const start = () => {
      stop();
      const delay = align ? intervalMs - (Date.now() % intervalMs) : intervalMs;
      timeout = window.setTimeout(() => {
        tick();
        interval = window.setInterval(tick, intervalMs);
      }, delay);
    };
    const wake = () => {
      if (document.visibilityState !== "visible") return;
      tick();
      start();
    };

    start();
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("pageshow", wake);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("pageshow", wake);
    };
  }, [intervalMs, align]);

  return now;
}

/** Minute-exact clock for the current-time indicator. */
export function useNowMinute(): Date {
  return useNow(MINUTE_MS, { align: true });
}

/** Coarse clock for "elapsed" styling across a whole grid. */
export function useNowCoarse(): Date {
  return useNow(5 * MINUTE_MS);
}
