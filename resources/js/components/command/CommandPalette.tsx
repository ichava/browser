import { useMemo, useState, useEffect, useRef } from 'react';

import { useRepo } from '@/hooks/useRepo';
import { Modal } from '@/components/ui/Modal';
import { IconAsset } from '@/components/ui/IconAsset';
import { SearchMd } from '@untitledui/icons';
import { Glyph } from '@/components/ui/Glyph';
import { InputBase } from '@/components/base/input/input';
import { modKey } from '@/core/format';
import { useT } from '@/hooks/useT';
import { CONFIG_DEFAULTS } from '@/core/config';
import type { Icon } from '@/core/types';
import { useAppStore, useStoreApi } from '@/hooks/useStoreApi';

interface Action {
  id: string;
  label: string;
  icon: string;
  kbd: string;
  run: () => void;
}

export function CommandPalette() {
  const storeApi = useStoreApi();
  const { catalog, page: repoPage } = useRepo();
  const closeLayer = useAppStore((s) => s.closeLayer);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [recents, setRecents] = useState<string[]>(loadRecents);
  const inputRef = useRef<HTMLInputElement>(null);
  const mod = modKey();
  const t = useT();
  const limits = useAppStore((s) => s.config?.limits) ?? CONFIG_DEFAULTS.limits;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const s = storeApi.getState();
  const actions = useMemo<Action[]>(
    () => [
      { id: 'theme', label: t('palette.toggleTheme'), icon: 'moon', kbd: `${mod}T`, run: () => s.toggleTheme() },
      { id: 'settings', label: t('palette.openSettings'), icon: 'settings', kbd: `${mod},`, run: () => s.openLayer('settings') },
      { id: 'favorites', label: t('palette.openFavorites'), icon: 'heart', kbd: `${mod}1`, run: () => s.openLibrary('favorites') },
      { id: 'history', label: t('palette.openHistory'), icon: 'clock', kbd: `${mod}2`, run: () => s.openLibrary('history') },
      { id: 'collections', label: t('palette.openCollections'), icon: 'folder', kbd: `${mod}3`, run: () => s.openLibrary('collections') },
      { id: 'view', label: s.view === 'grid' ? t('palette.switchListView') : t('palette.switchGridView'), icon: s.view === 'grid' ? 'list' : 'grid', kbd: '', run: () => s.setView(s.view === 'grid' ? 'list' : 'grid') },
      { id: 'reset', label: t('palette.resetFilters'), icon: 'refresh', kbd: `${mod}R`, run: () => s.openConfirm({ title: t('toolbar.resetTitle'), body: t('toolbar.resetBody'), confirmLabel: t('toolbar.resetConfirm'), danger: true, onConfirm: () => { s.resetFilters(); s.showToast(t('toolbar.resetToast'), 'refresh'); } }) },
      { id: 'selectAll', label: t('palette.selectAll'), icon: 'check', kbd: `${mod}A`, run: () => s.setSelection(repoPage.items.map((i) => i.id)) },
      ...(s.config?.features.devtools !== false ? [{ id: 'devtools', label: t('palette.openDevtools'), icon: 'zap', kbd: `${mod}D`, run: () => s.toggleDevtools() }] : []),
    ],
    [mod, s, repoPage, t],
  );

  const query = q.trim().toLowerCase();
  const filteredActions = query
    ? actions.filter((a) => a.label.toLowerCase().includes(query))
    : [...actions].sort((x, y) => rank(recents, x.id) - rank(recents, y.id));
  /**
   * Static mode searches the whole in-memory catalog. REST mode has none, so
   * this searches whatever the grid has already loaded (`repoPage.items`) --
   * a real but partial result set, not a full-corpus index.
   *
   * That gap is deliberate, not a shortcut invented here: `PLAN.md` R-P13
   * assigns "indexed, ranked, fuzzy search mirrored server-side" to its own,
   * later phase. Building a client-side full-text index against a REST source
   * would mean re-fetching most of the corpus into the browser just to search
   * it, which is the exact cost paginated REST mode exists to avoid.
   */
  // `limits` was originally missing from this memo's deps: a runtime change to
  // limits.paletteIconResults wouldn't be reflected until query/catalog/repoPage
  // also changed. Adding it (in any form -- as a dependency here, split into its
  // own selector, or moved to a slice outside the memo) makes the React Compiler
  // report it can no longer prove `repoPage` -- unrelated, pre-existing, and
  // untouched by this fix -- is stable, and skip auto-memoizing this component.
  // That only forgoes an extra optimization pass; the useMemo below is a real,
  // independently correct React hook regardless of what the compiler does with
  // it, so this is disabled for exactly this call rather than reworked further.
  /* eslint-disable react-hooks/preserve-manual-memoization -- fires on both the
     opening call and the closing deps array, so this needs a block, not a
     single next-line disable */
  const iconResults: Icon[] = useMemo(() => {
    if (!query) return [];
    const scope = catalog ? catalog.icons : repoPage.items;
    return scope.filter((i) => `${i.name} ${i.id} ${(i.tags ?? []).join(' ')}`.toLowerCase().includes(query)).slice(0, limits.paletteIconResults);
  }, [query, catalog, repoPage, limits.paletteIconResults]);
  /* eslint-enable react-hooks/preserve-manual-memoization */

  const flat = [...filteredActions.map((a) => ({ kind: 'a' as const, a })), ...iconResults.map((i) => ({ kind: 'i' as const, i }))];

  const runAt = (idx: number) => {
    const item = flat[idx];
    if (!item) return;
    if (item.kind === 'i') {
      s.openDetail(item.i.id);
      return;
    }
    const next = [item.a.id, ...recents.filter((r) => r !== item.a.id)].slice(0, limits.recentCommandsCap);
    setRecents(next);
    saveRecents(next);
    item.a.run();
    // If the action didn't navigate to another layer, dismiss the palette.
    if (storeApi.getState().layer === 'palette') closeLayer();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((v) => Math.min(flat.length - 1, v + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((v) => Math.max(0, v - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); runAt(active); }
  };

  return (
    <Modal onClose={closeLayer} width={560} align="top" panelStyle={{ maxHeight: 'none', height: 'fit-content' }}>
      {/*
       * The design system's input, with its chrome removed rather than a bare `<input>`.
       *
       * A bare input picked up the app's fallback `:focus-visible` ring, which drew a
       * purple halo around the search row the moment the palette opened -- noise on the
       * one field that is already the focus target of a panel that just appeared. Using
       * `InputBase` means react-aria marks it `data-rac`, so the fallback rule (scoped
       * with `:not([data-rac])`) correctly stands aside.
       *
       * `wrapperClassName` strips the ring, shadow and radius: inside a palette the panel
       * IS the container, and a second bordered box within it reads as a nested field.
       *
       * The `esc` hint is gone from here. It used to sit at the end of this row and now
       * collides with the shared close button every Modal draws -- and the footer already
       * says "esc close", so it was telling the user the same thing twice.
       */}
      <div className="border-b border-b-[var(--border)] py-0 px-1.5">
        <InputBase
          ref={inputRef}
          size="md"
          icon={SearchMd}
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); }}
          onKeyDown={onKey}
          placeholder={t('palette.placeholder')}
          aria-label={t('palette.placeholder')}
          wrapperClassName="border-0 bg-transparent shadow-none ring-0"
          inputClassName="h-11 pe-10"
        />
      </div>

      <div className="h-[340px] overflow-y-auto p-1.5">
        {filteredActions.length > 0 && <SectionLabel>{!query && recents.length ? t('palette.recent') : t('palette.actions')}</SectionLabel>}
        {filteredActions.map((a, i) => (
          <Row key={a.id} active={active === i} onHover={() => setActive(i)} onClick={() => runAt(i)}>
            <Glyph name={a.icon} size={15} color="var(--muted-fg)" />
            <span className="flex-1 text-[12.5px]">{a.label}</span>
            {a.kbd && <kbd className="font-[family-name:'Geist_Mono',monospace] text-[10px] py-0.5 px-[5px] border border-[var(--border)] rounded-[4px] bg-[var(--muted2)] text-[var(--muted-fg)]">{a.kbd}</kbd>}
          </Row>
        ))}

        {iconResults.length > 0 && <SectionLabel>{t('palette.icons')}</SectionLabel>}
        {iconResults.map((icon, i) => {
          const idx = filteredActions.length + i;
          return (
            <Row key={icon.id} active={active === idx} onHover={() => setActive(idx)} onClick={() => runAt(idx)}>
              <IconAsset icon={icon} size={16} />
              <span className="text-[12.5px] font-[500]">{icon.name}</span>
              <span className="flex-1 font-[family-name:'Geist_Mono',monospace] text-[10.5px] text-[var(--muted-fg)]">{icon.package.replace('ichava/', '')}</span>
              <span className="text-[10.5px] text-[var(--faint-fg)]">{t('palette.openHint')} ↵</span>
            </Row>
          );
        })}

        {flat.length === 0 && <div className="p-6 text-center text-[12px] text-[var(--faint-fg)]">{t('palette.noMatches', { q })}</div>}
      </div>

      <div className="flex items-center gap-2.5 py-2 px-3.5 border-t border-t-[var(--border)] text-[10.5px] text-[var(--faint-fg)]">
        <span><b className="text-[var(--muted-fg)]">↑↓</b> {t('palette.navigate')}</span><span>·</span>
        <span><b className="text-[var(--muted-fg)]">↵</b> {t('palette.select')}</span><span>·</span>
        <span><b className="text-[var(--muted-fg)]">esc</b> {t('palette.close')}</span>
      </div>
    </Modal>
  );
}

const RECENT_KEY = CONFIG_DEFAULTS.storageKeys.paletteRecent;
function loadRecents(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}
function saveRecents(ids: string[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}
function rank(recents: string[], id: string): number {
  const i = recents.indexOf(id);
  return i < 0 ? 99 : i;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10.5px] font-semibold text-[var(--faint-fg)] pt-1.5 px-2 pb-[3px]">{children}</div>
);

function Row({ active, onHover, onClick, children }: { active: boolean; onHover: () => void; onClick: () => void; children: React.ReactNode }) {
  return (
    <div
      onMouseEnter={onHover}
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 9, height: 34, padding: '0 8px', borderRadius: 6, cursor: 'pointer', background: active ? 'var(--muted)' : 'transparent' }}
    >
      {children}
    </div>
  );
}
