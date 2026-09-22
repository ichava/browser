import createDOMPurify, { type DOMPurify } from 'dompurify';
import { allowedAttributeNames, fragmentPattern, styleValueIsSafe, svgPolicy } from './svgPolicy';

/**
 * sanitizeSvg -- client-side SVG hardening, fragment-only (plan C15 / design DEV-013).
 * Any SVG fetched and rendered inline (grid stroke path, detail preview, export) passes
 * through here so untrusted markup can't carry script, event handlers, or external/data
 * references.
 *
 *  - keeps SVG + filters (<use>, gradients, clip/mask/filter + fe*)
 *  - blocks <script>, <foreignObject>, <style>, and all on* handlers
 *  - href / xlink:href allowed ONLY for `#fragment` refs (no http/data/js)
 *
 * This is one of four sanitiser surfaces in the ecosystem, and they used to disagree: a
 * census on 2026-09-02 measured 3,507 icons rendering correctly on the Blade path and
 * wrong here, because each runtime carried its own hand-maintained lists and only one was
 * ever widened. All four now derive from `svg-policy.json`.
 *
 * There is nothing to widen in this file. To change what survives, edit
 * `core/resources/security/svg-policy.json`, run
 * `maintainer-toolkit/.scripts/sync-svg-policy.mjs --write`, and update the pinned digest
 * in `svgPolicy.test.ts`. A local edit here is drift, and the digest test will say so.
 */

/**
 * A private DOMPurify instance.
 *
 * The hook below MUST NOT go on the shared default export. It previously did, guarded by
 * a module-level `hookInstalled` flag and never removed, so every other DOMPurify
 * consumer in the same bundle silently lost every non-`#` `href` it sanitised -- whether
 * or not it was handling SVG, and with no way to opt out. `addHook` mutates the instance
 * globally and there was no matching `removeHook` anywhere in the package (`S8`).
 *
 * `createDOMPurify(window)` returns an isolated instance whose hooks are its own.
 * Verified rather than assumed: a hook added to one instance does not affect another.
 */
let purifier: DOMPurify | null = null;

function getPurifier(): DOMPurify | null {
  if (typeof window === 'undefined') return null;
  if (purifier) return purifier;

  const instance = createDOMPurify(window);

  /*
   * The two value-restricted rules, enforced after DOMPurify's own attribute pass
   * because DOMPurify has no vocabulary for either.
   *
   * Fragment-only references are deliberately a hook rather than
   * `ALLOWED_URI_REGEXP`, which looks like the declarative way to say the same thing
   * and is not. That regexp is tested against every attribute value not on DOMPurify's
   * URI-safe list, so narrowing it to `^#` strips `viewBox` and `d` along with the
   * external href -- measured, not guessed:
   * `<svg viewBox="0 0 24 24"><path d="M0 0L10 10"/></svg>` comes back as
   * `<svg><path/></svg>`. Every icon in the corpus would render empty.
   *
   * The style guard is the other half. `style` is allowed by name because it is the
   * sole paint source for 261 of 501 metronic icons, but a `url()` aimed off the
   * document is the CSS exfiltration vector, and `expression(` / `behavior:` /
   * `-moz-binding` are script sinks. Allowed by name is never trusted by value.
   */
  const fragment = fragmentPattern();
  const refAttributes = svgPolicy.fragmentOnlyRefs.attributes;

  instance.addHook('afterSanitizeAttributes', (node) => {
    const el = node as Element;

    for (const attr of refAttributes) {
      const v = el.getAttribute?.(attr);
      if (v != null && !fragment.test(v)) el.removeAttribute(attr);
    }

    const style = el.getAttribute?.('style');
    if (style != null && !styleValueIsSafe(style)) el.removeAttribute('style');
  });

  purifier = instance;
  return purifier;
}

export function sanitizeSvg(svg: string): string {
  if (!svg) return '';

  const instance = getPurifier();

  /*
   * Fail closed.
   *
   * This returned `svg` -- the raw, unsanitised input -- whenever `window` was undefined,
   * which is every non-DOM context the module can be imported into. A sanitiser whose
   * unavailable path emits its input is not a sanitiser; it is a sanitiser-shaped hole
   * that opens exactly when it cannot run. R4 in the engineering brief: no
   * `catch { return raw }`, on any path. (`S7`, W1-7c.)
   *
   * An empty string renders nothing, which is visible and reportable. Raw markup renders
   * something that looks correct.
   */
  if (!instance) return '';

  /*
   * Built from the policy rather than listed here. `ALLOWED_TAGS`/`ALLOWED_ATTR`
   * replace DOMPurify's defaults outright, which is the point: the profile this
   * used to rely on (`USE_PROFILES: { svg: true, svgFilters: true }`) is a
   * different, wider set than the server enforces, and that difference is what
   * SEC-1d was.
   *
   * `data-layer` is kept as this app's own presentational hook; it is not part of
   * the shared policy and does not belong in it.
   */
  return instance.sanitize(svg, {
    ALLOWED_TAGS: [...svgPolicy.allowedTags],
    ALLOWED_ATTR: [...allowedAttributeNames(), 'data-layer'],
    FORBID_TAGS: [...svgPolicy.forbiddenTags],
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
  });
}
