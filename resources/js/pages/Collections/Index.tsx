import { usePage } from '@inertiajs/react';

interface Props {
  collections: Array<{ id: string; name: string }>;
  [key: string]: unknown;
}

export default function CollectionsIndex() {
  const { collections } = usePage<Props>().props;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — Collections/Index</p>
      <h1 className="mt-1 text-2xl font-semibold">Collections ({collections.length})</h1>
    </div>
  );
}
