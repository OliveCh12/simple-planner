/**
 * Small TTL cache for forecast answers: memory first, then localStorage so a
 * reload does not refetch, with one in-flight promise per key.
 */

const PREFIX = "planner:env:";
const MAX_STORED = 40;

interface Entry<T> {
  value: T;
  at: number;
}

const memory = new Map<string, Entry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function storage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readStored<T>(key: string): Entry<T> | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry<T>;
    if (typeof parsed?.at !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored<T>(key: string, entry: Entry<T>): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(PREFIX + key, JSON.stringify(entry));
    pruneStored(store);
  } catch {
    /* quota or private mode: memory cache still works */
  }
}

function pruneStored(store: Storage): void {
  const keys: { key: string; at: number }[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const entry = JSON.parse(store.getItem(key) ?? "null") as Entry<unknown> | null;
      keys.push({ key, at: entry?.at ?? 0 });
    } catch {
      keys.push({ key, at: 0 });
    }
  }
  if (keys.length <= MAX_STORED) return;
  keys.sort((a, b) => a.at - b.at);
  for (const stale of keys.slice(0, keys.length - MAX_STORED)) store.removeItem(stale.key);
}

export function peekCached<T>(key: string, ttlMs: number, now = Date.now()): T | undefined {
  const hit = (memory.get(key) as Entry<T> | undefined) ?? readStored<T>(key);
  if (!hit) return undefined;
  if (now - hit.at > ttlMs) return undefined;
  if (!memory.has(key)) memory.set(key, hit);
  return hit.value;
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  load: (signal?: AbortSignal) => Promise<T>,
  signal?: AbortSignal
): Promise<T> {
  const fresh = peekCached<T>(key, ttlMs);
  if (fresh !== undefined) return fresh;
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const promise = load(signal)
    .then((value) => {
      const entry = { value, at: Date.now() };
      memory.set(key, entry);
      writeStored(key, entry);
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

/** Tests and settings resets. */
export function clearEnvironmentCache(): void {
  memory.clear();
  inflight.clear();
  const store = storage();
  if (!store) return;
  const keys: string[] = [];
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);
    if (key?.startsWith(PREFIX)) keys.push(key);
  }
  for (const key of keys) store.removeItem(key);
}
