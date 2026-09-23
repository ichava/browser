import { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { IconGrid } from '@js/components/IconGrid';
import { FlashBanner } from '@js/components/FlashBanner';
import { normalizeRawIcon } from '@js/core/propsToCatalog';
import { toIcon, type RawIcon } from '@js/core/model';
import type { SharedProps } from '@js/types';

interface CollectionDetail {
  id: string;
  name: string;
  icons: RawIcon[];
}

interface CollectionsShowProps extends SharedProps {
  collection: CollectionDetail | null;
}

export default function CollectionsShow() {
  const { props } = usePage<CollectionsShowProps>();
  const collection = props.collection;

  const icons = useMemo(
    () => (collection?.icons ?? []).map((r) => toIcon(normalizeRawIcon(r))),
    [collection],
  );
  const showBase = `/${props.ichava.prefix}/icons`;

  if (!collection) {
    return (
      <div className="theme-bg-page theme-text-primary min-h-screen p-8">
        <p className="theme-text-muted text-sm">Collection not found.</p>
      </div>
    );
  }

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <Link href={props.ichava.routes.collections} className="theme-text-accent text-sm hover:underline">
          ← All collections
        </Link>

        <FlashBanner />

        <h1 className="mt-2 text-2xl font-semibold">{collection.name}</h1>
        <p className="theme-text-secondary mt-1 text-sm">
          {icons.length} icon{icons.length === 1 ? '' : 's'}
        </p>

        <IconGrid icons={icons} showBase={showBase} emptyHint="This collection is empty." />
      </div>
    </div>
  );
}
