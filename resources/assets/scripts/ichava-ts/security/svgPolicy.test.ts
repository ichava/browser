import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { allowedAttributeNames, svgPolicy } from './svgPolicy'
import { sanitizeSvg } from '../utils/sanitizeSvg'

/**
 * Pinned digest of the vendored copy of
 * `core/resources/security/svg-policy.json`.
 *
 * This package resolves `ichava/core` from a published tag, so the sibling tree
 * is not reachable and the vendored core lags development. The digest catches an
 * accidental edit here; catching that core has moved on is the job of
 * `maintainer-toolkit/.scripts/sync-svg-policy.mjs`, the only place every
 * checkout is visible at once.
 *
 * On a policy change: sync with `--write`, paste the digest it prints.
 */
const PINNED_SHA256 = '8794a59bdf3fe3112eccc68c157d85c1c55728299dedcdbd7447ccbc083a6be2'

describe('vendored SVG policy', () => {
    it('has not drifted from the digest it was synced at', () => {
        const bytes = readFileSync(
            'resources/assets/scripts/ichava-ts/security/svg-policy.json'
        )

        expect(createHash('sha256').update(bytes).digest('hex')).toBe(PINNED_SHA256)
    })

    it('merges the value-restricted names into the by-name allow-list', () => {
        expect(allowedAttributeNames()).toContain('style')
        expect(allowedAttributeNames()).toContain('href')
        expect(svgPolicy.allowedAttributes).not.toContain('style')
    })
})

/**
 * Cross-runtime parity: the same fixtures as `core/tests/Unit/SvgPolicyTest.php`
 * and `react-browser/src/core/svgPolicy.test.ts`. Not identical bytes -- the
 * serialisers differ -- but the same constructs surviving, which is R2.
 *
 * These are the cases the census counted: 266 of 501 metronic and 126 of 542
 * flag icons rendered wrong here while rendering correctly on the Blade path.
 */
describe('parity with the server policy', () => {
    it('keeps the style attribute, the paint source for 261 metronic icons', () => {
        const out = sanitizeSvg(
            '<svg xmlns="http://www.w3.org/2000/svg"><path style="fill:#123456" d="M0 0h1"/></svg>'
        )

        expect(out).toContain('fill:#123456')
    })

    it('keeps a fragment <use>, which is 126 flag icons', () => {
        const out = sanitizeSvg(
            '<svg xmlns="http://www.w3.org/2000/svg"><use href="#ok"/></svg>'
        )

        expect(out).toContain('#ok')
    })

    it('keeps gradients with their coordinates and stops', () => {
        const out = sanitizeSvg(
            '<svg xmlns="http://www.w3.org/2000/svg"><defs>'
            + '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">'
            + '<stop offset="0" stop-color="#f00"/></linearGradient></defs>'
            + '<rect fill="url(#g)" width="10" height="10"/></svg>'
        )

        expect(out).toContain('x1=')
        expect(out).toContain('stop-color')
    })

    it('keeps filters, patterns and text layout', () => {
        const out = sanitizeSvg(
            '<svg xmlns="http://www.w3.org/2000/svg"><defs>'
            + '<filter id="f"><feGaussianBlur stdDeviation="2"/></filter>'
            + '<pattern id="p" patternUnits="userSpaceOnUse"><path d="M0 0h4"/></pattern>'
            + '</defs><text text-anchor="middle" letter-spacing="2">hi</text></svg>'
        )

        expect(out).toContain('feGaussianBlur')
        expect(out.toLowerCase()).toContain('patternunits')
        expect(out).toContain('text-anchor')
    })

    it('keeps the accessible name and its wiring', () => {
        const out = sanitizeSvg(
            '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="t">'
            + '<title id="t">Home</title><path d="M0 0h1"/></svg>'
        )

        expect(out).toContain('<title')
        expect(out.toLowerCase()).toContain('aria-labelledby')
    })
})

describe('what the widening must not have loosened', () => {
    it('still blocks the style element while keeping the style attribute', () => {
        const out = sanitizeSvg(
            '<svg xmlns="http://www.w3.org/2000/svg"><style>.a{fill:red}</style>'
            + '<path style="fill:#123456" d="M0 0h1"/></svg>'
        )

        expect(out.toLowerCase()).not.toContain('<style')
        expect(out).toContain('fill:#123456')
    })

    it('drops an external reference while keeping a fragment', () => {
        const out = sanitizeSvg(
            '<svg xmlns="http://www.w3.org/2000/svg">'
            + '<use href="https://evil.test/x"/><use href="#ok"/></svg>'
        )

        expect(out).not.toContain('evil.test')
        expect(out).toContain('#ok')
    })

    it('rejects a style value that reaches off the document', () => {
        const out = sanitizeSvg(
            '<svg xmlns="http://www.w3.org/2000/svg">'
            + '<path style="fill:url(https://evil.test/x)" d="M0 0h1"/>'
            + '<path style="fill:url(#ok)" d="M0 0h1"/></svg>'
        )

        expect(out).not.toContain('evil.test')
        expect(out).toContain('url(#ok)')
    })

    it('leaves no hook on the shared DOMPurify instance', () => {
        sanitizeSvg('<svg><use href="https://evil.test/x"/></svg>')

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const DOMPurify = (globalThis as never as { __dp?: unknown }).__dp
        void DOMPurify

        // An unrelated consumer must keep its href (`S8`).
        // Imported lazily so the module graph matches production.
        return import('dompurify').then(({ default: dp }) => {
            expect(dp.sanitize('<a href="https://example.test/ok">x</a>'))
                .toContain('https://example.test/ok')
        })
    })
})
