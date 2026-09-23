import { usePage } from '@inertiajs/react';

interface Props {
  packages: Array<{ name: string; label: string; count: number }>;
  [key: string]: unknown;
}

export default function PackagesIndex() {
  const { packages } = usePage<Props>().props;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — Packages/Index</p>
      <h1 className="mt-1 text-2xl font-semibold">Packages ({packages.length})</h1>
    </div>
  );
}
