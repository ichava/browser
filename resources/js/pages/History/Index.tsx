import { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { IconAsset } from '@js/components/ui/IconAsset';
import { FlashBanner } from '@js/components/FlashBanner';
import { normalizeRawIcon, type ServerIcon } from '@js/core/propsToCatalog';
import { toIcon, type Icon } from '@js/core/model';
import type { SharedProps } from '@js/types';

interface HistoryRow {
  icon_id: number;
  action: string;
  timestamp?: string;
  formatted_time?: string;
  icon?: ServerIcon | null;
}

interface HistoryIndexProps extends SharedProps {
  history: HistoryRow[];
  count: number;
}

export default function HistoryIndex() {
  const { props } = usePage<HistoryIndexProps>();
  const showBase = `/${props.ichava.prefix}/icons`;

  const rows = useMemo(
    () =>
      props.history.map((entry) => ({
        ...entry,
        icon: entry.icon ? toIcon(normalizeRawIcon(entry.icon)) : null,
      })),
    [props.history],
  );

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <p className="theme-text-muted text-xs uppercase">Activity</p>
        <h1 className="mt-1 text-2xl font-semibold">History ({props.count})</h1>

        <FlashBanner />

        {rows.length === 0 ? (
          <p className="theme-text-muted mt-8 text-sm">Nothing here yet. Viewed, copied and downloaded icons land here.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {rows.map((entry, i) => (
              <li
                key={`${entry.icon_id}-${entry.action}-${i}`}
                className="theme-bg-card rounded-lg border theme-border flex items-center gap-3 px-4 py-2.5"
              >
                {entry.icon ? (
                  <Link href={`${showBase}/${entry.icon_id}`} className="flex-shrink-0">
                    <IconAsset icon={entry.icon as Icon} size={24} />
                  </Link>
                ) : (
                  <span className="theme-text-muted font-mono text-xs">#{entry.icon_id}</span>
                )}
                <span className="theme-text-secondary text-sm capitalize">{entry.action}</span>
                <span className="flex-1" />
                <span className="theme-text-muted text-xs">{entry.formatted_time ?? entry.timestamp ?? ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
