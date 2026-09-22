// Driver-aware persist storage (plan Part B — real Local/Session driver). The
// driver choice is held in a SEPARATE localStorage key read synchronously before
// hydration; switching copies the persisted blob between backends so nothing is
// lost. All access is guarded because localStorage genuinely throws in private
// mode and is absent under SSR.

import { createJSONStorage } from 'zustand/middleware';
import type { StateStorage } from 'zustand/middleware';
import { CONFIG_DEFAULTS } from './config';

export type StorageDriver = 'local' | 'session';

const DRIVER_KEY = CONFIG_DEFAULTS.storageKeys.driver; // 'ichava.browser.driver'
export const PERSIST_KEY = CONFIG_DEFAULTS.storageKeys.persist; // 'ichava.browser.v2'

function ls(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function ss(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

// bootstrapped once from the separate (always-local) driver key; falls back to the
// configured default (`config.storage.frontendDriver`) when the user hasn't chosen.
let driver: StorageDriver = ((): StorageDriver => {
  const v = ls()?.getItem(DRIVER_KEY);
  if (v === 'session' || v === 'local') return v;
  return CONFIG_DEFAULTS.storage.frontendDriver === 'session' ? 'session' : 'local';
})();

function backing(): Storage | null {
  return driver === 'session' ? ss() : ls();
}

/** Current persistence driver. */
export function getDriver(): StorageDriver {
  return driver;
}

/**
 * Switch the persistence driver, migrating the existing blob so state survives.
 * The driver choice itself always lives in localStorage (session would vanish on
 * tab close, defeating persistence-of-choice).
 */
export function switchDriver(next: StorageDriver): void {
  if (next === driver) return;
  const from = driver === 'session' ? ss() : ls();
  const to = next === 'session' ? ss() : ls();
  try {
    const blob = from?.getItem(PERSIST_KEY);
    if (blob != null && to) {
      to.setItem(PERSIST_KEY, blob);
      from?.removeItem(PERSIST_KEY);
    }
  } catch {
    /* storage unavailable */
  }
  driver = next;
  try {
    ls()?.setItem(DRIVER_KEY, next);
  } catch {
    /* ignore */
  }
}

/** Wipe the persisted snapshot from the active backend. */
export function clearPersisted(): void {
  try {
    backing()?.removeItem(PERSIST_KEY);
  } catch {
    /* ignore */
  }
}

// A StateStorage whose closures read `driver` live, so every write follows the
// currently-selected backend without recreating the persist middleware.
const liveStorage: StateStorage = {
  getItem: (name) => backing()?.getItem(name) ?? null,
  setItem: (name, value) => {
    try {
      backing()?.setItem(name, value);
    } catch {
      /* quota / private mode */
    }
  },
  removeItem: (name) => {
    try {
      backing()?.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export const driverStorage = createJSONStorage(() => liveStorage);

/**
 * Whether a persisted blob already existed when this module loaded.
 *
 * Read ONCE at module scope, before the persist middleware writes anything --
 * calling this later always reports true, because rehydration itself persists.
 *
 * This is what lets configuration defaults apply on a first run without ever
 * overriding a choice the user already made. Precedence is: core defaults, then
 * the fetched/injected config's `defaults` block, then the user's persisted
 * state, which always wins.
 */
export const HAD_PERSISTED_STATE: boolean = (() => {
  try {
    return backing()?.getItem(PERSIST_KEY) != null;
  } catch {
    return false;
  }
})();
