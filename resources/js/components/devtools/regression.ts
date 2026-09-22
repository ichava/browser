// DevTools regression (plan Part E). REAL synchronous assertions over the live
// engines + store — not mocks. Feeds the DevTools "Tests" tab a true pass/total.

import { IconRepository, type Catalog } from '@js/core/IconRepository';
import { snippets, iconRef } from '@js/core/SnippetFactory';
import { treatmentMaskStyle } from '@js/core/TreatmentEngine';
import type { AppConfig } from '@js/core/config';
import type { BrowserStoreHook } from '@js/store';

export interface TestResult {
  name: string;
  pass: boolean;
  detail?: string;
}

function check(name: string, fn: () => boolean, detail?: string): TestResult {
  try {
    return { name, pass: fn(), detail };
  } catch (e) {
    return { name, pass: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Run the suite against the current catalog/config/store. */
/**
 * `store` is passed in rather than imported. This module is not a component, so it
 * cannot resolve the active store through a hook -- and importing the singleton would
 * make it assert against the wrong instance whenever a per-mount store is in use.
 */
export function runRegression(catalog: Catalog | null, config: AppConfig | null, store: BrowserStoreHook): TestResult[] {
  const out: TestResult[] = [];
  const repo = catalog ? new IconRepository(catalog) : null;
  const first = catalog?.icons[0];

  out.push(check('catalog loaded with icons', () => !!catalog && catalog.icons.length > 0));
  out.push(check('repository paginates within perPage', () => {
    if (!repo) return false;
    const page = repo.page({ search: '', packages: [], categories: [], variants: [], page: 1, perPage: 60, sortBy: 'name', sortDirection: 'asc' });
    return page.items.length <= 60 && page.total >= page.items.length;
  }));
  out.push(check('byId round-trips a known icon', () => {
    if (!repo || !first) return false;
    return repo.byId(first.id)?.name === first.name;
  }));
  out.push(check('package filter narrows results', () => {
    if (!repo || !first) return false;
    const only = repo.page({ search: '', packages: [first.package], categories: [], variants: [], page: 1, perPage: 120, sortBy: 'name', sortDirection: 'asc' });
    return only.items.every((i) => i.package === first.package);
  }));
  out.push(check('snippet: name format yields set:name ref', () => {
    if (!first) return false;
    return snippets.build('name', first, { size: 24, unit: 'px', color: null }) === iconRef(first);
  }));
  out.push(check('snippet: react snippet contains the icon name', () => {
    if (!first) return false;
    return snippets.build('react', first, { size: 24, unit: 'px', color: null }).includes(first.name);
  }));
  out.push(check('treatment: duotone uses the accent token', () => {
    const style = treatmentMaskStyle('mask://x', 26, '#000', 'duotone');
    return JSON.stringify(style).includes('--accent');
  }));
  out.push(check('config: features flags present', () => !!config && typeof config.features.devtools === 'boolean'));
  // Only asserted when this instance owns the document. With manageDocument off --
  // the default, and the whole point of the embedding contract -- the title belongs to
  // the host and must NOT match config.seo.title.
  out.push(
    check('config: seo drives the document title when the app owns it', () => {
      if (!config || typeof config.seo.title !== 'string') return false;
      const owns = document.documentElement.style.getPropertyValue('--accent') !== '';
      return owns ? document.title === config.seo.title : true;
    }),
  );
  out.push(check('store: favorites & collections are arrays', () => {
    const s = store.getState();
    return Array.isArray(s.favorites) && Array.isArray(s.collections);
  }));
  out.push(check('store: active workspace resolvable', () => {
    const s = store.getState();
    return !config || config.user.workspaces.length === 0 || !!s.activeWorkspaceId;
  }));

  return out;
}
