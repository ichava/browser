import { describe, expect, it } from 'vitest'
import { sanitizeSvg, pickSanitizedSvg } from './sanitizeSvg'

/**
 * Smoke tests for the client-side SVG sanitiser. Real defense-in-depth
 * coverage lives server-side in SvgSanitizerTest (PHP); these tests pin
 * the boundary that the browser actually executes against.
 */
describe('sanitizeSvg', () => {
    it('returns an empty string for non-string input', () => {
        expect(sanitizeSvg(null)).toBe('')
        expect(sanitizeSvg(undefined)).toBe('')
        expect(sanitizeSvg(42)).toBe('')
        expect(sanitizeSvg({})).toBe('')
    })

    it('returns empty for the empty string', () => {
        expect(sanitizeSvg('')).toBe('')
    })

    it('preserves a simple safe SVG', () => {
        const safe = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24"/></svg>'
        const out = sanitizeSvg(safe)
        expect(out).toContain('<svg')
        expect(out).toContain('viewBox')
        expect(out).toContain('<path')
    })

    it('strips inline event handlers', () => {
        const malicious = '<svg onload="alert(1)"><path d="M0 0"/></svg>'
        const out = sanitizeSvg(malicious)
        expect(out).not.toContain('onload')
        expect(out).not.toContain('alert')
    })

    it('strips <script> tags', () => {
        const malicious = '<svg><script>alert(1)</script><path d="M0 0"/></svg>'
        const out = sanitizeSvg(malicious)
        expect(out.toLowerCase()).not.toContain('<script')
        expect(out).not.toContain('alert')
    })

    it('strips foreignObject embeds', () => {
        const malicious = '<svg><foreignObject><iframe src="javascript:alert(1)"/></foreignObject></svg>'
        const out = sanitizeSvg(malicious)
        expect(out.toLowerCase()).not.toContain('<foreignobject')
        expect(out.toLowerCase()).not.toContain('<iframe')
        expect(out).not.toContain('javascript:')
    })
})

describe('pickSanitizedSvg', () => {
    it('returns sanitised output of the first non-empty candidate', () => {
        const out = pickSanitizedSvg(null, undefined, '<svg><path d="M0 0"/></svg>', 'fallback')
        expect(out).toContain('<svg')
        expect(out).toContain('<path')
    })

    it('returns empty when no candidate has content', () => {
        expect(pickSanitizedSvg(null, undefined, '', false)).toBe('')
    })
})
