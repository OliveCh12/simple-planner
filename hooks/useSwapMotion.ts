"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { swapIn, type SwapKind } from "@/lib/motion";

/**
 * Animate an element whenever `key` changes, choosing the motion from the old
 * and new keys. Nothing plays on mount: the first key is the resting state.
 */
export function useSwapMotion(
  ref: RefObject<HTMLElement | null>,
  key: string,
  resolve: (previous: string, next: string) => SwapKind | null
): void {
  const previous = useRef<string | null>(null);

  useLayoutEffect(() => {
    const last = previous.current;
    previous.current = key;
    if (last === null || last === key || !ref.current) return;
    const kind = resolve(last, key);
    if (kind) swapIn(ref.current, kind);
    // `resolve` is a pure function of the two keys; the key is the only trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ref]);
}
