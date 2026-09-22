import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Per-mount store isolation.
 *
 * `useStore` was a module singleton, so two `<IchavaBrowser>` instances on one page
 * shared filters, selection, favorites, appearance and detail state -- each silently
 * overwriting the other. `mount.tsx` acknowledged this in a comment without solving it.
 */

async function fresh() {
  vi.resetModules();
  localStorage.clear();
  return import('@js/store');
}

beforeEach(() => {
  localStorage.clear();
});

describe('createBrowserStore', () => {
  it('returns instances that do not share state', async () => {
    const { createBrowserStore } = await fresh();
    const a = createBrowserStore({ persistKey: null });
    const b = createBrowserStore({ persistKey: null });

    a.getState().setSearch('arrow');
    a.getState().setTheme('dark');
    a.getState().toggleFavorite(7);

    expect(a.getState().filters.search).toBe('arrow');
    expect(a.getState().theme).toBe('dark');
    expect(a.getState().favorites).toContain(7);

    // b must be untouched.
    expect(b.getState().filters.search).toBe('');
    expect(b.getState().theme).not.toBe('dark');
    expect(b.getState().favorites).not.toContain(7);
  });

  it('keeps selection and detail state separate', async () => {
    const { createBrowserStore } = await fresh();
    const a = createBrowserStore({ persistKey: null });
    const b = createBrowserStore({ persistKey: null });

    a.getState().toggleSelect(3);
    a.getState().openDetail(3);

    expect(a.getState().selection).toEqual([3]);
    expect(a.getState().detailId).toBe(3);
    expect(b.getState().selection).toEqual([]);
    expect(b.getState().detailId).toBeNull();
  });

  it('runs actions against ITS OWN state, not the singleton', async () => {
    // Five actions previously called `useStore.getState()` internally, because the
    // creator took `(set)` without `get`. A per-mount store's own actions therefore
    // read and wrote the singleton. This is the regression guard for that.
    //
    // signIn is the clearest case: it reads `get().config` and then calls
    // `get().pushNotification(...)`, so both the read and the write have to land on
    // the instance the action belongs to.
    const { createBrowserStore, useStore } = await fresh();
    const isolated = createBrowserStore({ persistKey: null });

    const singletonNotifications = useStore.getState().notifications.length;
    const ok = isolated.getState().signIn('dev@example.test', '123456');
    expect(ok).toBe(true);

    // The sign-in landed on the isolated store...
    expect(isolated.getState().auth.status).toBe('authed');
    expect(isolated.getState().notifications.length).toBeGreaterThan(0);

    // ...and nowhere near the singleton.
    expect(useStore.getState().auth.status).toBe('guest');
    expect(useStore.getState().notifications.length).toBe(singletonNotifications);
  });

  it('keeps collections separate between instances', async () => {
    const { createBrowserStore, useStore } = await fresh();
    const isolated = createBrowserStore({ persistKey: null });

    isolated.getState().createCollection('Mine');

    expect(isolated.getState().collections.some((c) => c.name === 'Mine')).toBe(true);
    expect(useStore.getState().collections.some((c) => c.name === 'Mine')).toBe(false);
  });

  it('does not write to storage when persistKey is null', async () => {
    const { createBrowserStore } = await fresh();
    const store = createBrowserStore({ persistKey: null });
    store.getState().setTheme('dark');
    // A secondary mount must not overwrite the primary's saved preferences.
    expect(localStorage.getItem('ichava.browser.v2')).toBeNull();
    expect(localStorage.getItem('ichava.browser.ephemeral')).toBeNull();
  });

  it('persists under a distinct key when given one', async () => {
    const { createBrowserStore } = await fresh();
    const store = createBrowserStore({ persistKey: 'ichava.browser.secondary' });
    store.getState().setTheme('dark');
    expect(localStorage.getItem('ichava.browser.secondary')).not.toBeNull();
    expect(localStorage.getItem('ichava.browser.v2')).toBeNull();
  });

  it('the default instance still persists under the shared key', async () => {
    const { useStore } = await fresh();
    useStore.getState().setTheme('dark');
    // The standalone app depends on this: its preferences must survive a reload.
    expect(localStorage.getItem('ichava.browser.v2')).not.toBeNull();
  });
});
