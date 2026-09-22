import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Config precedence: core defaults -> config.defaults -> the user's persisted state.
 *
 * The `defaults` block used to be inert. The store initialises from CONFIG_DEFAULTS
 * at module load, the config arrives later through setConfig, and nothing read it —
 * so a host could not change the default package selection, page size, sort,
 * appearance or render options at all.
 *
 * The fix keys off whether a persisted blob existed when `core/storage` loaded,
 * which is why these tests seed localStorage BEFORE importing the store and use a
 * fresh module registry per case.
 */

const PERSIST_KEY = 'ichava.browser.v2';

async function loadStore(persisted: Record<string, unknown> | null) {
  vi.resetModules();
  localStorage.clear();
  if (persisted) localStorage.setItem(PERSIST_KEY, JSON.stringify({ state: persisted, version: 3 }));
  const [{ useStore }, { resolveConfig }] = await Promise.all([import('@js/store'), import('@js/core/config')]);
  return { useStore, resolveConfig };
}

describe('config precedence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('applies config.defaults on a first run', async () => {
    const { useStore, resolveConfig } = await loadStore(null);
    const config = resolveConfig({
      defaults: {
        packages: ['ichava/flag-icons'],
        perPage: 30,
        sortBy: 'package',
        appearance: { theme: 'dark', accent: '#059669' },
        render: { size: 96 },
      },
    });

    useStore.getState().setConfig(config);
    const s = useStore.getState();

    expect(s.filters.packages).toEqual(['ichava/flag-icons']);
    expect(s.filters.perPage).toBe(30);
    expect(s.filters.sortBy).toBe('package');
    expect(s.theme).toBe('dark');
    expect(s.accent).toBe('#059669');
    expect(s.size).toBe(96);
  });

  it('never overrides state the user already persisted', async () => {
    // A returning user who chose tabler, 120 per page and a light theme.
    const { useStore, resolveConfig } = await loadStore({
      filters: { search: '', packages: ['ichava/tabler-icons'], categories: [], subs: [], variant: null, sortBy: 'name', sortOrder: 'asc', page: 1, perPage: 120 },
      theme: 'light',
      accent: '#7c3aed',
      size: 48,
    });
    const config = resolveConfig({
      defaults: {
        packages: ['ichava/flag-icons'],
        perPage: 30,
        appearance: { theme: 'dark', accent: '#059669' },
        render: { size: 96 },
      },
    });

    useStore.getState().setConfig(config);
    const s = useStore.getState();

    expect(s.filters.packages).toEqual(['ichava/tabler-icons']);
    expect(s.filters.perPage).toBe(120);
    expect(s.theme).toBe('light');
    expect(s.accent).toBe('#7c3aed');
    expect(s.size).toBe(48);
  });

  it('falls back to core defaults for keys the config omits', async () => {
    const { useStore, resolveConfig } = await loadStore(null);
    const core = await import('@js/core/defaults');
    const config = resolveConfig({ defaults: { perPage: 30 } });

    useStore.getState().setConfig(config);
    const s = useStore.getState();

    expect(s.filters.perPage).toBe(30);
    expect(s.filters.sortBy).toBe(core.DEFAULT_FILTERS.sortBy);
    expect(s.theme).toBe(core.DEFAULT_APPEARANCE.theme);
    expect(s.size).toBe(core.DEFAULT_RENDER.size);
  });

  it('leaves the default package selection non-empty, so the grid is never blank', async () => {
    // Regression guard. An empty list reads as "no filter" to IconRepository but as
    // "unconfigured" to AppContent, which renders the pack picker instead of a grid --
    // so an empty default shows no icons while the toolbar counts the whole catalog.
    const { resolveConfig } = await loadStore(null);
    expect(resolveConfig(null).defaults.packages.length).toBeGreaterThan(0);
  });

  it('ships only real Composer package ids as defaults', async () => {
    const { resolveConfig } = await loadStore(null);
    const real = new Set([
      'ichava/core',
      'ichava/tabler-icons',
      'ichava/bundled-icons',
      'ichava/flag-icons',
      'ichava/metronic-icons',
      'ichava/emoji-sets',
    ]);
    for (const id of resolveConfig(null).defaults.packages) expect(real).toContain(id);
  });
});
