import { describe, expect, it } from 'vitest';
import { normalizeRawIcon, propsToCatalog, toIconPackage } from './propsToCatalog';
import type { ServerIcon, ServerPackage } from './propsToCatalog';

const serverIcon = (overrides: Partial<ServerIcon> = {}): ServerIcon => ({
  id: 7,
  package: 'ichava/tabler-icons',
  name: 'home',
  category: 'general',
  variant: 'outline',
  svg_content: '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>',
  svg_url: '/ichava/api/icons/7/svg',
  viewbox: '0 0 24 24',
  blade_clean: '<x-ichava::icon name="home" />',
  tags: ['house'],
  ...overrides,
});

describe('normalizeRawIcon', () => {
  it('defaults a null category to empty string', () => {
    expect(normalizeRawIcon(serverIcon({ category: null })).category).toBe('');
  });

  it('defaults a null variant to outline', () => {
    expect(normalizeRawIcon(serverIcon({ variant: null })).variant).toBe('outline');
  });

  it('passes everything else through untouched', () => {
    const normalized = normalizeRawIcon(serverIcon());
    expect(normalized.id).toBe(7);
    expect(normalized.svg_url).toBe('/ichava/api/icons/7/svg');
    expect(normalized.tags).toEqual(['house']);
  });
});

describe('toIconPackage', () => {
  it('maps the server filter shape onto IconPackage', () => {
    const pkg: ServerPackage = { name: 'ichava/tabler-icons', label: 'Tabler', description: 'd', count: 42 };
    expect(toIconPackage(pkg)).toEqual({
      id: 'ichava/tabler-icons',
      label: 'Tabler',
      description: 'd',
      count: 42,
      installed: true,
      loaded: true,
    });
  });

  it('falls back to the package id for a missing label', () => {
    expect(toIconPackage({ name: 'x/y' }).label).toBe('x/y');
  });
});

describe('propsToCatalog', () => {
  it('builds a Catalog the repository accepts', () => {
    const catalog = propsToCatalog(
      [serverIcon(), serverIcon({ id: 8, name: 'star', category: null, variant: null })],
      [{ name: 'ichava/tabler-icons', count: 2 }],
      6184,
    );

    expect(catalog.meta.total_ecosystem).toBe(6184);
    expect(catalog.meta.generated).toBeTruthy();
    expect(catalog.packages).toHaveLength(1);
    expect(catalog.icons).toHaveLength(2);
    expect(catalog.icons[0]).toMatchObject({ id: 7, name: 'home', category: 'general', bladeClean: '<x-ichava::icon name="home" />' });
    expect(catalog.icons[1]).toMatchObject({ category: '', variant: 'outline' });
  });

  it('detects own-colour SVGs through toIcon', () => {
    const catalog = propsToCatalog(
      [serverIcon({ svg_content: '<svg><path fill="#ff0000"/></svg>' })],
      [],
      1,
    );
    expect(catalog.icons[0]?.ownColor).toBe(true);
  });
});
