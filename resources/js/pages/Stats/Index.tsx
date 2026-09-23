import { usePage } from '@inertiajs/react';
import { FlashBanner } from '@js/components/FlashBanner';
import { useInertiaMutations } from '@js/hooks/useInertiaMutations';
import type { SharedProps } from '@js/types';

interface PackageStat {
  name: string;
  label: string;
  description: string;
  vendor: string;
  icon_count: number;
  category_count: number;
  variant_count: number;
}

interface TopCategory {
  name: string;
  slug: string;
  package: string;
  icon_count: number;
}

interface UpdateRow {
  package?: string;
  current?: string;
  latest?: string;
  status?: string;
}

interface StatsIndexProps extends SharedProps {
  statistics: {
    total_icons: number;
    total_packages: number;
    total_categories: number;
    total_variants: number;
  } | null;
  packageStats: PackageStat[];
  topCategories: TopCategory[];
  cacheStats: Record<string, unknown>;
  cacheHealthy: boolean;
  updateStatus: { rows?: UpdateRow[] } | UpdateRow[] | null;
}

export default function StatsIndex() {
  const { props } = usePage<StatsIndexProps>();
  const { clearCache, rebuildCache } = useInertiaMutations();
  const stats = props.statistics;
  const updateRows: UpdateRow[] = Array.isArray(props.updateStatus)
    ? props.updateStatus
    : (props.updateStatus?.rows ?? []);

  const cards: Array<[string, number | string]> = [
    ['Icons', stats?.total_icons ?? '—'],
    ['Packages', stats?.total_packages ?? '—'],
    ['Categories', stats?.total_categories ?? '—'],
    ['Variants', stats?.total_variants ?? '—'],
  ];

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <p className="theme-text-muted text-xs uppercase">Dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold">Statistics</h1>

        <FlashBanner />

        <dl className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="theme-bg-card rounded-lg border theme-border p-4">
              <dt className="theme-text-muted text-xs uppercase">{label}</dt>
              <dd className="text-xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold">Packages ({props.packageStats.length})</h2>
            <ul className="mt-3 space-y-2">
              {props.packageStats.map((pkg) => (
                <li key={pkg.name} className="theme-bg-card rounded-lg border theme-border px-4 py-3">
                  <p className="font-medium text-sm">{pkg.label || pkg.name}</p>
                  <p className="theme-text-muted mt-0.5 font-mono text-[11px]">
                    {pkg.icon_count} icons · {pkg.category_count} categories · {pkg.variant_count} variants
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold">Top categories</h2>
              <ul className="mt-3 space-y-1.5">
                {props.topCategories.map((cat) => (
                  <li key={`${cat.package}/${cat.slug}`} className="theme-text-secondary flex items-center justify-between text-sm">
                    <span>{cat.name}</span>
                    <span className="theme-text-muted font-mono text-xs">{cat.icon_count}</span>
                  </li>
                ))}
              </ul>
              {props.topCategories.length === 0 && <p className="theme-text-muted text-sm">None yet.</p>}
            </section>

            <section>
              <h2 className="text-lg font-semibold">Cache</h2>
              <p className="mt-2 text-sm">
                <span className={`font-medium ${props.cacheHealthy ? 'text-green-400' : 'text-red-400'}`}>
                  {props.cacheHealthy ? 'Healthy' : 'Unhealthy'}
                </span>
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={clearCache}
                  className="theme-bg-muted theme-text-secondary rounded-md px-3 py-1.5 text-xs font-medium"
                >
                  Clear cache
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Rebuild the icon cache? Stored preferences will be reset.')) rebuildCache();
                  }}
                  className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-400"
                >
                  Rebuild cache
                </button>
              </div>
            </section>

            {updateRows.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold">Pack updates</h2>
                <ul className="mt-3 space-y-1.5">
                  {updateRows.map((row, i) => (
                    <li key={`${row.package ?? 'pack'}-${i}`} className="theme-text-secondary flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{row.package ?? 'unknown'}</span>
                      <span className="theme-text-muted font-mono text-xs">
                        {row.current ?? '?'} → {row.latest ?? '?'} · {row.status ?? '?'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
