import { cached, peekCached } from "@/lib/environment/cache";

/**
 * Tiny external store over the forecast cache so components subscribe with
 * `useSyncExternalStore` and share one fetch per key. Stale values keep
 * showing while a refresh is in flight.
 */

export type ForecastStatus = "loading" | "ready" | "error";

export interface ForecastSnapshot<T> {
  status: ForecastStatus;
  value?: T;
  at: number;
}

const LOADING: ForecastSnapshot<never> = { status: "loading", at: 0 };
const snapshots = new Map<string, ForecastSnapshot<unknown>>();
const listeners = new Map<string, Set<() => void>>();
const inflight = new Set<string>();

function emit(key: string): void {
  listeners.get(key)?.forEach((listener) => listener());
}

export function subscribeForecast(key: string, listener: () => void): () => void {
  const set = listeners.get(key) ?? new Set<() => void>();
  set.add(listener);
  listeners.set(key, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(key);
  };
}

export function readForecast<T>(key: string): ForecastSnapshot<T> {
  return (snapshots.get(key) as ForecastSnapshot<T> | undefined) ?? (LOADING as ForecastSnapshot<T>);
}

/** Make sure a fresh value exists or is on its way. Safe to call on every render pass. */
export function ensureForecast<T>(key: string, ttlMs: number, load: () => Promise<T>): void {
  const current = snapshots.get(key);
  const now = Date.now();
  if (current?.status === "ready" && now - current.at < ttlMs) return;
  const fresh = peekCached<T>(key, ttlMs);
  if (fresh !== undefined && (!current || current.value !== fresh)) {
    snapshots.set(key, { status: "ready", value: fresh, at: now });
    emit(key);
    return;
  }
  if (inflight.has(key)) return;
  inflight.add(key);
  cached(key, ttlMs, load)
    .then((value) => {
      snapshots.set(key, { status: "ready", value, at: Date.now() });
    })
    .catch(() => {
      const previous = snapshots.get(key);
      snapshots.set(key, { status: "error", value: previous?.value, at: Date.now() });
    })
    .finally(() => {
      inflight.delete(key);
      emit(key);
    });
}

/** Tests. */
export function resetForecastStore(): void {
  snapshots.clear();
  listeners.clear();
  inflight.clear();
}
