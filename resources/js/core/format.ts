// Small pure helpers shared across the UI. No React, no side effects.

export const num = (n: number): string => n.toLocaleString('en-US');

/** Platform-aware modifier key label (⌘ on Apple, Ctrl+ elsewhere). */
export function modKey(): string {
  if (typeof navigator === 'undefined') return 'Ctrl+';
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform) ? '⌘' : 'Ctrl+';
}

export function relativeTime(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

/** hue (0–360) + lightness (0–100) → hex, fixed saturation for the picker gradient. */
export function hslToHex(h: number, l: number, s = 62): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function isValidHex(v: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(v.trim());
}

/** Append an 0–100 alpha percentage to a 6-digit hex as an 8-digit hex. */
export function hexWithAlpha(hex: string, alphaPct: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const a = Math.round((Math.max(0, Math.min(100, alphaPct)) / 100) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/** Fallback accent, used when a caller-supplied hex cannot be parsed. */
export const FALLBACK_ACCENT_RGB = '124,58,237';

/**
 * Convert a 6-digit hex to `rgba()` at the given 0–1 alpha.
 * Falls back to the brand accent when the input is not a 6-digit hex, so a
 * malformed user-picked colour degrades to a readable default rather than an
 * invalid CSS value.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(${FALLBACK_ACCENT_RGB},${alpha})`;
  const n = parseInt(m[1]!, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/* ------------------------------------------------------------------------- *
 * Contrast
 *
 * The accent is a *user-chosen* colour used both as a solid fill and as text.
 * Those two uses have opposite requirements: a fill wants the colour as picked,
 * while text has to stay legible against whichever theme is active. The default
 * accent `#7c3aed` measures 3.47:1 on the dark background -- below the 4.5:1 the
 * WCAG AA body-text threshold asks for -- so accent-coloured labels were failing
 * in dark mode for every accent in the palette, not just custom ones.
 *
 * Untitled UI solves this with separate `text-brand-*` tokens that swap per
 * theme (in dark they leave the brand hue entirely and go neutral). That works
 * for a fixed brand, but this product lets the user pick any hex, so the safe
 * variant has to be derived rather than looked up.
 * ------------------------------------------------------------------------- */

type Rgb = { r: number; g: number; b: number };

function parseHex(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

const toHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;

/** Relative luminance per WCAG 2.x. */
function luminance({ r, g, b }: Rgb): number {
  const ch = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

/** WCAG contrast ratio between two colours, 1–21. Order does not matter. */
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [parseHex(a), parseHex(b)];
  if (!x || !y) return 1;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Mix towards white (`t > 0`) or black (`t < 0`) by fraction `|t|`. */
function towards({ r, g, b }: Rgb, t: number): Rgb {
  const target = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  return { r: r + (target - r) * k, g: g + (target - g) * k, b: b + (target - b) * k };
}

/**
 * Nudge `hex` towards white or black -- whichever direction the background is
 * *not* -- until it clears `target` contrast against `bg`.
 *
 * Hue and saturation are preserved as far as possible: the colour is mixed
 * along the lightness axis in sRGB rather than being replaced, so a purple
 * accent stays recognisably purple instead of collapsing to grey. Steps are
 * small (2%) so the result is the *least* adjusted colour that passes, and the
 * loop is bounded, returning the best attempt rather than looping forever on an
 * impossible target.
 */
export function readableOn(hex: string, bg: string, target = 4.5): string {
  const base = parseHex(hex);
  const back = parseHex(bg);
  if (!base || !back) return hex;
  if (contrastRatio(hex, bg) >= target) return hex;

  // Lighten on dark backgrounds, darken on light ones.
  const dir = luminance(back) < 0.5 ? 1 : -1;
  let best = hex;
  let bestRatio = contrastRatio(hex, bg);
  for (let t = 0.02; t <= 1; t += 0.02) {
    const candidate = toHex(towards(base, dir * t));
    const ratio = contrastRatio(candidate, bg);
    if (ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
    if (ratio >= target) return candidate;
  }
  return best;
}
