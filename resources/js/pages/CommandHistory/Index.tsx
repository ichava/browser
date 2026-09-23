import { usePage } from '@inertiajs/react';

interface Props {
  commands: Array<Record<string, unknown>>;
  count: number;
  [key: string]: unknown;
}

export default function CommandHistoryIndex() {
  const { commands, count } = usePage<Props>().props;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — CommandHistory/Index</p>
      <h1 className="mt-1 text-2xl font-semibold">Command history ({count})</h1>
      <p className="theme-text-secondary mt-1 text-sm">{commands.length} entries</p>
    </div>
  );
}
