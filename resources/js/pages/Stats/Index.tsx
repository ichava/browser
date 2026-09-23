import { usePage } from '@inertiajs/react';

interface Props {
  statistics: Record<string, number> | null;
  packageStats: Array<{ name: string; icon_count: number }>;
  [key: string]: unknown;
}

export default function StatsIndex() {
  const { statistics, packageStats } = usePage<Props>().props;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — Stats/Index</p>
      <h1 className="mt-1 text-2xl font-semibold">Statistics</h1>
      <p className="theme-text-secondary mt-1 text-sm">
        {statistics?.total_icons ?? '—'} icons across {packageStats.length} packages
      </p>
    </div>
  );
}
