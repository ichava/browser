import { Link, usePage } from '@inertiajs/react';
import { FlashBanner } from '@/components/FlashBanner';
import type { SharedProps } from '@/types';

interface CollectionRow {
  id: string;
  name: string;
  icons: Array<{ id: number; name: string }>;
}

interface CollectionsIndexProps extends SharedProps {
  collections: CollectionRow[];
}

export default function CollectionsIndex() {
  const { props } = usePage<CollectionsIndexProps>();

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <p className="theme-text-muted text-xs uppercase">Library</p>
        <h1 className="mt-1 text-2xl font-semibold">Collections ({props.collections.length})</h1>

        <FlashBanner />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {props.collections.map((collection) => (
            <Link
              key={collection.id}
              href={`${props.ichava.routes.collections}/${collection.id}`}
              className="theme-bg-card theme-bg-card-hover rounded-xl border theme-border p-5 theme-transition"
            >
              <h2 className="font-semibold">{collection.name}</h2>
              <p className="theme-text-accent mt-2 text-sm font-medium">
                {collection.icons.length} icon{collection.icons.length === 1 ? '' : 's'}
              </p>
            </Link>
          ))}
        </div>

        {props.collections.length === 0 && (
          <p className="theme-text-muted mt-8 text-sm">
            No collections yet. Group icons into named sets from the browser.
          </p>
        )}
      </div>
    </div>
  );
}
