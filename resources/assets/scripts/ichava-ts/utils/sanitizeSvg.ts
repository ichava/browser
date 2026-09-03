/**
 * Client-side SVG sanitisation.
 *
 * The server already sanitises SVG via SanitizesSvg trait + SvgProcessingService
 * before it ever leaves the API, so this is defense-in-depth: a second filter
 * at the v-html boundary protects against (a) intermediate caches that may have
 * been poisoned with pre-sanitiser SVG, (b) future regressions on the server
 * side, and (c) any direct DOM manipulation that bypasses Vue's escaping.
 *
 * Fails closed when DOMPurify is unavailable: an empty string, never the raw
 * input. The allow-lists come from `security/svg-policy.json`, the single
 * definition all four runtimes in this ecosystem read.
 */

import DOMPurify from 'dompurify'
import {
    allowedAttributeNames,
    fragmentPattern,
    styleValueIsSafe,
    svgPolicy,
} from '../security/svgPolicy'

/*
 * `SanitizeOptions.allowStyle` was removed on 2026-09-02. It had no callers, and
 * it had stopped doing anything: the policy lists the `style` ELEMENT in
 * `forbiddenTags`, and DOMPurify's FORBID_TAGS wins over ALLOWED_TAGS, so the
 * option could only ever have appeared to work. Blocking the element is a
 * deliberate decision (OQ-011) -- 54 corpus files contain one and only 2 depend
 * on it for paint, so it costs 2 known-degraded icons and removes the
 * CSS-exfiltration surface. The style ATTRIBUTE is separate and is allowed.
 */

/*
 * The allow-lists come from the shared policy, not from literals here.
 *
 * They were literals until 2026-09-02, and that is how this runtime and the
 * server drifted apart: W1-6 widened the server and nothing widened this file,
 * so a census measured 3,507 icons rendering correctly on the Blade path and
 * wrong in the SPA -- metronic worst at 266 of 501. Editing this file to "fix"
 * an icon is how that happens again. Edit the canonical policy instead.
 */
const SVG_TAG_ALLOWLIST = svgPolicy.allowedTags

const SVG_ATTR_ALLOWLIST = allowedAttributeNames()

/**
 * Sanitise SVG markup for v-html rendering. Returns an empty string when the
 * input is not a string or DOMPurify rejects the content; callers should
 * treat empty output as "do not render".
 */
export function sanitizeSvg(input: unknown): string {
    if (typeof input !== 'string' || input.length === 0) {
        return ''
    }

    // DOMPurify is a browser-only library (uses window.document). When it is
    // unavailable (SSR, missing install) this returned `input` -- raw,
    // unsanitised markup -- justified by a comment claiming server-side
    // sanitisation would cover it.
    //
    // Fail closed instead. Two reasons, and the second outlives the first:
    //
    //  1. The justification was false when it was written. `Icon::svg_content`
    //     was a bare `File::get()` and the JSON API path sanitised nothing, so
    //     on the path that mattered this was the only sanitiser and it opted
    //     out exactly when it could not run.
    //  2. It is still wrong now that the server does sanitise, because a
    //     sanitiser whose error path emits its input is not a sanitiser. R4 in
    //     the engineering brief: no `catch { return raw }`, on any path.
    //
    // An empty string renders nothing, which is visible and reportable. Raw
    // markup renders something that looks correct. (`S4-c` / `S7`, W1-7c.)
    if (typeof DOMPurify?.sanitize !== 'function') {
        // eslint-disable-next-line no-console
        console.warn('[ichava] DOMPurify unavailable; refusing to render unsanitised SVG.')
        return ''
    }

    /*
     * Two rules DOMPurify has no vocabulary for are enforced in a hook, added and
     * removed around this call so it never touches the shared instance (`S8` --
     * a permanently installed hook silently strips non-fragment hrefs for every
     * other consumer in the bundle).
     *
     * Fragment-only refs are deliberately NOT expressed as `ALLOWED_URI_REGEXP`:
     * that regexp is tested against every attribute value not on DOMPurify's
     * URI-safe list, so narrowing it to `^#` strips `viewBox` and `d` too, and
     * every icon renders empty. Measured, not assumed.
     */
    const fragment = fragmentPattern()
    const refAttributes = svgPolicy.fragmentOnlyRefs.attributes

    const guard = (node: Node): void => {
        const el = node as Element

        for (const attr of refAttributes) {
            const v = el.getAttribute?.(attr)
            if (v != null && !fragment.test(v)) el.removeAttribute(attr)
        }

        const style = el.getAttribute?.('style')
        if (style != null && !styleValueIsSafe(style)) el.removeAttribute('style')
    }

    DOMPurify.addHook('afterSanitizeAttributes', guard)

    try {
        return DOMPurify.sanitize(input, {
            ALLOWED_TAGS: [...SVG_TAG_ALLOWLIST],
            ALLOWED_ATTR: [...SVG_ATTR_ALLOWLIST],
            FORBID_TAGS: [...svgPolicy.forbiddenTags],
            ALLOW_ARIA_ATTR: true,
            ALLOW_DATA_ATTR: false,
            KEEP_CONTENT: false,
        })
    } finally {
        // try/finally, not a trailing call: a throw inside sanitize() would
        // otherwise leak the hook onto the shared instance permanently.
        DOMPurify.removeHook('afterSanitizeAttributes')
    }
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
