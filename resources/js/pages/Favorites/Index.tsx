import { useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import { IconGrid } from '@/components/IconGrid';
import { FlashBanner } from '@/components/FlashBanner';
import { normalizeRawIcon } from '@/core/propsToCatalog';
import { toIcon, type RawIcon } from '@/core/model';
import type { SharedProps } from '@/types';

interface FavoritesIndexProps extends SharedProps {
  ids: number[];
  icons: RawIcon[];
  count: number;
}

export default function FavoritesIndex() {
  const { props } = usePage<FavoritesIndexProps>();

  const icons = useMemo(() => props.icons.map((r) => toIcon(normalizeRawIcon(r))), [props.icons]);
  const showBase = `/${props.ichava.prefix}/icons`;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <p className="theme-text-muted text-xs uppercase">Library</p>
        <h1 className="mt-1 text-2xl font-semibold">Favorites ({props.count})</h1>

        <FlashBanner />

        <IconGrid icons={icons} showBase={showBase} emptyHint="No favorites yet. Star icons from the browser to pin them here." />
      </div>
    </div>
  );
}
