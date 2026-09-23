import { usePage } from '@inertiajs/react';
import { IchavaBrowser } from '@js/IchavaBrowser';
import { FlashToasts } from '@js/components/FlashToasts';
import {
  useInertiaCatalog,
  type ServerCollection,
  type ServerHistoryEntry,
  type ServerPagination,
} from '@js/hooks/useInertiaCatalog';
import { useFilterSync, type AppliedFilters } from '@js/hooks/useFilterSync';
import type { ServerIcon, ServerPackage } from '@js/core/propsToCatalog';
import type { CategoryGroup } from '@js/core/IconRepository';
import type { IconId } from '@js/core/model';
import type { SharedProps } from '@js/types';

interface BrowserIndexProps extends SharedProps {
  icons: ServerIcon[];
  pagination: ServerPagination;
  appliedFilters: AppliedFilters;
  tree: CategoryGroup[];
  packages: ServerPackage[];
  favorites: IconId[];
  collections: ServerCollection[];
  history: ServerHistoryEntry[];
}

export default function BrowserIndex() {
  const { props } = usePage<BrowserIndexProps>();

  const catalog = useInertiaCatalog({
    icons: props.icons,
    packages: props.packages,
    total: props.pagination.total,
    pagination: props.pagination,
    tree: props.tree,
    favorites: props.favorites,
    collections: props.collections,
    history: props.history,
  });

  useFilterSync(window.location.pathname, props.appliedFilters);

  return (
    <>
      <FlashToasts />
      <IchavaBrowser catalog={catalog} manageDocument />
    </>
  );
}
