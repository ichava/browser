import { useState } from 'react';

import { useCopy } from '@js/hooks/useClipboard';
import { useT } from '@js/hooks/useT';
import { IconAsset } from '@js/components/ui/IconAsset';
import { Glyph } from '@js/components/ui/Glyph';
import { snippets, iconRef } from '@js/core/SnippetFactory';
import { getSvgParts } from '@js/core/svgCache';
import type { Icon } from '@js/core/types';
import { useAppStore } from '@js/hooks/useStoreApi';
import { useInertiaMutations } from '@js/hooks/useInertiaMutations';
import { TILE_MIN } from '@js/core/appScale';

const toolBtn: React.CSSProperties = {
  width: 25,
  height: 25,
  border: '1px solid var(--border)',
  borderRadius: 6,
  background: 'var(--pop)',
  boxShadow: 'var(--shadow)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--fg)',
};

export function IconTile({ icon, size }: { icon: Icon; size: number }) {
  const [hover, setHover] = useState(false);
  const showLabels = useAppStore((s) => s.showLabels);
  const copyFormat = useAppStore((s) => s.copyFormat);
  const sizeUnit = useAppStore((s) => s.sizeUnit);
  const gridStroke = useAppStore((s) => s.gridStroke);
  const color = useAppStore((s) => s.color);
  const favorites = useAppStore((s) => s.favorites);
  const selection = useAppStore((s) => s.selection);
  const openDetail = useAppStore((s) => s.openDetail);
  const toggleSelect = useAppStore((s) => s.toggleSelect);
  const multiSelect = useAppStore((s) => s.config?.features.multiSelect !== false);
  const { toggleFavorite, pushHistory } = useInertiaMutations();
  const openCtx = useAppStore((s) => s.openCtx);
  const copy = useCopy();
  const t = useT();

  const isFav = favorites.includes(icon.id);
  const isSel = selection.includes(icon.id);
  // The grid Size slider drives the ACTUAL icon size — render the glyph at `size`
  // (the cell grows to fit it in VirtualGrid), not a capped preview.
  const glyphSize = size;

  // Build the copy payload, fetching the real SVG body for the "svg" format so it
  // is never an empty placeholder (and multicolor icons keep their fills).
  const buildCopyText = async (): Promise<string> => {
    const o = { size, unit: sizeUnit, color, strokeWidth: gridStroke };
    if (copyFormat === 'svg') {
      const parts = await Promise.resolve(getSvgParts(icon));
      return snippets.svgFromParts(icon, parts, o);
    }
    return snippets.build(copyFormat, icon, o);
  };
  const copyTo = (toast: string) => {
    void buildCopyText().then((text) => copy(text, toast));
    pushHistory(icon.id, 'copied');
  };
  const doCopy = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    copyTo(`Copied ${copyFormat} · ${icon.name}`);
  };

  // Data-driven context-menu items for this tile (plan Part D — reusable openCtx).
  const openMenu = (x: number, y: number) =>
    openCtx(x, y, [
      { label: t('tile.openDetail'), icon: 'eye', run: () => { openDetail(icon.id); pushHistory(icon.id, 'viewed'); } },
      { label: t('tile.copyFormat', { format: copyFormat }), icon: 'copy', run: () => copyTo(t('list.copiedToast', { name: icon.name })) },
      { label: t('tile.copyName'), icon: 'text', run: () => copy(iconRef(icon), t('tile.copiedName')) },
      { label: t('tile.copyPermalink'), icon: 'link', run: () => copy(`${location.origin}${location.pathname}?icon=${icon.id}`, t('tile.permalinkCopied')) },
      { label: '', divider: true },
      ...(multiSelect ? [{ label: isSel ? t('tile.deselect') : t('tile.select'), icon: 'check', run: () => toggleSelect(icon.id) }] : []),
      { label: isFav ? t('tile.removeFavorite') : t('tile.addFavorite'), icon: isFav ? 'heart-filled' : 'heart', danger: isFav, run: () => toggleFavorite(icon.id) },
    ], iconRef(icon));

  // Grid keyboard shortcuts on the focused tile (mockup spec): Enter/Space open,
  // F favorite, C copy, X select.
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        openDetail(icon.id);
        pushHistory(icon.id, 'viewed');
        break;
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFavorite(icon.id);
        break;
      case 'c':
      case 'C':
        e.preventDefault();
        doCopy(e);
        break;
      case 'x':
      case 'X':
        e.preventDefault();
        if (multiSelect) toggleSelect(icon.id);
        break;
      case 'ContextMenu':
        e.preventDefault();
        {
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          openMenu(r.left + r.width / 2, r.top + r.height / 2);
        }
        break;
      default:
        // Shift+F10 opens the context menu (a11y).
        if (e.shiftKey && e.key === 'F10') {
          e.preventDefault();
          const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
          openMenu(r.left + r.width / 2, r.top + r.height / 2);
        }
        break;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${icon.name} — ${iconRef(icon)}${isFav ? `, ${t('tile.favoritedAria')}` : ''}${isSel ? `, ${t('tile.selectedAria')}` : ''}`}
      aria-pressed={isSel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      onKeyDown={onKeyDown}
      onClick={() => { openDetail(icon.id); pushHistory(icon.id, 'viewed'); }}
      onContextMenu={(e) => { e.preventDefault(); openMenu(e.clientX, e.clientY); }}
      title={iconRef(icon)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        aspectRatio: '1 / 1',
        // Same floor as the grid track; see TILE_MIN. A tile wider than its column
        // overlaps its neighbour instead of honouring the gap.
        minWidth: TILE_MIN,
        overflow: 'hidden',
        borderRadius: 'var(--radius)',
        // Old Vue design: every tile carries a resting card border; hover/select
        // promote it to the accent colour with a soft glow ring (the 3px spread
        // fits inside the 8px compact grid gutter).
        border: `1px solid ${isSel || hover ? 'var(--accent)' : 'var(--border)'}`,
        // A raised card on the sunken canvas. `transparent` made every tile the exact
        // colour of the page, so the grid read as one flat field separated only by
        // hairlines -- worst in dark mode, where page and tile were both #0a0a0a.
        background: isSel ? 'var(--accent-soft)' : 'var(--surface)',
        boxShadow: isSel || hover ? '0 0 0 3px var(--accent-soft)' : 'none',
        cursor: 'pointer',
        contentVisibility: 'auto',
      }}
    >
      {hover && (
        <>
          {multiSelect && (
          <button
            onClick={(e) => { e.stopPropagation(); toggleSelect(icon.id); }}
            title={`${t('tile.select')} — X`}
            aria-label={isSel ? t('tile.deselect') : t('tile.select')}
            style={{ position: 'absolute', top: 4, insetInlineStart: 4, width: 16, height: 16, borderRadius: 4, border: `1px solid ${isSel ? 'var(--accent)' : 'var(--border)'}`, background: isSel ? 'var(--accent)' : 'var(--pop)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}
          >
            {isSel && <Glyph name="check" size={9} color="var(--accent-fg)" />}
          </button>
          )}
          <div className="absolute top-1 end-1 flex gap-[3px] z-3">
            <button onClick={doCopy} title={`${t('common.copy')} — C`} style={toolBtn}>
              <Glyph name="copy" size={13.5} color="currentColor" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(icon.id); }} title={`${t('common.favorite')} — F`} style={toolBtn}>
              <Glyph name={isFav ? 'heart-filled' : 'heart'} size={13.5} color={isFav ? 'var(--accent)' : 'currentColor'} />
            </button>
          </div>
        </>
      )}
      {isFav && !hover && (
        <Glyph name="heart-filled" size={13} color="var(--accent-text)" style={{ position: 'absolute', top: 6, insetInlineEnd: 6, zIndex: 2 }} />
      )}

      <IconAsset icon={icon} size={glyphSize} />
      {showLabels && (
        <span className="max-w-[90%] text-[10px] text-[var(--muted-fg)] whitespace-nowrap overflow-hidden text-ellipsis">{icon.name}</span>
      )}
    </div>
  );
}
