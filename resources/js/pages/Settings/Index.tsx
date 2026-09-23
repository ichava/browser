import { usePage } from '@inertiajs/react';

interface Props {
  preferences: Record<string, unknown>;
  [key: string]: unknown;
}

export default function SettingsIndex() {
  const { preferences } = usePage<Props>().props;

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — Settings/Index</p>
      <h1 className="mt-1 text-2xl font-semibold">Settings</h1>
      <p className="theme-text-secondary mt-1 text-sm">
        {Object.keys(preferences).length} preference groups
      </p>
    </div>
  );
}
