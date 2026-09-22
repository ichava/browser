// The three INDEPENDENT size axes (mirrors the DC reference):
//   uiScale  → whole-app zoom (fonts + all chrome) via root `zoom` + viewport comp
//   density  → ONLY the spacing between cards + list row height (never font/icon size)
//   iconSize → the glyph/preview size (toolbar slider; card box derives from it)

import type { Scale, Density } from './types';

/** uiScale → real zoom factor. Applied as `root.style.zoom` (not a font-size var). */
export const UI_SCALE_MAP: Record<Scale, number> = { xs: 0.85, s: 0.93, m: 1, l: 1.12 };

export interface DensityMetrics {
  /** grid gap (px) */
  gap: number;
  /** card inner padding budget added to the icon size for the tile box (px) */
  tilePad: number;
  /** list-view row height (px) */
  rowH: number;
}

/** density → spacing only. Verbatim from the DC: gap 8/14, tilePad 52/64, rowH 38/46. */
export function densityMetrics(density: Density): DensityMetrics {
  return density === 'comfy' ? { gap: 14, tilePad: 64, rowH: 46 } : { gap: 8, tilePad: 52, rowH: 38 };
}

/**
 * Smallest a grid cell may be, in px.
 *
 * This is the ONE number that the grid track, the virtualised grid track and the tile's
 * own `min-width` must agree on. They did not: the tile floored at 86 while the
 * non-virtualised grid floored at 72, so at small icon sizes the grid laid out 75px
 * columns that the tiles refused to fit into and they overlapped by ~3px — measured as an
 * observed gap of **-2.7px** against a declared 8px. That is why grid spacing appeared to
 * change with the icon-size slider when the gap itself never moved.
 *
 * Anything that lays out a tile must derive its minimum from here.
 */
export const TILE_MIN = 86;

/** The grid track minimum for a given icon size, never below `TILE_MIN`. */
export function tileMinWidth(iconSize: number, density: Density): number {
  return Math.max(TILE_MIN, iconSize + densityMetrics(density).tilePad);
}


/**
 * A pixel dimension expressed so it scales with the UI scale.
 *
 * The chrome is full of inline pixel literals -- `height: 48` on the header, `width: 248`
 * on the sidebar -- and a literal cannot respond to a scale setting. Emitting them as
 * `rem` makes them follow the root font size, which is what the scale actually changes.
 *
 * This is the alternative to CSS `zoom`, which was tried and reverted: zoom scales
 * everything but makes `getBoundingClientRect()` report visual coordinates while CSS
 * `left`/`top` stay in layout units, so react-aria positioned overlays in the wrong space
 * and dropdowns landed up to 186px away from their triggers.
 *
 * `--ich-rem` lets an EMBEDDED mount scale without touching the host document's root font
 * size; standalone leaves it unset and plain `rem` applies.
 */
export function rem(px: number): string {
  return `calc(${px / 16} * var(--ich-rem, 1rem))`;
}
