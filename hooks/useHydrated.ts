import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during SSR and hydration, true once mounted on the client. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
