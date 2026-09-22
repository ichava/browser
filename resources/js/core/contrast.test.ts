import { describe, expect, it } from 'vitest';

import { contrastRatio, readableOn } from './format';
import { CONFIG_DEFAULTS } from './config';

/**
 * Accent legibility.
 *
 * The accent is user-chosen and used both as a solid fill and as text. A live audit of the
 * running app found exactly one WCAG AA failure, and this was it: the default `#7c3aed` as
 * text on the dark background measures 3.47:1 against a 4.5:1 requirement. It was not
 * specific to that colour -- every accent in the shipped palette failed on one theme or the
 * other, because a single hex cannot serve as text on both white and near-black.
 *
 * `readableOn` derives the adjusted variant. These tests pin the property that matters
 * (the result clears the threshold) rather than the exact hex it lands on, so the search
 * can be tuned without rewriting expectations.
 */

/** The two theme backgrounds the bridge resolves to; see the token audit. */
const LIGHT_BG = '#ffffff';
const DARK_BG = '#0a0a0a';

const AA_BODY = 4.5;

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 3);
    // Order must not matter.
    expect(contrastRatio('#7c3aed', DARK_BG)).toBeCloseTo(contrastRatio(DARK_BG, '#7c3aed'), 6);
  });

  it('reproduces the failure the live audit found', () => {
    // If this ever stops being below AA, the audit's premise changed and the
    // readableOn indirection should be re-justified rather than silently kept.
    expect(contrastRatio('#7c3aed', DARK_BG)).toBeLessThan(AA_BODY);
  });

  it('returns 1 for unparseable input rather than throwing', () => {
    expect(contrastRatio('not-a-colour', '#fff')).toBe(1);
    expect(contrastRatio('#7c3aed', 'rgb(0,0,0)')).toBe(1);
  });
});

describe('readableOn', () => {
  const ACCENTS = CONFIG_DEFAULTS.ui.accentOptions;

  it('has a non-empty palette to check', () => {
    // Guards the loops below: `it.each` over an empty array silently passes.
    expect(ACCENTS.length).toBeGreaterThan(0);
  });

  it.each(ACCENTS)('%s clears AA on the dark background', (accent) => {
    expect(contrastRatio(readableOn(accent, DARK_BG), DARK_BG)).toBeGreaterThanOrEqual(AA_BODY);
  });

  it.each(ACCENTS)('%s clears AA on the light background', (accent) => {
    expect(contrastRatio(readableOn(accent, LIGHT_BG), LIGHT_BG)).toBeGreaterThanOrEqual(AA_BODY);
  });

  it('leaves a colour untouched when it already passes', () => {
    // No gratuitous adjustment: an accent that is already legible must render as picked.
    const dark = '#3b0764';
    expect(contrastRatio(dark, LIGHT_BG)).toBeGreaterThanOrEqual(AA_BODY);
    expect(readableOn(dark, LIGHT_BG)).toBe(dark);
  });

  it('lightens on a dark background', () => {
    // `#7c3aed` fails on dark (3.47:1) and already passes on light (~7.6:1), so it only
    // exercises the lightening direction. An earlier version of this test asserted both
    // directions from this one colour and failed -- correctly, because darkening it would
    // have been a gratuitous change to a colour that was already legible.
    const out = readableOn('#7c3aed', DARK_BG);
    expect(out).not.toBe('#7c3aed');
    expect(contrastRatio(out, '#ffffff')).toBeLessThan(contrastRatio('#7c3aed', '#ffffff'));
  });

  it('darkens on a light background', () => {
    // A pale accent is the mirror case: fine on near-black, unreadable on white.
    const pale = '#fde047';
    expect(contrastRatio(pale, LIGHT_BG)).toBeLessThan(AA_BODY);
    const out = readableOn(pale, LIGHT_BG);
    expect(out).not.toBe(pale);
    expect(contrastRatio(out, LIGHT_BG)).toBeGreaterThanOrEqual(AA_BODY);
    expect(contrastRatio(out, '#000000')).toBeLessThan(contrastRatio(pale, '#000000'));
  });

  it('keeps the hue recognisable instead of collapsing to grey', () => {
    // Mixing along the lightness axis preserves the channel ordering that makes
    // "purple" read as purple; a naive clamp to white/black would not.
    const out = readableOn('#7c3aed', DARK_BG).replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(out.slice(i, i + 2), 16));
    expect(b!).toBeGreaterThan(r!);
    expect(r!).toBeGreaterThan(g!);
  });

  it('returns the input unchanged when it cannot be parsed', () => {
    expect(readableOn('teal', DARK_BG)).toBe('teal');
  });

  it('returns its best attempt rather than looping on an impossible target', () => {
    // 21:1 is only reachable by pure black on pure white; the loop must terminate.
    const out = readableOn('#808080', '#808080', 21);
    expect(typeof out).toBe('string');
    expect(out).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
