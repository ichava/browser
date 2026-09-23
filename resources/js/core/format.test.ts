import { describe, expect, it } from 'vitest';
import { num, hslToHex, isValidHex, hexWithAlpha, relativeTime, hexToRgba, FALLBACK_ACCENT_RGB } from './format';

describe('format', () => {
  it('formats numbers with locale grouping', () => {
    expect(num(127262)).toBe('127,262');
  });

  it('validates hex', () => {
    expect(isValidHex('#7c3aed')).toBe(true);
    expect(isValidHex('#abc')).toBe(true);
    expect(isValidHex('#12345678')).toBe(true);
    expect(isValidHex('nope')).toBe(false);
  });

  it('converts hsl→hex deterministically', () => {
    expect(hslToHex(0, 50)).toMatch(/^#[0-9a-f]{6}$/);
    expect(hslToHex(0, 0)).toBe('#000000');
    expect(hslToHex(0, 100)).toBe('#ffffff');
  });

  it('appends an 0–100 alpha as an 8-digit hex', () => {
    expect(hexWithAlpha('#7c3aed', 100)).toBe('#7c3aedff');
    expect(hexWithAlpha('#7c3aed', 0)).toBe('#7c3aed00');
    expect(hexWithAlpha('#7c3aed', 50)).toBe('#7c3aed80');
  });

  // B30: this was duplicated character-for-character in IchavaBrowser.tsx and
  // landing/chrome.tsx, fallback literal included. One definition, one test.
  it('converts hex→rgba at a given alpha', () => {
    expect(hexToRgba('#7c3aed', 1)).toBe('rgba(124,58,237,1)');
    expect(hexToRgba('#000000', 0.5)).toBe('rgba(0,0,0,0.5)');
    expect(hexToRgba('#ffffff', 0)).toBe('rgba(255,255,255,0)');
  });

  it('tolerates surrounding whitespace and any hex case', () => {
    expect(hexToRgba('  #7C3AED  ', 0.35)).toBe('rgba(124,58,237,0.35)');
  });

  it('falls back to the brand accent for anything that is not a 6-digit hex', () => {
    // A malformed user-picked colour must degrade to a readable default, never
    // to an invalid CSS value that silently drops the declaration.
    for (const bad of ['', 'nope', '#abc', '#12345678', 'rgb(1,2,3)']) {
      expect(hexToRgba(bad, 0.16)).toBe(`rgba(${FALLBACK_ACCENT_RGB},0.16)`);
    }
  });

  it('renders relative time', () => {
    const now = 1_000_000_000_000;
    expect(relativeTime(now, now)).toBe('just now');
    expect(relativeTime(now - 90_000, now)).toBe('2m ago');
    expect(relativeTime(now - 3 * 3600_000, now)).toBe('3h ago');
  });
});
