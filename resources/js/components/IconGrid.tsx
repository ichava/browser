import { Link } from '@inertiajs/react';
import { IconAsset } from '@/components/ui/IconAsset';
import type { Icon } from '@/core/model';

/**
 * Simple read-only icon grid for library pages (favorites, collections,
 * history). The full browser shell owns its own grid; this is intentionally
 * dumb: normalize upstream, link to the detail page.
 */
export function IconGrid({ icons, showBase, emptyHint }: { icons: Icon[]; showBase: string; emptyHint: string }) {
  if (icons.length === 0) {
    return <p className="theme-text-muted mt-8 text-sm">{emptyHint}</p>;
  }

  return (
    <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
      {icons.map((icon) => (
        <Link
          key={icon.id}
          href={`${showBase}/${icon.id}`}
          className="theme-bg-card theme-bg-card-hover rounded-lg border theme-border flex flex-col items-center gap-1 p-3 theme-transition"
        >
          <IconAsset icon={icon} size={32} />
          <span className="theme-text-muted w-full truncate text-center text-[11px]">{icon.name}</span>
        </Link>
      ))}
    </div>
  );
}
