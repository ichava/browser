import { describe, expect, it } from 'vitest';
import { IconRepository } from './IconRepository';
import { catalog, mkIcon } from '@js/test/fixtures';
import type { Catalog } from './IconRepository';

const repo = new IconRepository(catalog);

// A catalog with subcategories + a color variant for the tree/variant tests.
const subCatalog: Catalog = {
  meta: { total_ecosystem: 10, generated: '2026-01-01' },
  packages: [{ id: 'ichava/tabler-icons', label: 'tabler-icons', count: 5, installed: true, loaded: true }],
  icons: [
    mkIcon({ id: 1, name: 'settings', category: 'system' }), // direct (no sub)
    mkIcon({ id: 2, name: 'wifi', category: 'system', sub: 'connectivity' }),
    mkIcon({ id: 3, name: 'bluetooth', category: 'system', sub: 'connectivity' }),
    mkIcon({ id: 4, name: 'cpu', category: 'system', sub: 'hardware' }),
    mkIcon({ id: 5, name: 'palette', category: 'design', variant: 'color', ownColor: true }),
  ],
};
const subRepo = new IconRepository(subCatalog);

describe('IconRepository', () => {
  it('paginates with a stable range', () => {
    const p = repo.page({ perPage: 2, page: 1 });
    expect(p.total).toBe(5);
    expect(p.items).toHaveLength(2);
    expect(p.lastPage).toBe(3);
    expect(p.rangeStart).toBe(1);
    expect(p.rangeEnd).toBe(2);
  });

  it('clamps an out-of-range page', () => {
    const p = repo.page({ perPage: 2, page: 99 });
    expect(p.page).toBe(3);
    expect(p.items).toHaveLength(1);
  });

  it('filters by package, category and variant', () => {
    expect(repo.page({ packages: ['ichava/ui-icons'] }).total).toBe(1);
    expect(repo.page({ categories: ['communication'] }).total).toBe(2);
    expect(repo.page({ variants: ['filled'] }).total).toBe(1);
  });

  it('searches name + tags (min 2 chars)', () => {
    expect(repo.page({ search: 'account' }).items.map((i) => i.name)).toEqual(['user']);
    expect(repo.page({ search: 'a' }).total).toBe(5); // <2 chars → ignored
  });

  it('sorts by name asc/desc', () => {
    expect(repo.page({ sortBy: 'name', sortDirection: 'asc' }).items[0]!.name).toBe('bell');
    expect(repo.page({ sortBy: 'name', sortDirection: 'desc' }).items[0]!.name).toBe('user');
  });

  it('builds a category tree grouped by pack with stable counts', () => {
    const tree = repo.categoryTree({ categories: ['communication'] });
    const tabler = tree.find((g) => g.pack === 'ichava/tabler-icons')!;
    // counts ignore the category filter so the tree stays browsable
    expect(tabler.cats.find((c) => c.name === 'general')!.count).toBe(2);
    expect(tabler.cats.find((c) => c.name === 'communication')!.count).toBe(2);
  });

  it('exposes filters with counts', () => {
    const f = repo.filters();
    expect(f.categories.find((c) => c.name === 'general')!.count).toBe(2);
    expect(f.variants.map((v) => v.name).sort()).toEqual(['filled', 'outline']);
  });

  it('finds related same-category icons', () => {
    const home = repo.byId(1)!;
    expect(repo.related(home).map((i) => i.name)).toEqual(['user']);
  });

  it('builds a 3-level tree; package count = number of categories', () => {
    const tree = subRepo.categoryTree({});
    const g = tree[0]!;
    expect(g.count).toBe(2); // system + design = 2 categories
    const system = g.cats.find((c) => c.name === 'system')!;
    expect(system.count).toBe(4); // 1 direct + 3 in subs
    expect(system.sub!.map((s) => s.slug).sort()).toEqual(['connectivity', 'hardware']);
    expect(system.sub!.find((s) => s.slug === 'connectivity')!.count).toBe(2);
    expect(system.sub!.find((s) => s.slug === 'hardware')!.count).toBe(1);
    expect(g.cats.find((c) => c.name === 'design')!.sub).toBeUndefined();
  });

  it('filters by subcategory (category/sub key) OR whole category', () => {
    expect(subRepo.page({ subs: ['system/connectivity'] }).total).toBe(2);
    expect(subRepo.page({ categories: ['system'] }).total).toBe(4);
    // categories + subs union within the category dimension
    expect(subRepo.page({ categories: ['design'], subs: ['system/hardware'] }).total).toBe(2);
  });

  it('reports variant counts over the current scope', () => {
    const vc = subRepo.variantCounts({});
    expect(vc.get('outline')).toBe(4);
    expect(vc.get('color')).toBe(1);
    expect(vc.get('filled') ?? 0).toBe(0);
  });
});
