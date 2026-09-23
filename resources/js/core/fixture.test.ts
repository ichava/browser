import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards on the generated dev catalog (`npm run fixture`).
 *
 * The fixture used to be hand-authored and shipped five package ids that match no
 * Composer package -- ichava/ui-icons, ichava/test-icons, ichava/icons-bundle,
 * ichava/color-icons, ichava/illustrations -- two of which were also the product's
 * default filter. These assertions stop that returning by hand-edit.
 */

const REAL_PACKAGES = new Set([
  'ichava/tabler-icons',
  'ichava/bundled-icons',
  'ichava/flag-icons',
  'ichava/metronic-icons',
  'ichava/emoji-sets',
]);

interface FixtureIcon {
  id: number;
  package: string;
  name: string;
  category: string | null;
  variant: string;
  svgUrl: string;
  viewBox: string;
  ownColor: boolean;
}
interface Fixture {
  meta: { total_ecosystem: number; generated: string };
  packages: { id: string; count: number; installed: boolean; loaded: boolean }[];
  icons: FixtureIcon[];
}

const fixture = JSON.parse(readFileSync(join(__dirname, '..', 'test', 'data', 'icons.json'), 'utf8')) as Fixture;

describe('generated dev catalog', () => {
  it('declares only real Composer packages', () => {
    for (const p of fixture.packages) expect(REAL_PACKAGES).toContain(p.id);
  });

  it('every icon belongs to a declared package', () => {
    const declared = new Set(fixture.packages.map((p) => p.id));
    for (const icon of fixture.icons) expect(declared).toContain(icon.package);
  });

  it('gives every icon a unique, contiguous id', () => {
    const ids = fixture.icons.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(fixture.icons.map((_, i) => i + 1));
  });

  it('gives every icon a resolvable asset path and a viewBox', () => {
    for (const icon of fixture.icons) {
      expect(icon.svgUrl, icon.name).toMatch(/^assets\/[\w-]+\/.+\.svg$/);
      expect(icon.viewBox, icon.name).toMatch(/^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
    }
  });

  it('reports a pack with no assets as installed but not loaded', () => {
    // A pack with zero SVGs answering "fine" is the false-clean that hid emoji-sets
    // shipping no icons at all. It must be visible, not omitted.
    for (const p of fixture.packages) {
      if (p.count === 0) expect(p.loaded).toBe(false);
      else expect(p.loaded).toBe(true);
    }
  });

  it('covers both monochrome and own-colour icons', () => {
    // Own-colour icons take the <img> render path; monochrome take the CSS mask.
    // A fixture with only one kind silently stops exercising the other.
    const own = fixture.icons.filter((i) => i.ownColor).length;
    expect(own).toBeGreaterThan(0);
    expect(own).toBeLessThan(fixture.icons.length);
  });

  it('covers more than one variant, so variant filtering is exercised', () => {
    expect(new Set(fixture.icons.map((i) => i.variant)).size).toBeGreaterThan(1);
  });

  it('reports an ecosystem total far larger than the sample', () => {
    expect(fixture.meta.total_ecosystem).toBeGreaterThan(fixture.icons.length);
  });
});
