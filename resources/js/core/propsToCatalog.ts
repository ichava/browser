import { toIcon, type IconPackage, type RawIcon } from '@/core/model';
import type { Catalog } from '@/core/IconRepository';

/**
 * The props → catalog bridge (Phase 3).
 *
 * Inertia pages receive icons as server-shaped arrays (`transformIcon` /
 * `IconResource` output, which matches `RawIcon` modulo nullability) and
 * build a client `Catalog` from them before rendering `<IchavaBrowser>`.
 * That keeps one uniform contract into `IconRepository`: filtering, tree,
 * related-icons and snippets all run client-side over the loaded set,
 * exactly as the static mode always did, with no component rewrites.
 */

/** Server icon rows: `RawIcon` except category/variant may arrive null. */
export type ServerIcon = Omit<RawIcon, 'category' | 'variant'> & {
  category?: string | null;
  variant?: string | null;
};

/** Server packages (`IconBrowserService::getFilters()` shape). */
export interface ServerPackage {
  name: string;
  label?: string;
  description?: string;
  count?: number;
  vendor?: string;
}

export function normalizeRawIcon(input: ServerIcon): RawIcon {
  return {
    ...input,
    category: input.category ?? '',
    variant: input.variant ?? 'outline',
  };
}

export function toIconPackage(pkg: ServerPackage): IconPackage {
  return {
    id: pkg.name,
    label: pkg.label ?? pkg.name,
    description: pkg.description ?? '',
    count: pkg.count ?? 0,
    installed: true,
    loaded: true,
  };
}

export function propsToCatalog(icons: ServerIcon[], packages: ServerPackage[], total: number): Catalog {
  return {
    meta: { total_ecosystem: total, generated: new Date().toISOString() },
    packages: packages.map(toIconPackage),
    icons: icons.map((raw) => toIcon(normalizeRawIcon(raw))),
  };
}
