import { usePage } from '@inertiajs/react';
import { FlashBanner } from '@js/components/FlashBanner';
import type { SharedProps } from '@js/types';

interface CommandRow {
  command: string;
  type: string;
  timestamp?: string;
  formatted_time?: string;
}

interface CommandHistoryIndexProps extends SharedProps {
  commands: CommandRow[];
  count: number;
}

export default function CommandHistoryIndex() {
  const { props } = usePage<CommandHistoryIndexProps>();

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <p className="theme-text-muted text-xs uppercase">Activity</p>
        <h1 className="mt-1 text-2xl font-semibold">Command history ({props.count})</h1>

        <FlashBanner />

        {props.commands.length === 0 ? (
          <p className="theme-text-muted mt-8 text-sm">Nothing here yet. Command palette runs land here.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {props.commands.map((entry, i) => (
              <li
                key={`${entry.command}-${i}`}
                className="theme-bg-card rounded-lg border theme-border flex items-center gap-3 px-4 py-2.5"
              >
                <span className="theme-text-primary font-mono text-sm">{entry.command}</span>
                <span className="theme-bg-muted theme-text-secondary rounded px-2 py-0.5 font-mono text-[11px]">
                  {entry.type}
                </span>
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
