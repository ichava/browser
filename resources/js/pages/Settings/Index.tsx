import { usePage } from '@inertiajs/react';
import { FlashBanner } from '@js/components/FlashBanner';
import type { SharedProps } from '@js/types';

interface SettingsIndexProps extends SharedProps {
  preferences: Record<string, unknown>;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function SettingsIndex() {
  const { props } = usePage<SettingsIndexProps>();
  const groups = Object.entries(props.preferences ?? {});

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <p className="theme-text-muted text-xs uppercase">Configuration</p>
        <h1 className="mt-1 text-2xl font-semibold">Settings</h1>

        <FlashBanner />

        {groups.length === 0 ? (
          <p className="theme-text-muted mt-8 text-sm">No stored preferences.</p>
        ) : (
          <div className="mt-6 space-y-4">
            {groups.map(([group, values]) => (
              <section key={group} className="theme-bg-card rounded-xl border theme-border p-5">
                <h2 className="font-semibold capitalize">{group}</h2>
                <dl className="mt-3 space-y-1.5">
                  {(typeof values === 'object' && values !== null
                    ? Object.entries(values as Record<string, unknown>)
                    : [['value', values] as [string, unknown]]
                  ).map(([key, value]) => (
                    <div key={key} className="flex items-baseline justify-between gap-4 text-sm">
                      <dt className="theme-text-muted font-mono text-xs">{key}</dt>
                      <dd className="theme-text-secondary truncate font-mono text-xs">{formatValue(value)}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}

        <p className="theme-text-muted mt-6 text-xs">Editing lands with the mutation wiring in Phase 5.</p>
      </div>
    </div>
  );
}
