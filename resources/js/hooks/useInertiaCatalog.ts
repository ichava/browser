import { useEffect, useMemo } from 'react';
import { propsToCatalog, type ServerIcon, type ServerPackage } from '@js/core/propsToCatalog';
import type { Catalog, CategoryGroup } from '@js/core/IconRepository';
import type { IconId } from '@js/core/model';
import { useStore, type Collection, type HistoryEntry } from '@js/store';

/** Server collection rows (`icon_ids` plus resolved icons). */
export interface ServerCollection {
  id: string;
  name: string;
  icon_ids?: number[];
  [key: string]: unknown;
}

/** Server history rows. */
export interface ServerHistoryEntry {
  icon_id: number;
  action: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ServerPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Build the client catalog from Inertia props and hydrate the store slices
 * derived from the server (library data, server page/tree truth).
 *
 * Filter state is owned by `useInertiaFilters`, not here: seeding filters
 * from every prop update would clobber in-flight edits.
 */
export function useInertiaCatalog(opts: {
  icons: ServerIcon[];
  packages: ServerPackage[];
  total: number;
  pagination?: ServerPagination | null;
  tree?: CategoryGroup[] | null;
  favorites?: IconId[] | null;
  collections?: ServerCollection[] | null;
  history?: ServerHistoryEntry[] | null;
}): Catalog {
  const catalog = useMemo(
    () => propsToCatalog(opts.icons, opts.packages, opts.total),
    // New array identities per visit; stable across renders of one visit.
    [opts.icons, opts.packages, opts.total],
  );

  useEffect(() => {
    const set = useStore.setState;

    if (opts.pagination) {
      const p = opts.pagination;
      set({
        serverPage: {
          total: p.total,
          page: p.current_page,
          perPage: p.per_page,
          lastPage: p.last_page,
          rangeStart: p.from ?? 0,
          rangeEnd: p.to ?? 0,
        },
      });
    }

    if (opts.tree) set({ serverTree: opts.tree });
    if (opts.favorites) set({ favorites: opts.favorites.map(Number) });

    if (opts.collections) {
      const collections: Collection[] = opts.collections.map((c) => ({
        id: String(c.id),
        name: String(c.name ?? ''),
        icons: (c.icon_ids ?? []).map(Number),
      }));
      set({ collections });
    }

    if (opts.history) {
      const history: HistoryEntry[] = opts.history.map((h) => ({
        id: Number(h.icon_id),
        action: String(h.action ?? 'view'),
        ts: h.timestamp ? Date.parse(h.timestamp) || Date.now() : Date.now(),
      }));
      set({ history });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on visit payload
  }, [catalog]);

  return catalog;
}
