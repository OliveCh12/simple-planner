const STORAGE_KEY = "planner-storage";

export type StorageConfig =
  | { kind: "browser" }
  | { kind: "remote"; url: string; token: string };

export function readStorageConfig(): StorageConfig {
  if (typeof window === "undefined") return { kind: "browser" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { kind: "browser" };
    const parsed = JSON.parse(raw) as Partial<StorageConfig>;
    if (parsed.kind === "remote") {
      return {
        kind: "remote",
        url: typeof parsed.url === "string" ? parsed.url : "",
        token: typeof parsed.token === "string" ? parsed.token : "",
      };
    }
  } catch {
    /* ignore malformed config */
  }
  return { kind: "browser" };
}

export function writeStorageConfig(config: StorageConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
