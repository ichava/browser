import { useCallback } from 'react';

import { translate } from '@/core/i18n';
import { useAppStore } from '@/hooks/useStoreApi';

/** Returns a `t(key, vars?)` translator bound to the current store locale. */
export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const locale = useAppStore((s) => s.locale);
  return useCallback((key: string, vars?: Record<string, string | number>) => translate(locale, key, vars), [locale]);
}
