import { usePage } from '@inertiajs/react';

interface Props {
  ids: number[];
  count: number;
  [key: string]: unknown;
}

export default function FavoritesIndex() {
  const { ids, count } = usePage<Props>().props;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — Favorites/Index</p>
      <h1 className="mt-1 text-2xl font-semibold">Favorites ({count})</h1>
      <p className="theme-text-secondary mt-1 text-sm">{ids.length} saved ids</p>
    </div>
  );
}
