/**
 * Client-side SVG sanitisation.
 *
 * The server already sanitises SVG via SanitizesSvg trait + SvgProcessingService
 * before it ever leaves the API, so this is defense-in-depth: a second filter
 * at the v-html boundary protects against (a) intermediate caches that may have
 * been poisoned with pre-sanitiser SVG, (b) future regressions on the server
 * side, and (c) any direct DOM manipulation that bypasses Vue's escaping.
 *
 * Falls back to a no-op when DOMPurify is unavailable so an unbundled / dev
 * environment still renders icons; production should always have DOMPurify
 * via `npm install`.
 */

import DOMPurify from 'dompurify'

interface SanitizeOptions {
    /** Allow `<style>` tags (for icons that ship inline CSS) */
    allowStyle?: boolean
}

const SVG_TAG_ALLOWLIST = [
    'svg', 'g', 'defs', 'symbol', 'use',
    'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect',
    'linearGradient', 'radialGradient', 'stop',
    'clipPath', 'mask',
    'text', 'tspan', 'textPath',
    'title', 'desc',
] as const

const SVG_ATTR_ALLOWLIST = [
    'viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width',
    'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-opacity',
    'fill-rule', 'clip-rule', 'fill-opacity',
    'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2',
    'transform', 'opacity', 'points', 'offset', 'stop-color',
    'id', 'class', 'aria-label', 'aria-hidden', 'role',
    'preserveAspectRatio', 'xmlns', 'xmlns:xlink',
] as const

/**
 * Sanitise SVG markup for v-html rendering. Returns an empty string when the
 * input is not a string or DOMPurify rejects the content; callers should
 * treat empty output as "do not render".
 */
export function sanitizeSvg(input: unknown, opts: SanitizeOptions = {}): string {
    if (typeof input !== 'string' || input.length === 0) {
        return ''
    }

    // DOMPurify is a browser-only library (uses window.document). If it's
    // unavailable (SSR, missing install), fall back to a pass-through and
    // rely on server-side sanitisation. Log once in dev for visibility.
    if (typeof DOMPurify?.sanitize !== 'function') {
        // eslint-disable-next-line no-console
        console.warn('[ichava] DOMPurify unavailable; SVG rendered with server-side sanitisation only.')
        return input
    }

    const allowedTags = opts.allowStyle
        ? [...SVG_TAG_ALLOWLIST, 'style']
        : [...SVG_TAG_ALLOWLIST]

    return DOMPurify.sanitize(input, {
        USE_PROFILES: { svg: true, svgFilters: false },
        ALLOWED_TAGS: allowedTags as unknown as string[],
        ALLOWED_ATTR: [...SVG_ATTR_ALLOWLIST],
        FORBID_TAGS: ['script', 'foreignObject', 'iframe', 'object', 'embed'],
        FORBID_ATTR: ['onload', 'onerror', 'onclick', 'href', 'xlink:href'],
        KEEP_CONTENT: false,
    })
}

/**
 * Pick the first non-empty SVG string from a list of candidates and sanitise it.
 * Convenience for components that have several legacy property names for the
 * same field (`svgContent` vs `svg_content` vs `svg`).
 */
export function pickSanitizedSvg(...candidates: unknown[]): string {
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.length > 0) {
            return sanitizeSvg(candidate)
        }
    }
    return ''
}
