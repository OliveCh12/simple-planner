"use client";

import { useLayoutEffect, type RefObject } from "react";
import { playFlip } from "@/lib/motion";

/**
 * After every commit, settle the element from the rect captured before the
 * state change (see `captureRect`). No captured rect, no work.
 */
export function useFlip(occurrenceId: string, ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    playFlip(occurrenceId, ref.current);
  });
}
