import type { StyleObject } from './types';
import type { Treatment } from './types';

/**
 * TreatmentEngine — the single source of the live-restyle CSS (plan §B: make the
 * treatment control actually take effect). Given a mask URL it returns the style
 * for a monochrome element painted with the current colour and treatment:
 *   default  → plain currentColor silhouette
 *   solid    → thickened fill (stacked drop-shadows)
 *   duotone  → accent body with an offset foreground ghost
 *   midtone  → 50% weight
 *   halftone → dotted radial shade
 * Shared by the browser grid/detail and the landing playground (DRY).
 */
export function maskBase(url: string, size: number): StyleObject {
  return {
    display: 'inline-block',
    width: size,
    height: size,
    maskImage: `url("${url}")`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: `url("${url}")`,
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
  };
}

export function treatmentMaskStyle(url: string, size: number, color: string, treatment: Treatment): StyleObject {
  const base = maskBase(url, size);
  switch (treatment) {
    case 'solid':
      return { ...base, backgroundColor: color, filter: 'drop-shadow(0 0 .6px currentColor) drop-shadow(0 0 .6px currentColor) drop-shadow(0 0 .6px currentColor)' };
    case 'duotone':
      return { ...base, backgroundColor: 'var(--accent)', filter: 'drop-shadow(1.5px 1.5px 0 var(--fg))' };
    case 'midtone':
      return { ...base, backgroundColor: color, opacity: 0.5 };
    case 'halftone':
      return { ...base, backgroundColor: 'transparent', backgroundImage: 'radial-gradient(currentColor 42%, transparent 44%)', backgroundSize: '3px 3px', color };
    default:
      return { ...base, backgroundColor: color };
  }
}

/** CSS applied to an INLINE svg element (stroke path) for the same treatments. */
export function treatmentInlineStyle(treatment: Treatment): StyleObject {
  switch (treatment) {
    case 'midtone':
      return { opacity: 0.5 };
    case 'duotone':
      return { filter: 'drop-shadow(1.5px 1.5px 0 var(--fg))' };
    case 'solid':
      return { filter: 'drop-shadow(0 0 .4px currentColor) drop-shadow(0 0 .4px currentColor)' };
    default:
      return {};
  }
}
