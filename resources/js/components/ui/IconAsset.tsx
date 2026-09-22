import { useEffect, useState } from 'react';
import { fidelity } from '@js/core/SvgFidelity';
import { getSvgParts, type SvgParts } from '@js/core/svgCache';
import { treatmentInlineStyle, treatmentMaskStyle } from '@js/core/TreatmentEngine';
import type { Icon } from '@js/core/model';
import { useAppStore } from '@js/hooks/useStoreApi';

const DEFAULT_STROKE = 1.5;

/**
 * IconAsset — renders a catalog icon, honoring the live preview color, treatment
 * and grid stroke (plan §B). Three paths, decided per icon:
 *   own-colour → image (untouched)
 *   stroke slider moved → INLINE svg with the exact stroke-width rewritten
 *   otherwise → fast CSS mask + treatment styling
 */
export function IconAsset({ icon, size, color, stroke, inline }: { icon: Icon; size: number; color?: string | null; stroke?: number; inline?: boolean }) {
  const previewColor = useAppStore((s) => s.color);
  const treatment = useAppStore((s) => s.treatment);
  const gridStroke = useAppStore((s) => s.gridStroke);
  const c = (color !== undefined ? color : previewColor) ?? 'currentColor';
  const effStroke = stroke ?? gridStroke;

  const strokeActive = icon.variant === 'outline' && Math.abs(effStroke - DEFAULT_STROKE) > 0.01;

  // Own-colour icons keep their own fills. Authored multicolor/illustration icons
  // (inline svgContent) render inline so they stay crisp + animatable; URL-only
  // own-colour assets (flags/emoji packs) keep the fast image path for perf.
  if (icon.ownColor) {
    if (icon.svgContent || inline) return <InlineColorIcon icon={icon} size={size} />;
    const strategy = fidelity.resolve(icon, null);
    return <span aria-hidden style={{ display: 'inline-block', ...fidelity.toStyle(strategy, size) }} />;
  }
  // `inline` forces the highest-fidelity path (detail preview): the raw SVG with
  // stroke/color applied natively so size/stroke/treatment IMPROVE the icon rather
  // than rasterising a mask. The grid stays on the fast mask unless the stroke moves.
  if (inline || strokeActive) {
    return <InlineIcon icon={icon} size={size} color={c} stroke={effStroke} />;
  }
  const url = fidelity.resolve(icon, c).url;
  return <span aria-hidden style={treatmentMaskStyle(url, size, c, treatment)} />;
}

/** Inline multicolor render path — preserves the icon's own fills (crisp + animatable). */
function InlineColorIcon({ icon, size }: { icon: Icon; size: number }) {
  const [parts, setParts] = useState<SvgParts | null>(() => {
    const r = getSvgParts(icon);
    return r instanceof Promise ? null : r;
  });
  useEffect(() => {
    let alive = true;
    const r = getSvgParts(icon);
    if (r instanceof Promise) r.then((p) => alive && setParts(p));
    else setParts(r);
    return () => { alive = false; };
  }, [icon]);
  if (!parts) return <span aria-hidden style={{ display: 'inline-block', width: size, height: size }} />;
  return (
    <svg
      aria-hidden
      data-ichava-illustration={icon.kind === 'illustration' ? '' : undefined}
      width={size}
      height={size}
      viewBox={parts.viewBox} className="inline-block"
      dangerouslySetInnerHTML={{ __html: parts.body }}
    />
  );
}

/** Inline SVG render path — the only way stroke-width can vary on-screen. */
function InlineIcon({ icon, size, color, stroke }: { icon: Icon; size: number; color: string; stroke: number }) {
  const treatment = useAppStore((s) => s.treatment);
  const [parts, setParts] = useState<SvgParts | null>(() => {
    const r = getSvgParts(icon);
    return r instanceof Promise ? null : r;
  });

  useEffect(() => {
    let alive = true;
    const r = getSvgParts(icon);
    if (r instanceof Promise) r.then((p) => alive && setParts(p));
    else setParts(r);
    return () => {
      alive = false;
    };
  }, [icon]);

  if (!parts) return <span aria-hidden style={{ display: 'inline-block', width: size, height: size }} />;
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={parts.viewBox}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', ...treatmentInlineStyle(treatment) }}
      dangerouslySetInnerHTML={{ __html: parts.body }}
    />
  );
}
