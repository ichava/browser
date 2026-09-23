import { usePage } from '@inertiajs/react';

interface Props {
  package: { name: string; label: string; icon_count: number } | null;
  [key: string]: unknown;
}

export default function PackagesShow() {
  const { package: pkg } = usePage<Props>().props;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — Packages/Show</p>
      <h1 className="mt-1 text-2xl font-semibold">{pkg?.label ?? pkg?.name ?? 'Package'}</h1>
      <p className="theme-text-secondary mt-1 text-sm">{pkg?.icon_count ?? '—'} icons</p>
    </div>
  );
}
