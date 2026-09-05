import { create } from "zustand";

/** One reversible change. Both directions are plain async closures over the repository. */
export interface HistoryEntry {
  label: string;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  at: number;
}

const LIMIT = 100;

interface HistoryStore {
  past: HistoryEntry[];
  future: HistoryEntry[];
  busy: boolean;
  push: (entry: Omit<HistoryEntry, "at">) => void;
  /** Reverts the latest change; resolves to its label, or null when there was nothing to undo. */
  undo: () => Promise<string | null>;
  redo: () => Promise<string | null>;
  clear: () => void;
}

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  busy: false,

  push: (entry) =>
    set((state) => ({
      past: [...state.past.slice(-(LIMIT - 1)), { ...entry, at: Date.now() }],
      future: [],
    })),

  undo: async () => {
    const { past, busy } = get();
    const entry = past[past.length - 1];
    if (!entry || busy) return null;
    set({ busy: true, past: past.slice(0, -1) });
    try {
      await entry.undo();
      set((state) => ({ future: [...state.future, entry] }));
      return entry.label;
    } catch (error) {
      console.error("Undo failed:", error);
      set((state) => ({ past: [...state.past, entry] }));
      return null;
    } finally {
      set({ busy: false });
    }
  },

  redo: async () => {
    const { future, busy } = get();
    const entry = future[future.length - 1];
    if (!entry || busy) return null;
    set({ busy: true, future: future.slice(0, -1) });
    try {
      await entry.redo();
      set((state) => ({ past: [...state.past, entry] }));
      return entry.label;
    } catch (error) {
      console.error("Redo failed:", error);
      set((state) => ({ future: [...state.future, entry] }));
      return null;
    } finally {
      set({ busy: false });
    }
  },

  clear: () => set({ past: [], future: [] }),
}));
