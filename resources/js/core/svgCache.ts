import { assetUrl } from './SvgFidelity';
import { sanitizeSvg } from './sanitizeSvg';
import type { Icon } from './model';

export interface SvgParts {
  body: string; // inner markup (no outer <svg>)
  viewBox: string;
}

const cache = new Map<string, SvgParts>();
const pending = new Map<string, Promise<SvgParts>>();

function parse(raw: string, fallbackViewBox: string): SvgParts {
  const svg = sanitizeSvg(raw);
  const viewBox = /viewBox\s*=\s*"([^"]+)"/i.exec(svg)?.[1] ?? fallbackViewBox;
  const open = svg.indexOf('>', svg.indexOf('<svg'));
  const close = svg.lastIndexOf('</svg>');
  let body = open >= 0 && close > open ? svg.slice(open + 1, close) : svg;
  // drop the decorative tabler bounding rect so recolouring is clean
  body = body.replace(/<path\s+stroke="none"[^>]*fill="none"[^>]*><\/path>/gi, '').replace(/<path\s+stroke="none"[^>]*fill="none"[^>]*\/>/gi, '');
  return { body: body.trim(), viewBox };
}

/** Fetch (or read inline) an icon's SVG parts, cached by URL. */
export function getSvgParts(icon: Icon): SvgParts | Promise<SvgParts> {
  if (icon.svgContent) return parse(icon.svgContent, icon.viewBox);
  const url = assetUrl(icon.svgUrl ?? '');
  if (!url) return { body: '', viewBox: icon.viewBox };
  const hit = cache.get(url);
  if (hit) return hit;
  const inflight = pending.get(url);
  if (inflight) return inflight;
  const p = fetch(url)
    .then((r) => r.text())
    .then((t) => {
      const parts = parse(t, icon.viewBox);
      cache.set(url, parts);
      pending.delete(url);
      return parts;
    })
    .catch(() => {
      const empty = { body: '', viewBox: icon.viewBox };
      cache.set(url, empty);
      pending.delete(url);
      return empty;
    });
  pending.set(url, p);
  return p;
}
