import policy from './svg-policy.json'

/**
 * Derives this runtime's sanitiser configuration from the shared SVG policy.
 *
 * `svg-policy.json` is a byte-identical copy of
 * `core/resources/security/svg-policy.json`. It is vendored rather than read
 * from `vendor/ichava/core/` because this package resolves core from a
 * published tag, so the sibling tree is not reachable at build time and the
 * vendored core lags whatever is being developed.
 *
 * Do not hand-edit the JSON. Edit the canonical file, run
 * `maintainer-toolkit/.scripts/sync-svg-policy.mjs --write`, update the pinned
 * digest in `svgPolicy.test.ts`.
 */

export interface SvgPolicyShape {
    version: number
    allowedTags: string[]
    allowedAttributes: string[]
    allowedAttributePrefixes: string[]
    forbiddenTags: string[]
    denyAttributePrefixes: string[]
    fragmentOnlyRefs: { attributes: string[]; allow: string }
    styleAttribute: { allow: string; block: string[] }
}

export const svgPolicy = policy as unknown as SvgPolicyShape

/**
 * The by-name allow-list, which is NOT simply `policy.allowedAttributes`.
 *
 * The policy keeps value-restricted attributes in their own blocks — `style`
 * under `styleAttribute`, `href`/`xlink:href` under `fragmentOnlyRefs` — so a
 * consumer reading only `allowedAttributes` strips `style`, the sole paint
 * source for 261 of 501 metronic icons. That is the mistake this file existed
 * to make: before it was wired to the policy, this runtime stripped `style` and
 * every reference, and 3,507 icons rendered wrong here while rendering
 * correctly on the Blade path.
 *
 * Being on this list means the NAME may appear. The value is still checked.
 */
export function allowedAttributeNames(): string[] {
    const names = [...svgPolicy.allowedAttributes]

    if (svgPolicy.styleAttribute) names.push('style')
    names.push(...(svgPolicy.fragmentOnlyRefs?.attributes ?? []))

    return [...new Set(names)]
}

export function fragmentPattern(): RegExp {
    return new RegExp(svgPolicy.fragmentOnlyRefs.allow)
}

/**
 * A `url()` aimed off the document is the CSS exfiltration vector; the rest are
 * script sinks in their own right.
 */
export function styleValueIsSafe(value: string): boolean {
    const v = value.toLowerCase()

    if (
        v.includes('expression(') ||
        v.includes('behavior:') ||
        v.includes('-moz-binding') ||
        v.includes('@import')
    ) {
        return false
    }

    for (const m of value.matchAll(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi)) {
        if (!m[2].startsWith('#')) return false
    }

    return true
}
