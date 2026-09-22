import { useEffect, useMemo } from 'react';
import { IconRepository } from '@js/core/IconRepository';
import type { CategoryGroup } from '@js/core/IconRepository';
import type { PageResult, Icon } from '@js/core/model';
import { toListParams } from '@js/store';
import { useAppStore } from '@js/hooks/useStoreApi';

/**
 * The single derived-data boundary.
 *
 * Every count -- results, chips, pagination, tree -- comes from one memoized
 * `IconRepository` over the `catalog` in the store, synchronously. Inertia
 * pages build that catalog from server props and load it into the store on
 * mount; filtering, sorting and pagination then run client-side over the
 * loaded page set, exactly as the static mode always did.
 */
export function useRepo() {
  const catalog = useAppStore((s) => s.catalog);
  const filters = useAppStore((s) => s.filters);
  const catQ = useAppStore((s) => s.catQ);
  const setPage = useAppStore((s) => s.setPage);

  const params = useMemo(() => toListParams(filters), [filters]);

  const repo = useMemo(() => (catalog ? new IconRepository(catalog) : null), [catalog]);

  const page: PageResult<Icon> = useMemo(
    () => repo?.page(params) ?? { items: [], total: 0, page: 1, perPage: filters.perPage, lastPage: 1, rangeStart: 0, rangeEnd: 0 },
    [repo, params, filters.perPage],
  );

  const tree: CategoryGroup[] = useMemo(() => {
    if (!repo) return [];
    const all = repo.categoryTree(params);
    if (!catQ.trim()) return all;
    const q = catQ.toLowerCase();
    return all
      .map((g) => ({
        ...g,
        cats: g.cats
          .map((c) => {
            const catHit = c.name.toLowerCase().includes(q);
            const subHit = c.sub?.filter((sc) => sc.name.toLowerCase().includes(q));
            if (catHit) return c;
            if (subHit && subHit.length) return { ...c, sub: subHit };
            return null;
          })
          .filter((c): c is NonNullable<typeof c> => c !== null),
      }))
      .filter((g) => g.cats.length > 0);
  }, [repo, params, catQ]);

  const variantCounts = useMemo(() => (repo ? repo.variantCounts(params) : new Map<string, number>()), [repo, params]);

  // Keep the stored page in range: a deep-linked `?page=99` or a shrunk result
  // set would otherwise strand the page above lastPage (Prev appears frozen).
  useEffect(() => {
    if (page.total > 0 && filters.page !== page.page) setPage(page.page);
  }, [filters.page, page.page, page.total, setPage]);

  return {
    repo,
    page,
    tree,
    variantCounts,
    catalog,
    loading: false,
    error: null,
  };
}
