import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { useStore } from '@js/store';
import type { FlashMessages } from '@js/types';

/**
 * Bridge server flash messages into the store toast queue (rendered by the
 * shell's `Toaster`). Renders nothing. Each distinct message fires once,
 * keyed on its content, so re-renders and preserveState visits do not
 * duplicate it.
 */
export function FlashToasts() {
  const { flash } = usePage<{ flash: FlashMessages }>().props;
  const showToast = useStore((s) => s.showToast);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const [kind, message] of Object.entries(flash ?? {})) {
      if (typeof message !== 'string' || !message) continue;
      const key = `${kind}:${message}`;
      if (seen.current.has(key)) continue;
      seen.current.add(key);
      showToast(message, kind === 'error' ? 'alert-circle' : 'check');
    }
  }, [flash, showToast]);

  return null;
}
