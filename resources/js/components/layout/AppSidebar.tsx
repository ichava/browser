import { useEffect, useMemo, useRef, useState } from 'react';

import type { SearchScope } from '@/store';
import { useRepo } from '@/hooks/useRepo';
import { useT } from '@/hooks/useT';
import { SearchMd } from '@untitledui/icons';
import { Glyph } from '@/components/ui/Glyph';
import { InputBase } from '@/components/base/input/input';
import { Select } from '@/components/base/select/select';
import { CategoryTree } from './CategoryTree';
import { num } from '@/core/format';
import { rem } from '@/core/appScale';
import { useAppStore } from '@/hooks/useStoreApi';

const SCOPES: { id: SearchScope; key: string }[] = [
  { id: 'icons', key: 'sidebar.scopeIcons' },
  { id: 'packages', key: 'sidebar.scopePackages' },
  { id: 'categories', key: 'sidebar.scopeCategories' },
  { id: 'all', key: 'sidebar.scopeAll' },
];

const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--muted-fg)' };
const mono: React.CSSProperties = { fontFamily: "'Geist Mono',monospace" };
const linkBtn: React.CSSProperties = { border: 'none', background: 'none', fontSize: 11, cursor: 'pointer', padding: 2 };

export function AppSidebar() {
  const { catalog, page } = useRepo();
  const filters = useAppStore((s) => s.filters);
  const togglePackage = useAppStore((s) => s.togglePackage);
  const selectAllPacks = useAppStore((s) => s.selectAllPacks);
  const clearPacks = useAppStore((s) => s.clearPacks);
  const favorites = useAppStore((s) => s.favorites);
  const selection = useAppStore((s) => s.selection);
  const packageQuery = useAppStore((s) => s.packageQuery);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const t = useT();

  const allPacks = catalog?.packages ?? [];
  const packs = useMemo(
    () => (packageQuery ? allPacks.filter((p) => p.label.toLowerCase().includes(packageQuery.toLowerCase())) : allPacks),
    [allPacks, packageQuery],
  );
  const allInstalled = useMemo(() => allPacks.filter((p) => p.installed).map((p) => p.id), [allPacks]);
  const loadedCount = useMemo(
    () => packs.filter((p) => filters.packages.includes(p.id) && p.loaded).reduce((n, p) => n + p.count, 0),
    [packs, filters.packages],
  );

  return (
    <>
      {sidebarOpen && <div className="ich-scrim" onClick={() => setSidebarOpen(false)} />}
    <aside
      className={sidebarOpen ? 'ich-sidebar open' : 'ich-sidebar'}
      style={{
        width: rem(248),
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)',
        background: 'var(--bg)',
        minHeight: 0,
      }}
    >
      <SidebarSearch />

      <div className="ich-side-scroll" style={{ flex: 1, overflowY: 'auto', padding: '2px 10px 10px', minHeight: 0 }}>
        <div className="flex items-center gap-1.5 pt-2 px-0.5 pb-1">
          {/*
           * A real heading, not a styled span. It labels a landmark section, so making it
           * an h2 gives screen-reader users something to navigate by -- and it also
           * disambiguates it from the option of the same name inside the scope select,
           * which react-aria mirrors into a hidden native <select>.
           */}
          <h2 style={{ ...sectionLabel, margin: 0 }}>{t('sidebar.packages')}</h2>
          <span style={{ ...mono, fontSize: 10, color: 'var(--faint-fg)' }}>{filters.packages.length}/{allPacks.length}</span>
          <span className="flex-1" />
          <button onClick={() => selectAllPacks(allInstalled)} style={{ ...linkBtn, color: 'var(--accent-text)', fontWeight: 500 }}>{t('common.all')}</button>
          <button onClick={clearPacks} style={{ ...linkBtn, color: 'var(--muted-fg)' }}>{t('common.none')}</button>
        </div>

        <div className="flex flex-col gap-[1px]">
          {packs.map((pkg) => {
            const checked = filters.packages.includes(pkg.id);
            return (
              <div
                key={pkg.id}
                role="checkbox"
                aria-checked={checked}
                aria-disabled={!pkg.installed}
                aria-label={pkg.label}
                tabIndex={pkg.installed ? 0 : -1}
                onClick={() => pkg.installed && togglePackage(pkg.id)}
                onKeyDown={(e) => {
                  if (pkg.installed && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    togglePackage(pkg.id);
                  }
                }}
                title={pkg.description}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 30,
                  padding: '0 6px',
                  borderRadius: 6,
                  cursor: pkg.installed ? 'pointer' : 'not-allowed',
                  opacity: pkg.installed ? 1 : 0.55,
                  background: checked ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 15,
                    height: 15,
                    flex: 'none',
                    borderRadius: 4,
                    border: `1px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                    background: checked ? 'var(--accent)' : 'var(--bg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {checked && <Glyph name="check" size={9} color="var(--accent-fg)" />}
                </span>
                <span className="flex-1 min-w-0 text-[12.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {pkg.label}
                </span>
                {!pkg.installed && (
                  <span className="text-[9.5px] text-[var(--faint-fg)] border border-[var(--border)] rounded-[4px] py-[1px] px-1">
                    {t('sidebar.notInstalled')}
                  </span>
                )}
                <span style={{ ...mono, fontSize: 10.5, color: 'var(--muted-fg)' }}>{num(pkg.count)}</span>
              </div>
            );
          })}
        </div>

        <CategoryTree />
      </div>

      <div className="flex-none border-t border-t-[var(--border)] py-2 px-3 flex flex-col gap-1">
        <Stat label={t('sidebar.inView')} value={num(page.total)} />
        {selection.length > 0 && <Stat label={t('sidebar.selected')} value={num(selection.length)} />}
        <Stat label={t('sidebar.loadedIcons')} value={num(loadedCount)} />
        <Stat label={t('sidebar.ecosystemTotal')} value={num(catalog?.meta.total_ecosystem ?? 0)} />
        <Stat label={t('sidebar.favorites')} value={num(favorites.length)} />
      </div>
    </aside>
    </>
  );
}

function SidebarSearch() {
  const { catalog } = useRepo();
  const t = useT();
  const scope = useAppStore((s) => s.searchScope);
  const setSearchScope = useAppStore((s) => s.setSearchScope);
  const setSearch = useAppStore((s) => s.setSearch);
  const clearSearch = useAppStore((s) => s.clearSearch);
  const setCatQ = useAppStore((s) => s.setCatQ);
  const setPackageQuery = useAppStore((s) => s.setPackageQuery);
  const storedSearch = useAppStore((s) => s.filters.search);
  const [q, setQ] = useState(storedSearch);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  const commit = (value: string) => {
    setSearch(scope === 'icons' || scope === 'all' ? value : '');
    setCatQ(scope === 'categories' || scope === 'all' ? value : '');
    setPackageQuery(scope === 'packages' || scope === 'all' ? value : '');
  };
  const onChange = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(value), 200);
  };
  const clear = () => {
    setQ('');
    if (timer.current) clearTimeout(timer.current);
    clearSearch();
    setCatQ('');
    setPackageQuery('');
  };
  // Re-route the query when the scope changes.
  useEffect(() => {
    commit(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  // Static mode only: scans the in-memory catalog to preview how many
  // icons/packages/categories a scope pill would match. REST mode has no
  // in-memory catalog, and there is no endpoint that counts a text match
  // against package/category LABELS (as opposed to the corpus-wide facet
  // counts `getFilters` returns), so this stays static-only rather than
  // being half-fixed with a request per keystroke for one number badge.
  //
  // `catalog` gates BOTH the computation and (below, in `scopeItems`) whether
  // a count is shown at all -- returning 0 here would render "Packages (0)"
  // next to a scope that plainly has packages, which is a wrong answer, not
  // an absent one. No badge is the honest state in REST mode.
  const counts = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || !catalog) return { icons: 0, packages: 0, categories: 0 };
    const icons = catalog.icons.filter((i) => `${i.name} ${i.tags.join(' ')}`.toLowerCase().includes(term)).length;
    const packages = catalog.packages.filter((p) => p.label.toLowerCase().includes(term)).length;
    const categories = new Set(catalog.icons.map((i) => i.category)).size
      ? [...new Set(catalog.icons.map((i) => i.category))].filter((c) => c.toLowerCase().includes(term)).length
      : 0;
    return { icons, packages, categories };
  }, [q, catalog]);

  const placeholder = scope === 'packages' ? t('sidebar.filterPackages') : scope === 'categories' ? t('sidebar.filterCategories') : scope === 'all' ? t('sidebar.searchEverything') : t('sidebar.filterIcons');

  // `all` has no count of its own -- it is the union, so a number there would be wrong
  // rather than merely redundant.
  const scopeItems = SCOPES.map((sc) => ({
    id: sc.id,
    label: t(sc.key),
    supportingText: catalog && q.trim() && sc.id !== 'all' ? String(counts[sc.id]) : undefined,
  }));

  return (
    <div className="pt-2.5 px-2.5 pb-1.5 flex gap-[5px]">
      {/*
       * Untitled UI's Select is data-driven: `items` plus a render callback, rather than
       * shadcn's Trigger/Content/Value element tree. The per-scope match count moves from
       * a hand-styled span into `supportingText`, which the design system also folds into
       * the item's `textValue` -- so typeahead now matches the count as well, and screen
       * readers announce it as part of the option instead of as loose text.
       */}
      <Select
        size="sm"
        aria-label={t('sidebar.searchScope')}
        items={scopeItems}
        selectedKey={scope}
        onSelectionChange={(key) => setSearchScope(key as SearchScope)}
        className="w-32 flex-none"
      >
        {(item) => <Select.Item {...item} />}
      </Select>
      <div className="relative flex-1">
        {/*
         * `InputBase`, not `Input`. The wrapper spreads unrecognised props onto react-aria's
         * `TextField`, which renders a div, and `useShortcuts` focuses this field by
         * querying `input[data-role="icon-filter"]`. `InputBase` spreads straight onto the
         * `<input>`, so both the attribute and the event-shaped `onChange` survive.
         * `shortcuts.spec.ts` fails if that ever stops being true.
         *
         * The leading icon is the design system's `icon` prop rather than an absolutely
         * positioned `Glyph`: it owns the offset and sizing per input size. `Glyph` stays
         * for standalone glyphs; component props take the icon component itself.
         */}
        <InputBase
          data-role="icon-filter"
          size="sm"
          icon={SearchMd}
          value={q}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          inputClassName={q ? 'pe-7' : undefined}
        />
        {q && (
          <button onClick={clear} title={t('common.clear')} className="absolute end-[5px] top-1.5 w-[18px] h-[18px] border-0 bg-transparent cursor-pointer rounded-[4px]">
            <Glyph name="close" size={10} color="var(--muted-fg)" />
          </button>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11px] text-[var(--muted-fg)]">
      <span>{label}</span>
      <span style={{ ...mono, color: 'var(--fg)' }}>{value}</span>
    </div>
  );
}
