import { describe, expect, it } from 'vitest';
import { UI_SCALE_MAP } from './appScale';

/**
 * UI scale is a display zoom, the way macOS and Windows do it.
 *
 * It has been all three things. Originally a CSS `zoom` on the app root, which distorted
 * the coordinate space for overlays positioned by Floating UI. Then token scaling --
 * `--spacing` plus `font-size` -- which fixed that but only moved part of the UI: the
 * chrome is full of inline pixel literals (`height: 48` on the header, `width: 248` on the
 * sidebar) and a token cannot reach them. Measured from `m` to `l`, type went 13.5px to
 * 15.12px while the header stayed at exactly 48px.
 *
 * It is `zoom` again, on `<html>` in standalone mode so that overlays portalled to
 * `<body>` scale with everything else, and on the component root when embedded. The
 * original objection no longer applies: every overlay is react-aria now, and none of them
 * read a trigger rect through Floating UI.
 *
 * These tests pin the multiplier table. That the chrome actually resizes is asserted in
 * `e2e/scale.spec.ts`, because it can only be measured against a real layout.
 */

const ORDER = ['xs', 's', 'm', 'l'] as const;

describe('UI scale', () => {
  it('maps every scale to a sane multiplier', () => {
    for (const [scale, z] of Object.entries(UI_SCALE_MAP)) {
      expect(z, scale).toBeGreaterThan(0);
      // A zoom above 2 would push the app past any usable layout at common viewports.
      expect(z, scale).toBeLessThanOrEqual(2);
    }
  });

  it('is neutral at the default scale', () => {
    // `m` must be exactly 1: anything else silently rescales the whole app for users who
    // never touched the setting.
    expect(UI_SCALE_MAP.m).toBe(1);
  });

  it('increases monotonically across the steps', () => {
    const values = ORDER.map((s) => UI_SCALE_MAP[s]);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!, `${ORDER[i]} > ${ORDER[i - 1]}`).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('covers every scale the type allows', () => {
    // Guards against a scale being added to the union but not the table, which would make
    // `UI_SCALE_MAP[scale] || 1` silently fall back to neutral.
    for (const s of ORDER) {
      expect(UI_SCALE_MAP[s], `${s} missing from UI_SCALE_MAP`).toBeTypeOf('number');
    }
    expect(Object.keys(UI_SCALE_MAP).sort()).toEqual([...ORDER].sort());
  });
});
