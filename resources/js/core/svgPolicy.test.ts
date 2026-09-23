import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allowedAttributeNames, svgPolicy } from './svgPolicy';
import { sanitizeSvg } from './sanitizeSvg';

/**
 * The vendored copy of `core/resources/security/svg-policy.json`.
 *
 * Pinned by digest rather than compared against core, because this package has
 * no dependency on `ichava/core` and cannot reach it. The digest catches an
 * accidental local edit; it cannot see that core has moved on. That second job
 * belongs to `maintainer-toolkit/.scripts/sync-svg-policy.mjs`, which is the one
 * place every checkout is visible at once.
 *
 * When the canonical policy changes: run the sync script with `--write`, then
 * paste the digest it prints here.
 */
const PINNED_SHA256 = '8794a59bdf3fe3112eccc68c157d85c1c55728299dedcdbd7447ccbc083a6be2';

describe('vendored SVG policy', () => {
  it('has not drifted from the digest it was synced at', () => {
    // Resolved from the package root (vitest's cwd) rather than import.meta.url,
    // which is not a file: URL under vitest and throws.
    const bytes = readFileSync('resources/js/core/svg-policy.json');

    expect(createHash('sha256').update(bytes).digest('hex')).toBe(PINNED_SHA256);
  });

  it('merges the value-restricted names into the by-name allow-list', () => {
    // style/href live in their own policy blocks because their VALUES are
    // checked. Reading only `allowedAttributes` strips style, which is the sole
    // paint source for 261 of 501 metronic icons. Same trap as the PHP reader.
    expect(allowedAttributeNames()).toContain('style');
    expect(allowedAttributeNames()).toContain('href');
    expect(svgPolicy.allowedAttributes).not.toContain('style');
  });
});

/**
 * Cross-runtime parity. These are the same fixtures as
 * `core/tests/Unit/SvgPolicyTest.php`; both runtimes must keep the same
 * constructs. Not identical bytes -- the serialisers differ -- but the same
 * elements and attributes surviving, which is R2.
 */
describe('parity with the server policy', () => {
  it('keeps a filter and its primitives', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><defs><filter id="f">'
      + '<feGaussianBlur stdDeviation="2"/><feOffset dx="1"/><feMerge><feMergeNode/></feMerge>'
      + '</filter></defs><rect filter="url(#f)" width="10" height="10"/></svg>'
    );

    expect(out).toContain('filter');
    expect(out).toContain('feGaussianBlur');
    expect(out).toContain('feMerge');
  });

  it('keeps a pattern with its units', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><defs>'
      + '<pattern id="p" patternUnits="userSpaceOnUse" patternTransform="rotate(45)" width="4" height="4">'
      + '<path d="M0 0h4"/></pattern></defs><rect fill="url(#p)" width="8" height="8"/></svg>'
    );

    expect(out).toContain('pattern');
    expect(out.toLowerCase()).toContain('patternunits');
  });

  it('keeps linear gradient coordinates and their stops', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><defs>'
      + '<linearGradient id="g" x1="0" y1="0" x2="1" y2="1" spreadMethod="pad">'
      + '<stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#00f"/>'
      + '</linearGradient></defs><rect fill="url(#g)" width="10" height="10"/></svg>'
    );

    expect(out).toContain('x1=');
    expect(out).toContain('y2=');
    expect(out.toLowerCase()).toContain('spreadmethod');
    expect(out).toContain('stop-color');
  });

  it('keeps the style attribute, the paint source for 261 metronic icons', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><path style="fill:#123456" d="M0 0h1"/></svg>'
    );

    expect(out).toContain('fill:#123456');
  });

  it('keeps dash and stroke geometry', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10" '
      + 'stroke-dasharray="4 2" stroke-dashoffset="1" stroke-miterlimit="8" '
      + 'vector-effect="non-scaling-stroke" paint-order="stroke"/></svg>'
    );

    expect(out).toContain('stroke-dasharray');
    expect(out).toContain('stroke-miterlimit');
    expect(out).toContain('vector-effect');
  });

  it('keeps the accessible name and its wiring', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="t">'
      + '<title id="t">Home</title><path d="M0 0h1"/></svg>'
    );

    expect(out).toContain('<title');
    expect(out.toLowerCase()).toContain('aria-labelledby');
    expect(out).toContain('role=');
  });

  it('keeps a fragment <use> and drops an external one', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg">'
      + '<use href="#ok"/><use href="https://evil.test/x"/></svg>'
    );

    expect(out).toContain('#ok');
    expect(out).not.toContain('evil.test');
  });
});

describe('what the widening must not have loosened', () => {
  it('still blocks the style element while keeping the style attribute', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><style>.a{fill:red}</style>'
      + '<path style="fill:#123456" d="M0 0h1"/></svg>'
    );

    expect(out.toLowerCase()).not.toContain('<style');
    expect(out).toContain('fill:#123456');
  });

  it('still blocks script, foreignObject and SMIL', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script>'
      + '<foreignObject><b>x</b></foreignObject>'
      + '<animate attributeName="href" to="javascript:alert(1)"/>'
      + '<path d="M0 0h1"/></svg>'
    );

    expect(out.toLowerCase()).not.toContain('<script');
    expect(out.toLowerCase()).not.toContain('foreignobject');
    expect(out.toLowerCase()).not.toContain('<animate');
    expect(out).toContain('<path');
  });

  it('rejects a style value that reaches off the document', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg">'
      + '<path style="fill:url(https://evil.test/x)" d="M0 0h1"/>'
      + '<path style="fill:url(#ok)" d="M0 0h1"/></svg>'
    );

    expect(out).not.toContain('evil.test');
    expect(out).toContain('url(#ok)');
  });
});
