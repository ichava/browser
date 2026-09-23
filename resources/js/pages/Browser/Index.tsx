import { usePage } from '@inertiajs/react';
import { IchavaBrowser } from '@/IchavaBrowser';
import { FlashToasts } from '@/components/FlashToasts';
import {
  useInertiaCatalog,
  type ServerCollection,
  type ServerHistoryEntry,
  type ServerPagination,
} from '@/hooks/useInertiaCatalog';
import { useFilterSync, type AppliedFilters } from '@/hooks/useFilterSync';
import type { ServerIcon, ServerPackage } from '@/core/propsToCatalog';
import type { CategoryGroup } from '@/core/IconRepository';
import type { IconId } from '@/core/model';
import type { SharedProps } from '@/types';

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
