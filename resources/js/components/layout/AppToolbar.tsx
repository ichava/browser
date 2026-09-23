import { useMemo } from 'react';

import { useRepo } from '@/hooks/useRepo';
import { useCopy } from '@/hooks/useClipboard';
import { Glyph } from '@/components/ui/Glyph';
import { Popover } from '@/components/ui/Popover';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { Stars01 as SparkleIcon } from '@untitledui/icons';
import { Select } from '@/components/base/select/select';
import { toolBtn, menuItem } from '@/components/ui/controls';
import { num, modKey } from '@/core/format';
import { useT } from '@/hooks/useT';
import { iconRef } from '@/core/SnippetFactory';
import { exporter, type ExportFormat } from '@/core/ExportService';
import type { Icon } from '@/core/model';
import type { SortKey, Treatment, SizeUnit } from '@/core/types';
import { CONFIG_DEFAULTS } from '@/core/config';
import { rem } from '@/core/appScale';
import { useAppStore } from '@/hooks/useStoreApi';
import { Slider } from '@/components/base/slider/slider';

// Option lists come from config (CONFIG_DEFAULTS fallback) — no hardcoding.
const EXPORTS = CONFIG_DEFAULTS.toolbar.exportFormats as { id: ExportFormat; label: string; desc: string; icon?: string }[];
const SORTS = CONFIG_DEFAULTS.toolbar.sortOptions as { id: SortKey; label: string }[];
const TREATMENTS = CONFIG_DEFAULTS.toolbar.treatments as { id: Treatment; label: string; desc: string }[];
const UNITS = CONFIG_DEFAULTS.toolbar.sizeUnits as SizeUnit[];

interface Chip {
  key: string;
  label: string;
  remove: () => void;
}

