// The typed data boundary. One adapter implements the `IconCatalog` port:
// `StaticCatalog` (an in-memory catalog — tests, fixtures, and Inertia pages,
// which build a `Catalog` from server props). Components never see this; the
// app wires it via hooks. Server data arrives as Inertia props, never over REST.

import { IconRepository } from '../IconRepository';
import type { Catalog, CategoryGroup } from '../IconRepository';
import { toIcon, type Filters, type Icon, type IconId, type ListParams, type PageResult } from '../model';

// Re-exported so existing consumers keep importing it from here; it is DECLARED in model.
export type { ListParams };


/** The port every consumer talks to, regardless of data source. */
export interface IconCatalog {
  listIcons(params: ListParams, signal?: AbortSignal): Promise<PageResult<Icon>>;
  getIcon(id: IconId, signal?: AbortSignal): Promise<Icon | null>;
  getSvg(icon: Icon, signal?: AbortSignal): Promise<string>;
  getFilters(signal?: AbortSignal): Promise<Filters>;
  getStatistics(signal?: AbortSignal): Promise<Record<string, unknown>>;
  /**
   * Package -> category -> subcategory tree, over the WHOLE corpus -- neither
   * adapter narrows this by the active filters. `StaticCatalog.getTree()` calls
   * `IconRepository.categoryTree()` with empty params, same as `RestCatalog`'s
   * unfiltered `/icons/tree` call; a live-filtered tree in static mode comes
   * from calling `IconRepository.categoryTree(params)` directly, which is what
   * `useRepo.ts` does instead of going through this port. REST mode has no
   * such bypass, so its callers are stuck with the unfiltered tree this method
   * returns. Making the REST endpoint filter-aware is real backend work
   * (closer to R-P13's "search mirrored server-side" than to Laravel wiring)
   * and is deliberately out of scope here.
   */
  getTree(signal?: AbortSignal): Promise<CategoryGroup[]>;
  /** Up to `limit` other icons sharing this icon's category, excluding itself. */
  getRelated(icon: Icon, limit?: number, signal?: AbortSignal): Promise<Icon[]>;
  /**
   * Variant term counts.
   *
   * The static adapter mirrors `IconRepository.variantCounts`, scoped to the
   * current package/search selection (ignoring category/variant, same as the
   * tree). The REST adapter has no scoped equivalent to call -- `getFilters()`
   * is the only counted-variants endpoint, and its counts are corpus-wide, not
   * scoped to the active filters. Returned anyway, labelled by its real scope
   * rather than silently pretending to match static mode.
   */
  getVariantCounts(params: ListParams, signal?: AbortSignal): Promise<Map<string, number>>;
}

// ── Static adapter: a bundled catalog, filtered/sorted/paginated client-side ──
export class StaticCatalog implements IconCatalog {
  private readonly repo: IconRepository;
  constructor(private readonly catalog: Catalog) {
    this.repo = new IconRepository(catalog);
  }
  async listIcons(params: ListParams): Promise<PageResult<Icon>> {
    return this.repo.page(params);
  }
  async getIcon(id: IconId): Promise<Icon | null> {
    return this.repo.byId(id) ?? null;
  }
  async getSvg(icon: Icon, signal?: AbortSignal): Promise<string> {
    if (icon.svgContent) return icon.svgContent;
    if (icon.svgUrl) {
      const res = await fetch(icon.svgUrl, { signal });
      if (res.ok) return res.text();
      return '';
    }
    return '';
  }
  async getFilters(): Promise<Filters> {
    return this.repo.filters();
  }
  async getStatistics(): Promise<Record<string, unknown>> {
    return this.catalog.meta as unknown as Record<string, unknown>;
  }
  async getTree(): Promise<CategoryGroup[]> {
    // Static mode has the whole catalog in memory, so the tree stays filter-aware
    // -- unlike REST mode, it costs nothing to recompute per call. `undefined`
    // params intentionally mirror the "no active filter" default; callers that
    // want the live-filtered tree should keep using `IconRepository` directly, as
    // `useRepo` does today.
    return this.repo.categoryTree({ search: '', packages: [], categories: [], variants: [], page: 1, perPage: 0, sortBy: 'name', sortDirection: 'asc' });
  }
  async getRelated(icon: Icon, limit = 6): Promise<Icon[]> {
    return this.repo.related(icon, limit);
  }
  async getVariantCounts(params: ListParams): Promise<Map<string, number>> {
    return this.repo.variantCounts(params);
  }
}

export function buildQuery(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(`${k}[]`, String(x)));
    else sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function createCatalog(catalog: Catalog): IconCatalog {
  return new StaticCatalog(catalog);
}
