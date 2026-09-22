// Canonical data model — mirrors the Laravel `IconResource` + API envelope
// (plan C1). The app works in camelCase `Icon`; the REST adapter maps the
// snake_case `RawIcon` the server emits. IDs are NUMERIC DB keys (plan C18).

export type IconId = number;
export type IconVariant = string; // "outline" | "filled" | "color" | pack-defined slug
export type IconKind = 'icon' | 'illustration';

/** Exactly what `IconResource` serializes (snake_case), the REST wire shape. */
export interface RawIcon {
  id: number;
  package: string; // "ichava/tabler-icons"
  name: string;
  category: string; // slug
  sub?: string; // subcategory slug (unique within its category), optional
  variant: string; // slug
  kind?: IconKind; // "icon" (default) | "illustration"
  path?: string;
  icon_path?: string;
  file_path?: string;
  svg_content?: string | null;
  svg_url?: string; // relative route to /icons/{id}/svg
  viewbox?: string;
  width?: number | string | null;
  height?: number | string | null;
  blade_clean?: string;
  blade_generic?: string;
  helper?: string;
  set?: string;
  tags?: string[];
  keywords?: string[];
  created_at?: string;
  updated_at?: string;
}

/** App-side icon (camelCase). Server-generated snippet strings are carried through. */
export interface Icon {
  id: IconId;
  package: string;
  name: string;
  category: string;
  sub?: string;
  variant: IconVariant;
  kind?: IconKind;
  svgContent: string | null;
  svgUrl: string | null;
  viewBox: string;
  bladeClean: string;
  bladeGeneric: string;
  helper: string;
  tags: string[];
  keywords: string[];
  /** SVG fidelity flag: own-colour icons (flags/emoji) render untouched. */
  ownColor: boolean;
}

export interface IconPackage {
  id: string; // "ichava/tabler-icons"
  label: string; // "tabler-icons"
  description?: string;
  count: number;
  installed: boolean;
  loaded: boolean;
}

/** terms/categories + terms/variants rows: `name` is the slug, `label` the display. */
export interface Term {
  id: number | string;
  name: string; // slug
  label: string; // human name
  package?: string;
  count: number;
  sub?: string;
}

/** Bare `filters` response: `{packages, categories, variants}`. */
export interface Filters {
  packages: IconPackage[];
  categories: Term[];
  variants: Term[];
}

export interface PageMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number;
  to: number;
  groupBy?: string | null;
}

/** Standard success envelope `{success, data, message, meta?}`. */
export interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: Record<string, unknown>;
}

/** Normalized page result the UI consumes (adapter output). */
export interface PageResult<T = Icon> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  rangeStart: number;
  rangeEnd: number;
}

/** Detect own-colour SVGs (flags/emoji) so fidelity renders them untouched. */
export function svgHasOwnColors(svg: string | null | undefined): boolean {
  if (!svg) return false;
  // any fill/stroke/stop-color that is a concrete colour (not none/currentColor)
  return /(?:fill|stroke|stop-color)\s*=\s*"(?!(?:none|currentColor|transparent)\b)#?[0-9a-zA-Z(),.%\s]+"/.test(svg);
}

/** Map the wire `RawIcon` → app `Icon`. Envelope quirks live in the adapter. */
export function toIcon(raw: RawIcon): Icon {
  return {
    id: raw.id,
    package: raw.package,
    name: raw.name,
    category: raw.category,
    sub: raw.sub,
    variant: raw.variant ?? 'outline',
    kind: raw.kind ?? 'icon',
    svgContent: raw.svg_content ?? null,
    svgUrl: raw.svg_url ?? null,
    viewBox: raw.viewbox ?? '0 0 24 24',
    bladeClean: raw.blade_clean ?? '',
    bladeGeneric: raw.blade_generic ?? '',
    helper: raw.helper ?? '',
    tags: raw.tags ?? [],
    keywords: raw.keywords ?? [],
    ownColor: svgHasOwnColors(raw.svg_content),
  };
}

/**
 * The query shape every catalog source accepts.
 *
 * Declared here rather than in `api/ApiClient` because it is not an API-client
 * concern: `IconRepository` filters a bundled catalog with the same parameters,
 * so both static and REST paths agree by construction. Keeping it in the client
 * created a dependency cycle -- IconRepository imported the type from ApiClient
 * while ApiClient imported IconRepository -- which made the layering unprovable.
 */
export interface ListParams {
  search?: string;
  packages?: string[];
  categories?: string[];
  subs?: string[];
  variants?: string[];
  page?: number;
  perPage?: number;
  sortBy?: 'name' | 'package' | 'category' | 'created_at';
  sortDirection?: 'asc' | 'desc';
}
