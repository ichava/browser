import { CONFIG_DEFAULTS } from '@/core/config';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/core/i18n';

// A single localStorage key (`ichava.locale`) shared by the app store and the
// standalone landing bundle, so switching the language in either surface carries
// to the other and survives reloads. Kept deliberately tiny (no store dep) so the
// landing entry can use it without pulling in the whole app store.

/** The single localStorage key both surfaces read and write. */
export const SHARED_LOCALE_KEY = CONFIG_DEFAULTS.storageKeys.locale;
const KEY = SHARED_LOCALE_KEY;

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && LOCALES.some((l) => l.code === v);
}

// Same-document subscribers. The `storage` event only fires in OTHER tabs, so a
// write here must notify local subscribers directly — otherwise a switcher updates
// its own state but sibling `useSharedLocale` consumers (e.g. the page that fetches
// the localized copy) never re-render.
const listeners = new Set<(l: Locale) => void>();
function notify(l: Locale) {
  for (const fn of listeners) fn(l);
}

/** Read the shared locale, or the default when unset/invalid. */
export function loadSharedLocale(): Locale {
  try {
    const v = localStorage.getItem(KEY);
    if (isLocale(v)) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

/** Persist the shared locale and notify same-document subscribers (the `storage`
 *  event covers other tabs; `notify` covers this one). */
export function saveSharedLocale(locale: Locale): void {
  try {
    localStorage.setItem(KEY, locale);
  } catch {
    /* ignore */
  }
  notify(locale);
}

/**
 * Subscribe to same-document locale changes. Returns an unsubscribe function.
 *
 * The React binding lives in `hooks/useSharedLocale` — `core/` must stay free of
 * React so a Vue or Blade consumer can use this module as-is. Any framework can
 * build its own reactive wrapper on top of this plus the `storage` event.
 */
export function subscribeSharedLocale(fn: (l: Locale) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
