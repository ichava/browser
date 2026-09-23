import { useEffect, useMemo, useRef, useState } from 'react';

import { useRepo } from '@/hooks/useRepo';
import { useT } from '@/hooks/useT';
import { SearchMd } from '@untitledui/icons';
import { Glyph } from '@/components/ui/Glyph';
import { InputBase } from '@/components/base/input/input';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Badge } from '@/components/base/badges/badges';
import { Collection } from 'react-aria-components';
import { Folder, Package } from '@untitledui/icons';
import { TreeView } from '@/components/application/tree-view/tree-view';
import { useAppStore } from '@/hooks/useStoreApi';

/**
 * One row's worth of data.
 *
 * Flattened deliberately: the tree renders three levels with the same shape, so the
 * selection state and the toggle for a row are computed once here rather than recomputed
 * inside three nested render callbacks. `kind` is what the row styling keys off.
 */
type TreeNodeData = {
  id: string;
  label: string;
  count: number;
  kind: 'pack' | 'cat' | 'sub';
  /** Fully selected. */
  selected: boolean;
  /** Some descendant is selected but not all -- reported as aria-checked="mixed". */
  partial: boolean;
  toggle: () => void;
  icon?: typeof Folder;
  children: TreeNodeData[];
};

const VARIANT_DEFS: { id: string | null }[] = [{ id: null }, { id: 'outline' }, { id: 'filled' }, { id: 'color' }];

