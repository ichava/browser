import { useEffect, useState } from 'react';
import type { Locale } from '@/core/i18n';
import { SHARED_LOCALE_KEY, isLocale, loadSharedLocale, saveSharedLocale, subscribeSharedLocale } from '@/core/localeShare';

/**
 * useSharedLocale — locale state backed by the shared `ichava.locale` key, kept
 * in sync across surfaces. Used by the landing bundle; the app drives its own
 * copy through the store, which mirrors to the same key.
 *
 * This is the React binding for `core/localeShare`. It lives here rather than in
 * `core/` because that layer must not import React: a hook in the pure engine
 * puts React into the public surface a Vue or Blade consumer would inherit.
 *
 * Two sync paths, and both are needed. `subscribeSharedLocale` covers writes in
 * THIS document, which the `storage` event does not fire for; the `storage`
 * listener covers other tabs.
 */
export function useSharedLocale(): [Locale, (l: Locale) => void] {
  const [locale, setLocale] = useState<Locale>(() => loadSharedLocale());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SHARED_LOCALE_KEY && isLocale(e.newValue)) setLocale(e.newValue);
    };
    const unsubscribe = subscribeSharedLocale(setLocale);
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  // saveSharedLocale notifies every subscriber, this one included, so there is no
  // extra setLocale here — all instances update through the single notify path.
  const set = (l: Locale) => saveSharedLocale(l);
  return [locale, set];
}
