import type { StyleObject } from './types';
import type { Icon } from './model';
import type { RenderStrategy } from './types';

/** Resolve the public URL for an icon's asset (static mode: under public/). */
export function assetUrl(file: string): string {
  if (/^(https?:)?\//.test(file)) return file; // already absolute / rooted
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${file.replace(/^\//, '')}`;
}

/**
 * SvgFidelity — the single place that decides how an icon is painted.
 * Own-colour icons (flags/emoji) render untouched as an image; currentColor
 * icons render through a CSS mask so they stay themeable. `ownColor` is baked
 * into the icon data. Stateless, pure.
 */
export class SvgFidelity {
  /** The URL to paint from: prefer the API svg endpoint, else the static asset. */
  private url(icon: Icon): string {
    return assetUrl(icon.svgUrl ?? '');
  }

  resolve(icon: Icon, color: string | null): RenderStrategy {
    const url = this.url(icon);
    if (icon.ownColor) return { kind: 'image', url };
    return { kind: 'mask', url, color: color ?? 'currentColor' };
  }

  toStyle(s: RenderStrategy, size: number): StyleObject {
    const dim = { width: `${size}px`, height: `${size}px` };
    if (s.kind === 'image') {
      return {
        ...dim,
        backgroundImage: `url("${s.url}")`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      };
    }
    return {
      ...dim,
      backgroundColor: s.color,
      maskImage: `url("${s.url}")`,
      maskSize: 'contain',
      maskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskImage: `url("${s.url}")`,
      WebkitMaskSize: 'contain',
      WebkitMaskRepeat: 'no-repeat',
      WebkitMaskPosition: 'center',
    };
  }
}

export const fidelity = new SvgFidelity();
