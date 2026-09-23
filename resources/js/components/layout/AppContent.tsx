import { useRef } from 'react';

import { useRepo } from '@js/hooks/useRepo';
import { useCopy } from '@js/hooks/useClipboard';
import { useT } from '@js/hooks/useT';
import { Button } from '@js/components/base/buttons/button';
import { IconTile } from '@js/components/browser/IconTile';
import { VirtualGrid } from '@js/components/browser/VirtualGrid';
import { IconAsset } from '@js/components/ui/IconAsset';
import { Glyph } from '@js/components/ui/Glyph';
import { snippets } from '@js/core/SnippetFactory';
import { getSvgParts } from '@js/core/svgCache';
import { densityMetrics, tileMinWidth } from '@js/core/appScale';
import type { Icon } from '@js/core/model';
import type { CopyFormat } from '@js/core/types';
import { useAppStore } from '@js/hooks/useStoreApi';
import { useInertiaMutations } from '@js/hooks/useInertiaMutations';

// Build a copy payload, fetching the real SVG body for the "svg" format so it is
// never an empty placeholder (multicolor icons keep their fills). Shared shape
// with IconTile's copy path.
async function copyText(icon: Icon, format: CopyFormat, o: { size: number; unit: string; color: string | null }): Promise<string> {
  if (format === 'svg') {
    const parts = await Promise.resolve(getSvgParts(icon));
    return snippets.svgFromParts(icon, parts, o);
  }
  return snippets.build(format, icon, o);
}

const VIRTUALIZE_ABOVE = 120;

export function AppContent({ loading }: { loading: boolean }) {
  const { page } = useRepo();
  const view = useAppStore((s) => s.view);
  const filters = useAppStore((s) => s.filters);
  const size = useAppStore((s) => s.size);
  const density = useAppStore((s) => s.density);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const selectAllPacks = useAppStore((s) => s.selectAllPacks);
  const catalog = useAppStore((s) => s.catalog);
  const scrollRef = useRef<HTMLDivElement>(null);

  const noPacks = filters.packages.length === 0;
  const empty = !loading && !noPacks && page.total === 0;
  // Density controls only the gutter + card padding (mirrors VirtualGrid); the
  // tile box derives from the icon size, not from uiScale (that's a root zoom).
  const { gap } = densityMetrics(density);
  const minTile = tileMinWidth(size, density);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 [scrollbar-gutter:stable] bg-[var(--canvas)]">
      {loading ? (
        <SkeletonGrid />
      ) : noPacks ? (
        <Onboard onSelectAll={() => selectAllPacks((catalog?.packages ?? []).filter((p) => p.installed).map((p) => p.id))} />
      ) : empty ? (
        <EmptyState search={filters.search} onReset={resetFilters} />
      ) : view === 'grid' ? (
        page.items.length > VIRTUALIZE_ABOVE ? (
          <div role="grid" aria-label={`${page.total} icons`}>
            <VirtualGrid items={page.items} size={size} scrollRef={scrollRef} />
          </div>
        ) : (
          <div role="grid" aria-label={`${page.total} icons`} style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${minTile}px,1fr))`, gap }}>
            {page.items.map((icon) => (
              <IconTile key={icon.id} icon={icon} size={size} />
            ))}
          </div>
        )
      ) : (
        <IconList />
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-2">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="aspect-[1_/_0.92] rounded-[var(--radius)] bg-[var(--muted)] [animation:ichPulse_1.4s_ease-in-out_infinite]" />
      ))}
    </div>
  );
}

function centered(): React.CSSProperties {
  return { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, animation: 'ichFade .25s ease' };
}

function Onboard({ onSelectAll }: { onSelectAll: () => void }) {
  const t = useT();
  return (
    <div style={centered()}>
      <div className="w-10 h-10 rounded-[10px] bg-[var(--muted)] flex items-center justify-center">
        <Glyph name="package" size={20} color="var(--muted-fg)" />
      </div>
      <div className="text-[14px] font-[600]">{t('empty.onboardTitle')}</div>
      <div className="text-[12.5px] text-[var(--muted-fg)]">{t('empty.onboardDesc')}</div>
      <Button size="sm" onClick={onSelectAll} className="mt-1">
        {t('empty.selectAllPackages')}
      </Button>
    </div>
  );
}

function EmptyState({ search, onReset }: { search: string; onReset: () => void }) {
  const t = useT();
  return (
    <div style={centered()}>
      <div className="w-10 h-10 rounded-[10px] bg-[var(--muted)] flex items-center justify-center">
        <Glyph name="search" size={18} color="var(--muted-fg)" />
      </div>
      <div className="text-[14px] font-[600]">{search ? t('empty.noMatchSearch', { q: search }) : t('empty.noMatchFilters')}</div>
      <div className="text-[12.5px] text-[var(--muted-fg)]">{t('empty.tryDifferent')}</div>
      <Button color="secondary" size="sm" onClick={onReset} className="mt-1">
        {t('empty.clearFilters')}
      </Button>
    </div>
  );
}

function IconList() {
  const { page } = useRepo();
  const openDetail = useAppStore((s) => s.openDetail);
  const { toggleFavorite } = useInertiaMutations();
  const favorites = useAppStore((s) => s.favorites);
  const copyFormat = useAppStore((s) => s.copyFormat);
  const size = useAppStore((s) => s.size);
  const sizeUnit = useAppStore((s) => s.sizeUnit);
  const color = useAppStore((s) => s.color);
  const { rowH } = densityMetrics(useAppStore((s) => s.density));
  const copy = useCopy();
  const t = useT();

  return (
    <div className="flex flex-col border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
      {page.items.map((icon) => {
        const isFav = favorites.includes(icon.id);
        return (
          <div
            key={icon.id}
            role="button"
            tabIndex={0}
            aria-label={icon.name}
            onClick={() => openDetail(icon.id)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(icon.id); } }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, height: rowH, padding: '0 12px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <IconAsset icon={icon} size={18} />
            <span className="text-[12.5px] font-medium min-w-[100px] max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">{icon.name}</span>
            <span className="font-[family-name:'Geist_Mono',monospace] text-[11px] text-[var(--muted-fg)] flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{icon.id}</span>
            <button
              onClick={(e) => { e.stopPropagation(); void copyText(icon, copyFormat, { size, unit: sizeUnit, color }).then((txt) => copy(txt, t('list.copiedToast', { name: icon.name }))); }}
              className="h-[22px] py-0 px-2 border border-[var(--border)] rounded-[5px] bg-[var(--bg)] text-[11px] cursor-pointer text-[var(--fg)]"
            >
              {t('common.copy')}
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(icon.id); }} title={t('common.favorite')} className="w-[26px] h-[26px] border-0 bg-transparent cursor-pointer flex items-center justify-center">
              <Glyph name={isFav ? 'heart-filled' : 'heart'} size={14} color={isFav ? 'var(--accent)' : 'var(--faint-fg)'} />
            </button>
            <Glyph name="chevron-right" size={12} color="var(--faint-fg)" />
          </div>
        );
      })}
    </div>
  );
}
