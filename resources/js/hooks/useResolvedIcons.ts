import { useMemo } from 'react';
import type { Icon, IconId } from '@js/core/model';
import { useRepo } from '@js/hooks/useRepo';

/**
 * Resolve saved icon ids (favorites, history, collections, selection) back
 * into full `Icon` records.
 *
 * Synchronous: everything resolves against the in-memory `IconRepository`
 * from `useRepo`, falling back to whatever is already on the current page.
 */
export function useResolvedIcons(ids: IconId[]): { icons: Icon[]; loading: boolean } {
  const { repo, page } = useRepo();

  // Free, no request: whatever's already on the current page.
  const pageIndex = useMemo(() => new Map(page.items.map((i) => [i.id, i] as const)), [page.items]);

  const icons = useMemo(() => {
    if (repo) {
      return ids.map((id) => repo.byId(id)).filter((i): i is Icon => Boolean(i));
    }
    return ids.map((id) => pageIndex.get(id)).filter((i): i is Icon => Boolean(i));
  }, [repo, pageIndex, JSON.stringify(ids)]); // eslint-disable-line react-hooks/exhaustive-deps -- keyed on the id list's content, not identity

  return { icons, loading: false };
}
