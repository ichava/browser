import { useEffect, useMemo, useRef } from 'react';
import { router } from '@inertiajs/react';
import { useStore, type FilterState } from '@js/store';
import type { SortKey, SortOrder } from '@js/core/types';

/** Validated query echo the server sends back (`appliedFilters` prop). */
export interface AppliedFilters {
  search?: string | null;
  packages?: string[];
  categories?: string[];
  variants?: string[];
  sort_by?: string;
  sort_direction?: string;
  page?: number;
  per_page?: number;
}

const SORT_KEYS: SortKey[] = ['name', 'package', 'category'];

/** Server-valid subset of the store filters, mirroring `IconFilterRequest`. */
export function toQueryParams(f: FilterState): Record<string, string | number | string[] | undefined> {
  const search = f.search.trim();
  return {
    search: search.length >= 2 ? search : undefined,
    packages: f.packages.length ? f.packages : undefined,
    categories: f.categories.length ? f.categories : undefined,
    variants: f.variant ? [f.variant] : undefined,
    sort_by: f.sortBy,
    sort_direction: f.sortOrder,
    page: f.page,
    // Server caps per_page below what the client offers; clamp so the echo
    // matches what was sent instead of bouncing a validation error.
    per_page: Math.min(f.perPage, 120),
  };
}

/** Normalize a server echo into the same shape `toQueryParams` emits. */
function echoKey(applied: AppliedFilters | null | undefined): string {
  if (!applied) return '';
  return JSON.stringify({
    search: applied.search || undefined,
    packages: applied.packages?.length ? applied.packages : undefined,
    categories: applied.categories?.length ? applied.categories : undefined,
    variants: applied.variants?.length ? applied.variants : undefined,
    sort_by: applied.sort_by,
    sort_direction: applied.sort_direction,
    page: applied.page,
    per_page: applied.per_page,
  });
}

function seedFilters(applied: AppliedFilters): Partial<FilterState> {
  const sortBy: SortKey = SORT_KEYS.includes(applied.sort_by as SortKey)
    ? (applied.sort_by as SortKey)
    : 'name';
  return {
    search: applied.search ?? '',
    packages: applied.packages ?? [],
    categories: applied.categories ?? [],
    variant: applied.variants?.[0] ?? null,
    sortBy,
    sortOrder: applied.sort_direction === 'desc' ? ('desc' as SortOrder) : ('asc' as SortOrder),
    page: applied.page ?? 1,
    perPage: applied.per_page ?? 60,
  };
}

/**
 * Two-way filter sync between the store and the server query string.
 *
 * - Mount: seed store filters from the server echo (deep links, back button).
 * - Echo: when the server normalizes differently than sent, adopt the echo.
 * - Change: user edits navigate via `router.get`, limited to the listing
 *   props so tree/stats/packages are not refetched per keystroke.
 *
 * The `lastSent` ref is the loop guard: navigation only fires when the store
 * differs from the last query the server confirmed.
 */
export function useFilterSync(url: string, applied: AppliedFilters | null | undefined) {
  const filters = useStore((s) => s.filters);
  const lastSent = useRef<string | null>(null);

  const seed = useMemo(() => (applied ? seedFilters(applied) : null), [JSON.stringify(applied)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount: adopt the server echo once.
  useEffect(() => {
    if (seed) {
      useStore.setState((s) => ({ filters: { ...s.filters, ...seed } }));
      lastSent.current = echoKey(applied);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  // Echo: adopt server normalization (runs on every visit payload).
  useEffect(() => {
    const key = echoKey(applied);
    if (lastSent.current !== null && key !== lastSent.current) {
      lastSent.current = key;
      if (seed) useStore.setState((s) => ({ filters: { ...s.filters, ...seed } }));
    }
  }, [applied, seed]);

  // Change: navigate when the store moves past the last confirmed query.
  useEffect(() => {
    if (lastSent.current === null) {
      lastSent.current = JSON.stringify(toQueryParams(filters));
      return;
    }
    const key = JSON.stringify(toQueryParams(filters));
    if (key === lastSent.current) return;
    lastSent.current = key;
    router.get(url, toQueryParams(filters), {
      preserveState: true,
      replace: true,
      only: ['icons', 'pagination', 'appliedFilters', 'favorites', 'collections', 'history', 'commandHistory'],
    });
  }, [filters, url]);
}
