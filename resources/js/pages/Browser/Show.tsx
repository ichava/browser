import { usePage } from '@inertiajs/react';
import type { RawIcon } from '../../core/model';

interface Props {
  icon: RawIcon | null;
  related: RawIcon[];
  [key: string]: unknown;
}

export default function BrowserShow() {
  const { icon, related } = usePage<Props>().props;

  if (!icon) {
    return (
      <div className="theme-bg-page theme-text-primary min-h-screen p-8">
        <p className="theme-text-muted text-sm">Icon not found.</p>
      </div>
    );
  }

  return (
    <div className="theme-bg-page theme-text-primary min-h-screen p-8">
      <p className="theme-text-muted text-xs uppercase">Phase 3 placeholder — Browser/Show</p>
      <h1 className="mt-1 text-2xl font-semibold">{icon.name}</h1>
      <p className="theme-text-secondary mt-1 text-sm">
        {icon.package} · {related.length} related
      </p>
    </div>
  );
}
