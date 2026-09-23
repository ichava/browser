import { usePage } from '@inertiajs/react';
import type { FlashMessages } from '@js/types';

/**
 * Inline flash banners for simple (non-shell) pages, which mount no
 * `Toaster`. Shell pages use `FlashToasts` instead.
 */
export function FlashBanner() {
  const { flash } = usePage<{ flash: FlashMessages }>().props;

  if (!flash?.success && !flash?.error) return null;

  return (
    <div className="mb-4 space-y-2">
      {flash.success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-400">
          {flash.success}
        </div>
      )}
      {flash.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {flash.error}
        </div>
      )}
    </div>
  );
}
