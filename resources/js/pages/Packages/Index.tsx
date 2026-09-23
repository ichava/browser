import { Link, usePage } from '@inertiajs/react';
import { FlashBanner } from '@/components/FlashBanner';
import type { SharedProps } from '@/types';

interface ServerPackageRow {
  name: string;
  label: string;
  count: number;
  description: string;
  vendor: string;
}

interface PackagesIndexProps extends SharedProps {
  packages: ServerPackageRow[];
}

export default function PackagesIndex() {
  const { props } = usePage<PackagesIndexProps>();

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <p className="theme-text-muted text-xs uppercase">Icon packages</p>
        <h1 className="mt-1 text-2xl font-semibold">Packages ({props.packages.length})</h1>

        <FlashBanner />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {props.packages.map((pkg) => (
            <Link
              key={pkg.name}
              href={`${props.ichava.routes.packages}/${pkg.name}`}
              className="theme-bg-card theme-bg-card-hover rounded-xl border theme-border p-5 theme-transition"
            >
              <h2 className="font-semibold">{pkg.label || pkg.name}</h2>
              <p className="theme-text-muted mt-0.5 font-mono text-xs">{pkg.name}</p>
              {pkg.description && <p className="theme-text-secondary mt-2 text-sm">{pkg.description}</p>}
              <p className="theme-text-accent mt-3 text-sm font-medium">{pkg.count} icons</p>
            </Link>
          ))}
        </div>

        {props.packages.length === 0 && (
          <p className="theme-text-muted mt-8 text-sm">No icon packages registered.</p>
        )}
      </div>
    </div>
  );
}
