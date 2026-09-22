import { createContext, useContext } from 'react';
import { useStore as defaultStore, type BrowserStoreHook } from '@js/store';

/**
 * Per-mount store plumbing.
 *
 * `useStore` is a module singleton, so two `<IchavaBrowser>` instances on one page
 * shared filters, selection, favorites, appearance and detail state. `mount.tsx`
 * acknowledged that in a comment without solving it.
 *
 * A mount can now create its own store (`createBrowserStore`) and provide it here.
 * With no provider, everything resolves to the singleton, which is what the
 * standalone app wants and what keeps the existing call sites working.
 */
const StoreContext = createContext<BrowserStoreHook | null>(null);

export const StoreProvider = StoreContext.Provider;

/**
 * The active store instance for this part of the tree.
 *
 * Use this in place of importing `useStore` directly whenever you need the store
 * OBJECT rather than a selected value — `getState()`, `setState()`, `subscribe()`.
 * Those are statics on the singleton and cannot be context-aware on their own, so
 * reaching for them through the import is what breaks a second mount.
 *
 * ```ts
 * const store = useStoreApi();
 * store.getState().openDetail(id);
 * ```
 */
export function useStoreApi(): BrowserStoreHook {
  return useContext(StoreContext) ?? defaultStore;
}

/**
 * Select a value from the active store.
 *
 * The context-aware replacement for calling the imported `useStore` directly. A
 * zustand bound store IS a hook, so this just resolves which one first; the store
 * identity is stable per mount, so the hook order is stable too.
 *
 * ```ts
 * const theme = useAppStore((s) => s.theme);
 * ```
 */
export function useAppStore<T>(selector: (s: ReturnType<BrowserStoreHook['getState']>) => T): T {
  const store = useStoreApi();
  return store(selector);
}