/** Variant segmented band (All / Outline N / Filled N / Color N) with live counts. */
function VariantBand({ counts }: { counts: Map<string, number> }) {
  const variant = useAppStore((s) => s.filters.variant);
  const setVariant = useAppStore((s) => s.setVariant);
  const t = useT();
  const defs = VARIANT_DEFS.filter((v) => v.id === null || v.id === 'outline' || v.id === 'filled' || (counts.get(v.id) ?? 0) > 0);
  return (
    <div role="radiogroup" aria-label={t('sidebar.iconVariant')} className="mb-2 flex gap-[3px] rounded-lg bg-[var(--muted2)] p-[3px]">
      {defs.map((v) => {
        const active = variant === v.id;
        const count = v.id ? counts.get(v.id) ?? 0 : null;
        return (
          <button
            key={String(v.id)}
            role="radio"
            aria-checked={active}
            onClick={() => setVariant(v.id)}
            className={`flex h-[26px] flex-1 cursor-pointer items-center justify-center gap-1 rounded-md text-[11.5px] transition-colors ${active ? 'bg-primary font-semibold text-foreground shadow-[var(--shadow)]' : 'font-medium text-tertiary'}`}
          >
            {t(`variant.${v.id ?? 'all'}`)}
            {/*
             * `--muted-fg`, not `--faint-fg`. This count sits on the segmented track
             * (`--muted2`), and the quaternary grey only clears AA against pure white --
             * it measures 4.74:1 on `--bg` but 4.35:1 here. The count is information, not
             * decoration, so it takes the tertiary grey; `--faint-fg` stays for text on
             * `--bg` only. `contrast.spec.ts` fails if it lands on a darker surface again.
             */}
            {count !== null && <span className={`font-mono text-[10px] ${active ? 'text-primary' : 'text-[var(--muted-fg)]'}`}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Categories panel rebuilt on the Kibo UI Tree: package → category → subcategory with
 *  checkbox multi-select (indeterminate parents), counts, tree lines + animated expand. */
export function CategoryTree() {
  const { tree, variantCounts } = useRepo();
  const filters = useAppStore((s) => s.filters);
  const catQ = useAppStore((s) => s.catQ);
  const setCatQ = useAppStore((s) => s.setCatQ);
  const clearCats = useAppStore((s) => s.clearCats);
  const toggleCat = useAppStore((s) => s.toggleCat);
  const toggleSub = useAppStore((s) => s.toggleSub);
  const t = useT();

  const allGroups = useMemo(() => tree.map((g) => g.pack), [tree]);
  const allCatKeys = useMemo(
    () => tree.flatMap((g) => g.cats.filter((c) => c.sub?.length).map((c) => `${g.pack}/${c.name}`)),
    [tree],
  );

  // Controlled expand (local — expand state isn't persisted). Default: all packages open.
  const [expanded, setExpanded] = useState<string[]>([]);
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && allGroups.length) {
      initRef.current = true;
      setExpanded(allGroups); // packages open, categories collapsed by default
    }
  }, [allGroups]);
  const fullyExpanded = allGroups.every((p) => expanded.includes(p)) && allCatKeys.every((k) => expanded.includes(k));
  const toggleExpandAll = () => setExpanded(fullyExpanded ? [] : [...allGroups, ...allCatKeys]);

  /**
   * The repo tree, shaped for `TreeView`.
   *
   * Selection is derived here rather than in the render callbacks because it is not a
   * simple flag: a category counts as *partially* selected when some of its subcategories
   * are in `filters.subs` but the category itself is not in `filters.categories`. That is
   * the state react-aria's own selection model cannot represent, and the reason the tree
   * runs with `selectionMode="none"` while these checkboxes carry the filter.
   */
  const treeItems = useMemo<TreeNodeData[]>(
    () =>
      tree.map((grp) => ({
        id: grp.pack,
        label: grp.label,
        count: grp.count,
        kind: 'pack' as const,
        selected: false,
        partial: false,
        toggle: () => {},
        icon: Package,
        children: grp.cats.map((cat) => {
          const hasSubs = !!cat.sub?.length;
          const whole = filters.categories.includes(cat.name);
          const someSub = hasSubs && cat.sub!.some((sc) => filters.subs.includes(`${cat.name}/${sc.slug}`));
          return {
            id: `${grp.pack}/${cat.name}`,
            label: cat.name,
            count: cat.count,
            kind: 'cat' as const,
            selected: whole,
            partial: !whole && someSub,
            toggle: () => toggleCat(cat.name),
            icon: Folder,
            children: (cat.sub ?? []).map((sc) => ({
              id: `${grp.pack}/${cat.name}/${sc.slug}`,
              label: sc.name,
              count: sc.count,
              kind: 'sub' as const,
              selected: filters.subs.includes(`${cat.name}/${sc.slug}`),
              partial: false,
              toggle: () => toggleSub(cat.name, sc.slug),
              children: [],
            })),
          };
        }),
      })),
    [tree, filters.categories, filters.subs, toggleCat, toggleSub],
  );

  const hasSelection = filters.categories.length > 0 || filters.subs.length > 0;

  return (
    <div className="-mx-[10px] mt-3 border-y border-[var(--border)] px-[10px] pt-[10px] pb-2">
      <div className="flex items-center gap-1.5 px-0.5 pb-2">
        <h2 className="m-0 text-[11px] font-semibold text-tertiary">{t('sidebar.categories')}</h2>
        <span className="flex-1" />
        {hasSelection && (
          <button onClick={clearCats} className="cursor-pointer border-none bg-none p-0.5 text-[11px] text-tertiary">
            {t('common.clear')}
          </button>
        )}
        <button
          onClick={toggleExpandAll}
          title={fullyExpanded ? t('sidebar.collapseAll') : t('sidebar.expandAll')}
          aria-label={fullyExpanded ? t('sidebar.collapseAll') : t('sidebar.expandAll')}
          className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-[5px] border border-[var(--border)] bg-primary text-tertiary"
        >
          <Glyph name={fullyExpanded ? 'chevron-up' : 'plus'} size={11} color="currentColor" />
        </button>
      </div>

      <div className="relative mb-2">
        <InputBase
          size="sm"
          icon={SearchMd}
          value={catQ}
          onChange={(e) => setCatQ(e.target.value)}
          placeholder={t('sidebar.filterCategories')}
          aria-label={t('sidebar.filterCategories')}
          inputClassName={catQ ? 'pe-7' : undefined}
        />
        {catQ && (
          <button onClick={() => setCatQ('')} title={t('common.clear')} className="absolute end-[5px] top-[5.5px] flex h-[17px] w-[17px] cursor-pointer items-center justify-center rounded-full border-none bg-[var(--faint-fg)] text-[var(--bg)]">
            <Glyph name="close" size={8} color="currentColor" />
          </button>
        )}
      </div>

      <VariantBand counts={variantCounts} />

      {tree.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 px-2 py-[18px] text-tertiary">
          <Glyph name="search" size={16} color="var(--faint-fg)" />
          <span className="text-center text-[12px]">{t('empty.noResults')}</span>
        </div>
      ) : (
        <TreeView
          size="sm"
          showConnectors
          aria-label={t('sidebar.categories')}
          selectionMode="none"
          items={treeItems}
          expandedKeys={expanded}
          onExpandedChange={(keys) => setExpanded([...keys] as string[])}
        >
          {(node) => (
            <TreeView.Item id={node.id} textValue={node.label}>
              <TreeView.ItemContent>
                <span className="flex w-full items-center gap-1.5">
                  {/*
                   * Our own checkbox, not the tree's `selectionMode="multiple"` one.
                   *
                   * react-aria models selection as a flat Set of keys. This filter is
                   * tri-state and spans two arrays: a category can be wholly selected
                   * (`filters.categories`) or partially selected because some of its
                   * subcategories are (`filters.subs`), which is `aria-checked="mixed"`.
                   * A Set cannot express that, so the tree supplies structure, roles,
                   * arrow-key navigation and expansion, and the filter model stays here.
                   *
                   * The wrapper stops the press reaching the row, which would otherwise
                   * toggle expansion at the same time as the filter.
                   */}
                  {node.kind !== 'pack' && (
                    <span onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="flex items-center">
                      <Checkbox
                            slot={null}
                        isSelected={node.selected}
                        isIndeterminate={node.partial}
                        onChange={node.toggle}
                        aria-label={`Select ${node.label}`}
                      />
                    </span>
                  )}
                  {node.icon && <node.icon className="size-3.5 shrink-0 text-fg-quaternary" />}
                  <span className={node.kind === 'pack' ? 'font-mono text-[11.5px] font-semibold' : node.kind === 'cat' ? 'truncate text-[12.5px] capitalize' : 'truncate text-[12px] text-tertiary'}>
                    {node.label}
                  </span>
                  <Badge
                    type="color"
                    color="gray"
                    size="sm"
                    className={`ms-auto h-4 min-w-4 justify-center rounded px-1 font-mono text-[10px] ${node.selected || node.partial ? 'text-primary' : 'text-[var(--muted-fg)]'}`}
                  >
                    {node.count}
                  </Badge>
                </span>
              </TreeView.ItemContent>

              <Collection items={node.children}>
                {(child: TreeNodeData) => (
                  <TreeView.Item id={child.id} textValue={child.label}>
                    <TreeView.ItemContent>
                      <span className="flex w-full items-center gap-1.5">
                        <span onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="flex items-center">
                          <Checkbox
                            slot={null}
                            isSelected={child.selected}
                            isIndeterminate={child.partial}
                            onChange={child.toggle}
                            aria-label={`Select ${child.label}`}
                          />
                        </span>
                        {child.icon && <child.icon className="size-3.5 shrink-0 text-fg-quaternary" />}
                        <span className={child.kind === 'cat' ? 'truncate text-[12.5px] capitalize' : 'truncate text-[12px] text-tertiary'}>
                          {child.label}
                        </span>
                        <Badge
                          type="color"
                          color="gray"
                          size="sm"
                          className={`ms-auto h-4 min-w-4 justify-center rounded px-1 font-mono text-[10px] ${child.selected || child.partial ? 'text-primary' : 'text-[var(--muted-fg)]'}`}
                        >
                          {child.count}
                        </Badge>
                      </span>
                    </TreeView.ItemContent>

                    <Collection items={child.children}>
                      {(grand: TreeNodeData) => (
                        <TreeView.Item id={grand.id} textValue={grand.label}>
                          <TreeView.ItemContent>
                            <span className="flex w-full items-center gap-1.5">
                              <span onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()} className="flex items-center">
                                <Checkbox slot={null} isSelected={grand.selected} onChange={grand.toggle} aria-label={`Select ${grand.label}`} />
                              </span>
                              <span className="truncate text-[12px] text-tertiary">{grand.label}</span>
                              <Badge
                                type="color"
                                color="gray"
                                size="sm"
                                className={`ms-auto h-4 min-w-4 justify-center rounded px-1 font-mono text-[10px] ${grand.selected ? 'text-primary' : 'text-[var(--muted-fg)]'}`}
                              >
                                {grand.count}
                              </Badge>
                            </span>
                          </TreeView.ItemContent>
                        </TreeView.Item>
                      )}
                    </Collection>
                  </TreeView.Item>
                )}
              </Collection>
            </TreeView.Item>
          )}
        </TreeView>
      )}
    </div>
  );
}