export function AppToolbar() {
  const { page, repo } = useRepo();
  const filters = useAppStore((s) => s.filters);
  const setSearch = useAppStore((s) => s.setSearch);
  const toggleCat = useAppStore((s) => s.toggleCat);
  const setVariant = useAppStore((s) => s.setVariant);
  const setSort = useAppStore((s) => s.setSort);
  const toggleOrder = useAppStore((s) => s.toggleOrder);
  const size = useAppStore((s) => s.size);
  const setSize = useAppStore((s) => s.setSize);
  const sizeUnit = useAppStore((s) => s.sizeUnit);
  const setSizeUnit = useAppStore((s) => s.setSizeUnit);
  const gridStroke = useAppStore((s) => s.gridStroke);
  const setGridStroke = useAppStore((s) => s.setGridStroke);
  const color = useAppStore((s) => s.color);
  const setColor = useAppStore((s) => s.setColor);
  const treatment = useAppStore((s) => s.treatment);
  const setTreatment = useAppStore((s) => s.setTreatment);
  const selection = useAppStore((s) => s.selection);
  const clearSelection = useAppStore((s) => s.clearSelection);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const showToast = useAppStore((s) => s.showToast);
  const config = useAppStore((s) => s.config);
  const copy = useCopy();
  const t = useT();
  const mod = modKey();
  // Slider bounds + feature flags come from config (was hardcoded / inert).
  const ranges = config?.ranges ?? CONFIG_DEFAULTS.ranges;
  const features = config?.features ?? CONFIG_DEFAULTS.features;

  const confirmReset = () =>
    openConfirm({
      title: t('toolbar.resetTitle'),
      body: t('toolbar.resetBody'),
      confirmLabel: t('toolbar.resetConfirm'),
      danger: true,
      onConfirm: () => {
        resetFilters();
        showToast(t('toolbar.resetToast'), 'refresh');
      },
    });

  const chips = useMemo<Chip[]>(() => {
    const out: Chip[] = [];
    if (filters.search) out.push({ key: 'q', label: `“${filters.search}”`, remove: () => setSearch('') });
    for (const c of filters.categories) out.push({ key: `c-${c}`, label: c, remove: () => toggleCat(c) });
    if (filters.variant) out.push({ key: 'v', label: filters.variant, remove: () => setVariant(filters.variant) });
    return out;
  }, [filters, setSearch, toggleCat, setVariant]);


  return (
    <div
      // Stable hook for the visual-regression suite, matching the data-region convention
      // already used by the context menu and credits scroller.
      data-region="toolbar"
      style={{
        minHeight: rem(42),
        flex: 'none',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '6px 8px',
        padding: '5px 12px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span className="text-[12px] text-[var(--muted-fg)] whitespace-nowrap">
        {num(page.total)} {page.total === 1 ? t('toolbar.iconOne') : t('toolbar.iconMany')}
      </span>

      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.remove}
          title={t('toolbar.removeFilter')}
          className="flex items-center gap-[5px] h-[22px] py-0 px-[7px] border border-[var(--border)] rounded-[11px] bg-[var(--accent-soft)] text-[var(--accent-text)] text-[11px] font-medium cursor-pointer capitalize"
        >
          <span>{chip.label}</span>
          <Glyph name="close" size={8} color="currentColor" />
        </button>
      ))}

      {features.multiSelect !== false && selection.length > 0 && (
        <div className="flex items-center gap-1.5 pl-1">
          <span className="text-[11.5px] text-[var(--accent-text)] font-semibold">{t('toolbar.selected', { n: selection.length })}</span>
          <button
            onClick={async () => {
                      const icons = await selectedIcons(selection, repo, page.items);
              copy(icons.map((i) => iconRef(i)).join('\n'), t('toolbar.namesCopied', { n: selection.length }));
            }}
            className="h-[22px] py-0 px-2 border border-[var(--border)] rounded-[calc(var(--radius)_-_3px)] bg-[var(--bg)] text-[11px] cursor-pointer text-[var(--fg)]"
          >
            {t('toolbar.copyNames')}
          </button>
          <Popover
            align="left"
            width={190}
            panelStyle={{ padding: 4 }}
            trigger={(_o, toggle) => (
              <button onClick={toggle} className="h-[22px] py-0 px-2 border border-[var(--border)] rounded-[calc(var(--radius)_-_3px)] bg-[var(--bg)] text-[11px] cursor-pointer text-[var(--fg)] flex items-center gap-[5px]">
                <Glyph name="download" size={10} color="currentColor" /> {t('toolbar.export')} <Glyph name="chevron-down" size={8} color="var(--muted-fg)" />
              </button>
            )}
          >
            {(close) => (
              <>
                {EXPORTS.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={async () => {
                      close();
              const icons = await selectedIcons(selection, repo, page.items);
                      await exporter.export(ex.id, icons);
                      showToast(t('toolbar.exportedToast', { n: icons.length, label: ex.label }), 'download');
                    }}
                    style={{ ...menuItem, height: 'auto', padding: '7px 9px', gap: 10 }}
                  >
                    {ex.icon && (
                      <div className="w-[26px] h-[26px] flex-none rounded-[7px] bg-[var(--muted)] flex items-center justify-center">
                        <Glyph name={ex.icon} size={14} color="var(--muted-fg)" />
                      </div>
                    )}
                    <div className="flex-1 text-start">
                      <div className="text-[12.5px] font-[600]">{ex.label}</div>
                      <div className="text-[10.5px] text-[var(--muted-fg)]">{ex.desc}</div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </Popover>
          <button onClick={clearSelection} className="h-[22px] py-0 px-2 border-0 bg-transparent text-[11px] cursor-pointer text-[var(--muted-fg)]">{t('common.clear')}</button>
        </div>
      )}

      <span className="flex-1" />

      {/*
       * `supportingText` is deliberately NOT in `items`, only on the rendered item. The
       * trigger reads the selected entry straight out of `items`, and it renders label
       * and supportingText side by side in a flex row where only the label truncates --
       * so carrying the description in `items` let "Original pack strokes" squeeze
       * "Stroke" out of the trigger entirely. Descriptions belong in the list.
       *
       * No `label` prop either: that renders a field label ABOVE the trigger, which in a
       * single-row toolbar pushed this control out of alignment with its neighbours. The
       * old shadcn markup used that string as a group header inside the popover, which
       * the vendored Select has no equivalent for; see U10.
       */}
      {features.treatments && (
        <Select
          size="sm"
          aria-label={t('toolbar.treatment')}
          icon={SparkleIcon}
          items={TREATMENTS.map((tr) => ({ id: tr.id, label: tr.label }))}
          selectedKey={treatment}
          onSelectionChange={(key) => setTreatment(key as Treatment)}
          className="w-36 flex-none"
        >
          {(item) => <Select.Item {...item} supportingText={TREATMENTS.find((tr) => tr.id === item.id)?.desc} />}
        </Select>
      )}

      {/* Sort */}
      {/*
       * The trigger used to read "Sort: Name". Untitled UI's SelectValue renders the
       * selected item's own label, so the prefix moves out to a sibling caption -- the
       * same idiom this toolbar already uses for Size and Stroke, rather than a bespoke
       * trigger that reformats its value.
       */}
      <span style={label}>{t('toolbar.sort')}</span>
      <Select
        size="sm"
        aria-label={t('toolbar.sort')}
        items={SORTS.map((so) => ({ id: so.id, label: so.label }))}
        selectedKey={filters.sortBy}
        onSelectionChange={(key) => setSort(key as SortKey)}
        className="w-32 flex-none"
      >
        {(item) => <Select.Item {...item} />}
      </Select>

      <button onClick={toggleOrder} title={t('toolbar.toggleSortOrder')} style={{ ...toolBtn, width: 28, padding: 0, justifyContent: 'center', color: 'var(--muted-fg)' }}>
        <Glyph name={filters.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc'} size={13} color="currentColor" />
      </button>

      <Divider />

      <div className="flex items-center gap-[7px]">
        <span style={label}>{t('toolbar.size')}</span>
        {/* The Slider track is w-full, so the fixed width lives on a wrapper. The value
            readout stays as the sibling span below, which is why labelPosition is default
            (hidden) rather than one of the built-in positions.

            The 12px inline padding is half the thumb: the thumb is `size-6` centred on the
            track position, so near either end it overhangs the track and, with only a 7px
            flex gap, printed on top of the caption to its left. Padding the wrapper insets
            the track instead of shrinking the thumb, so the control keeps the design
            system's hit area. */}
        <div className="w-[104px] px-3">
          <Slider
            minValue={ranges.size.min}
            maxValue={ranges.size.max}
            step={ranges.size.step}
            value={size}
            onChange={(v) => setSize(v as number)}
            aria-label={t('toolbar.gridIconSize')}
            formatOptions={{ style: 'decimal' }}
          />
        </div>
        <span style={{ ...mono, fontSize: 10.5, color: 'var(--muted-fg)', minWidth: 52, textAlign: 'right' }}>{size}{sizeUnit === 'px' ? 'px' : ` ${sizeUnit}`}</span>
        <Select
          size="sm"
          aria-label={t('toolbar.sizeUnit')}
          items={UNITS.map((u) => ({ id: u, label: u }))}
          selectedKey={sizeUnit}
          onSelectionChange={(key) => setSizeUnit(key as SizeUnit)}
          className="w-20 flex-none"
          popoverClassName="min-w-20"
        >
          {(item) => <Select.Item {...item} />}
        </Select>
      </div>

      <Divider />

      <div className="flex items-center gap-[7px]" title={t('toolbar.strokeTitle')}>
        <span style={label}>{t('toolbar.stroke')}</span>
        <div className="w-[88px] px-3">
          <Slider
            minValue={ranges.stroke.min}
            maxValue={ranges.stroke.max}
            step={ranges.stroke.step}
            value={gridStroke}
            onChange={(v) => setGridStroke(v as number)}
            aria-label={t('toolbar.stroke')}
            formatOptions={{ style: 'decimal', maximumFractionDigits: 2 }}
          />
        </div>
        <span style={{ ...mono, fontSize: 10.5, color: 'var(--muted-fg)', minWidth: 40, textAlign: 'right' }}>{gridStroke.toFixed(2)}</span>
      </div>

      <Divider />

      <Popover
        align="right"
        width={196}
        panelStyle={{ padding: 10 }}
        trigger={(_o, toggle) => (
          <button onClick={toggle} title={t('toolbar.previewColor')} style={{ ...toolBtn, padding: '0 8px' }}>
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: color ?? 'linear-gradient(135deg,var(--fg),var(--muted-fg))', border: '1px solid var(--border)' }} />
            <span className="text-[11.5px]">{t('toolbar.color')}</span>
            <Glyph name="chevron-down" size={9} color="currentColor" />
          </button>
        )}
      >
        {() => (
          <>
            <ColorPicker value={color} onChange={setColor} />
          </>
        )}
      </Popover>

      <button
        onClick={confirmReset}
        title={`${t('toolbar.resetFilters')} — ${mod}R`}
        style={{ ...toolBtn, width: 28, padding: 0, justifyContent: 'center', border: 'none', background: 'transparent', color: 'var(--muted-fg)' }}
      >
        <Glyph name="refresh" size={13} color="currentColor" />
      </button>
    </div>
  );
}

/**
 * Resolve selected ids to `Icon` records.
 *
 * Called from event handlers (copy names, export), not render, so this can be
 * a plain async function -- no hook, no rules-of-hooks concern -- unlike
 * `useResolvedIcons`, which exists for the render-time equivalent of this same
 * resolution (favorites/history/collections).
 *
 * Checks `pageItems` (the currently-rendered page) first, since a selection is
 * almost always a subset of what is on screen.
 */
async function selectedIcons(
  ids: number[],
  repo: ReturnType<typeof useRepo>['repo'],
  pageItems: Icon[],
): Promise<Icon[]> {
  if (repo) {
    return ids.map((id) => repo.byId(id)).filter((i): i is Icon => Boolean(i));
  }

  const onPage = new Map(pageItems.map((i) => [i.id, i] as const));
  return ids.map((id) => onPage.get(id)).filter((i): i is Icon => Boolean(i));
}

const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: 'var(--muted-fg)' };
const mono: React.CSSProperties = { fontFamily: "'Geist Mono',monospace" };
const Divider = () => <div className="w-[1px] h-[18px] bg-[var(--border)] my-0 mx-0.5" />;
