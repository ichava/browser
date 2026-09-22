import { describe, expect, it, vi } from 'vitest';
import DOMPurify from 'dompurify';
import { toIcon, svgHasOwnColors } from './model';
import { sanitizeSvg } from './sanitizeSvg';
import { ExportService } from './ExportService';
import { sliderToSpeed, speedLabel } from './MotionEngine';
import { fidelity } from './SvgFidelity';
import { mkIcon } from '@js/test/fixtures';

describe('model', () => {
  it('maps a RawIcon (snake_case) to the app Icon', () => {
    const icon = toIcon({ id: 7, package: 'ichava/tabler-icons', name: 'home', category: 'general', variant: 'outline', svg_content: null, blade_clean: '<x/>', tags: ['a'] });
    expect(icon.bladeClean).toBe('<x/>');
    expect(icon.tags).toEqual(['a']);
    expect(icon.viewBox).toBe('0 0 24 24');
  });

  it('detects own-colour SVGs', () => {
    expect(svgHasOwnColors('<svg><path fill="#ff0000"/></svg>')).toBe(true);
    expect(svgHasOwnColors('<svg><path stroke="currentColor"/></svg>')).toBe(false);
    expect(svgHasOwnColors(null)).toBe(false);
  });
});

describe('sanitizeSvg', () => {
  it('strips scripts, handlers and external refs but keeps fragments', () => {
    const dirty = '<svg><script>alert(1)</script><a xlink:href="https://evil.test"><path onclick="x()" d="M0 0"/></a><use href="#g"/></svg>';
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onclick');
    expect(clean).not.toContain('https://evil.test');
    expect(clean).toContain('#g');
  });

  // S8 -- the fragment-only rule used to be a hook on the shared DOMPurify export,
  // installed once and never removed, so every other consumer in the bundle lost its
  // non-fragment hrefs too. Assert the shared instance is untouched.
  it('does not install its hook on the shared DOMPurify instance (S8)', () => {
    sanitizeSvg('<svg><use href="https://evil.test/x"/></svg>');

    const viaShared = DOMPurify.sanitize('<a href="https://example.test/ok">link</a>');

    expect(viaShared).toContain('https://example.test/ok');
  });

  // The geometry the fragment rule must not cost. ALLOWED_URI_REGEXP looks like the
  // declarative way to express fragment-only and strips viewBox/d as a side effect;
  // this pins the behaviour the hook exists to preserve.
  it('keeps viewBox and path geometry while blocking an external ref', () => {
    const clean = sanitizeSvg(
      '<svg viewBox="0 0 24 24"><path d="M0 0L10 10" fill="#f00"/><use href="https://evil.test/x"/></svg>'
    );

    expect(clean).toContain('viewBox="0 0 24 24"');
    expect(clean).toContain('d="M0 0L10 10"');
    expect(clean).not.toContain('evil.test');
  });

  // W1-7c / S7 -- fail closed, never pass the input through. The module memoises its
  // DOMPurify instance on first use, so this needs a fresh module graph with no DOM
  // rather than deleting `window` after the tests above have already warmed it.
  it('returns an empty string rather than raw markup when there is no DOM', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'window');

    try {
      vi.resetModules();
      Object.defineProperty(globalThis, 'window', { value: undefined, configurable: true });

      const fresh = await import('./sanitizeSvg');

      expect(fresh.sanitizeSvg('<svg onload="alert(1)"><path d="M0 0"/></svg>')).toBe('');
    } finally {
      if (original) Object.defineProperty(globalThis, 'window', original);
      vi.resetModules();
    }
  });

  it('returns an empty string for empty input', () => {
    expect(sanitizeSvg('')).toBe('');
  });
});

describe('ExportService', () => {
  const ex = new ExportService();
  const icons = [mkIcon({ id: 1, name: 'home' }), mkIcon({ id: 2, name: 'user' })];

  it('builds a manifest with refs', () => {
    const m = JSON.parse(ex.buildManifest(icons));
    expect(m.count).toBe(2);
    expect(m.icons[0].ref).toBe('tabler:home');
  });

  it('builds a sprite of <symbol>s', () => {
    const sprite = ex.buildSprite(icons.map((icon) => ({ icon, body: '<path/>', viewBox: '0 0 24 24' })));
    expect(sprite).toContain('<symbol id="tabler-home"');
    expect(sprite).toContain('<symbol id="tabler-user"');
  });
});

describe('MotionEngine', () => {
  it('maps the speed slider logarithmically', () => {
    expect(sliderToSpeed(50)).toBeCloseTo(1);
    expect(sliderToSpeed(0)).toBeCloseTo(0.25);
    expect(sliderToSpeed(100)).toBeCloseTo(4);
    expect(speedLabel(1)).toBe('1.0×');
  });
});

describe('SvgFidelity', () => {
  it('masks currentColor icons and images own-colour icons', () => {
    expect(fidelity.resolve(mkIcon({ id: 1, name: 'home' }), null).kind).toBe('mask');
    expect(fidelity.resolve(mkIcon({ id: 2, name: 'flag', ownColor: true }), null).kind).toBe('image');
    const style = fidelity.toStyle({ kind: 'mask', url: '/x.svg', color: 'red' }, 24);
    expect(style.maskImage).toContain('/x.svg');
  });
});
