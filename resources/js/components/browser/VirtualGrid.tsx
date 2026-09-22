import { useEffect, useRef, useState, type RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { IconTile } from './IconTile';

import { densityMetrics, tileMinWidth } from '@js/core/appScale';
import type { Icon } from '@js/core/model';
import { useAppStore } from '@js/hooks/useStoreApi';

/**
 * VirtualGrid — row-windowed grid for large pages (plan P5). Only rows in view are
 * mounted, so a 240-icon page stays smooth. Columns are derived from the live
 * container width; the small-page path keeps the plain CSS grid (see AppContent).
 * Density controls only the gutter + card padding (never the glyph/icon size);
 * whole-app scaling is a root zoom, so tiles are NOT resized here.
 */
export function VirtualGrid({ items, size, scrollRef }: { items: Icon[]; size: number; scrollRef: RefObject<HTMLDivElement | null> }) {
  const density = useAppStore((s) => s.density);
  const { gap: GAP } = densityMetrics(density);
  // The cell must fit the glyph (rendered at `size`) plus label/affordance padding,
  // so the Size slider grows the icon — never clips it. Floor at the tile min-width.
  const minTile = tileMinWidth(size, density);
  const [width, setWidth] = useState(0);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const columns = Math.max(1, Math.floor((width + GAP) / (minTile + GAP)));
  const colWidth = columns > 0 ? (width - (columns - 1) * GAP) / columns : minTile;
  const rowHeight = colWidth + GAP; // square tiles (aspect-ratio 1/1) — keep virtualizer in sync
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan: 4,
  });
  // Re-measure rows when density/scale changes the row height.
  useEffect(() => virtualizer.measure(), [rowHeight, virtualizer]);

  return (
    <div ref={measureRef} style={{ position: 'relative', height: virtualizer.getTotalSize(), width: '100%' }}>
      {width > 0 &&
        virtualizer.getVirtualItems().map((vRow) => {
          const start = vRow.index * columns;
          const rowItems = items.slice(start, start + columns);
          return (
            <div
              key={vRow.key}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vRow.start}px)`, display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: GAP, paddingBottom: GAP }}
            >
              {rowItems.map((icon) => (
                <IconTile key={icon.id} icon={icon} size={size} />
              ))}
            </div>
          );
        })}
    </div>
  );
}
