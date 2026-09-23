import { Link, usePage } from '@inertiajs/react';
import { FlashBanner } from '@/components/FlashBanner';
import type { SharedProps } from '@/types';

interface TermRow {
  id: number | string;
  name: string;
  slug: string;
  icon_count: number;
}

interface PackageDetail {
  name: string;
  label: string;
  description: string;
  vendor: string;
  icon_count: number;
  categories: TermRow[];
  variants: TermRow[];
}

interface PackagesShowProps extends SharedProps {
  package: PackageDetail | null;
}

export default function PackagesShow() {
  const { props } = usePage<PackagesShowProps>();
  const pkg = props.package;

  if (!pkg) {
    return (
      <div className="theme-bg-page theme-text-primary min-h-screen p-8">
        <p className="theme-text-muted text-sm">Package not found.</p>
      </div>
    );
  }

  const browsePackage = `${props.ichava.routes.browser}?packages[]=${encodeURIComponent(pkg.name)}`;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <Link href={props.ichava.routes.packages} className="theme-text-accent text-sm hover:underline">
          ← All packages
        </Link>

        <FlashBanner />

        <h1 className="mt-2 text-2xl font-semibold">{pkg.label || pkg.name}</h1>
        <p className="theme-text-muted mt-0.5 font-mono text-xs">{pkg.name}</p>
        {pkg.description && <p className="theme-text-secondary mt-2 text-sm">{pkg.description}</p>}
        <p className="mt-2 text-sm">
          <span className="theme-text-accent font-medium">{pkg.icon_count} icons</span>
          {' · '}
          <a href={browsePackage} className="theme-text-accent hover:underline">
            Browse this package →
          </a>
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold">Categories ({pkg.categories.length})</h2>
            <ul className="mt-3 space-y-1.5">
              {pkg.categories.map((cat) => (
                <li key={cat.id} className="theme-text-secondary flex items-center justify-between text-sm">
                  <span>{cat.name}</span>
                  <span className="theme-text-muted font-mono text-xs">{cat.icon_count}</span>
                </li>
              ))}
            </ul>
            {pkg.categories.length === 0 && <p className="theme-text-muted text-sm">No categories.</p>}
          </section>

          <section>
            <h2 className="text-lg font-semibold">Variants ({pkg.variants.length})</h2>
            <ul className="mt-3 space-y-1.5">
              {pkg.variants.map((variant) => (
                <li key={variant.id} className="theme-text-secondary flex items-center justify-between text-sm">
                  <span>{variant.name}</span>
                  <span className="theme-text-muted font-mono text-xs">{variant.icon_count}</span>
                </li>
              ))}
            </ul>
            {pkg.variants.length === 0 && <p className="theme-text-muted text-sm">No variants.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
