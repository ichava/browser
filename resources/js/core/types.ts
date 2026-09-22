// UI-level type surface. The data model is canonical in `model.ts`; this file
// re-exports it plus the small UI-only unions the components share. No `any`.

/**
 * A framework-agnostic inline-style object.
 *
 * `core/` must not import React, not even a type: `CSSProperties` in a return
 * type puts React into the public surface that a Vue or Blade consumer would
 * inherit. This is the plain equivalent. React accepts it when spread
 * (`style={{ ...styleObject }}`), Vue's `:style` binds it directly, and a Blade
 * serializer can walk it.
 *
 * Keys are camelCase CSS properties or `--custom-property` names; both are
 * string-keyed, which is why this is not narrowed further.
 */
export type StyleObject = Record<string, string | number | undefined>;

export type {
  Icon,
  IconId,
  IconPackage,
  RawIcon,
  Term,
  Filters,
  PageMeta,
  PageResult,
  Envelope,
} from './model';
export type { Catalog, CategoryGroup, CategoryNode, SubNode } from './IconRepository';
export type { ListParams } from './api/ApiClient';

export type ViewMode = 'grid' | 'list';
export type SortKey = 'name' | 'package' | 'category';
export type SortOrder = 'asc' | 'desc';
export type Theme = 'light' | 'dark';
export type SizeUnit = 'px' | 'rem' | 'em';
export type CopyFormat = 'svg' | 'helper' | 'blade' | 'vue' | 'react' | 'name';
export type Treatment = 'default' | 'solid' | 'duotone' | 'midtone' | 'halftone';
/** Icon-label scale (drives base font size). XS added for full appearance parity. */
export type Scale = 'xs' | 's' | 'm' | 'l';
export type Density = 'compact' | 'comfy';

/** How a given icon should be painted — the one decision the fidelity engine makes. */
export type RenderStrategy =
  | { kind: 'image'; url: string }
  | { kind: 'mask'; url: string; color: string };
