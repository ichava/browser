import { usePage } from '@inertiajs/react';

interface Props {
  collection: { id: string; name: string } | null;
  [key: string]: unknown;
}

export default function CollectionsShow() {
  const { collection } = usePage<Props>().props;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — Collections/Show</p>
      <h1 className="mt-1 text-2xl font-semibold">{collection?.name ?? 'Collection'}</h1>
    </div>
  );
}
