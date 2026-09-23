import { useEffect } from 'react';

import { Glyph } from '@/components/ui/Glyph';
import { useAppStore } from '@/hooks/useStoreApi';

/** How long a toast stays up before dismissing itself. */
const DWELL_MS = 3200;

/**
 * Toaster — renders the store's toast queue.
 *
 * Replaces `sonner`. The reason is not the library: it is that `store.ts` imported
 * `toast` from it and called into a UI at the point of a state change, which is finding
 * A7 -- the state layer knowing about presentation. The store now owns a queue and this
 * component owns how a toast looks, which also means a host embedding the browser can
 * render the queue its own way, and tests can assert on it without a DOM.
 *
 * `aria-live="polite"` on the region rather than a role per toast: a screen reader
 * announces new children as they arrive without stealing focus, which is what a transient
 * confirmation wants. `role="alert"` would interrupt.
 */
export function Toaster() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);

  // One timer per toast, keyed by id, cleared on unmount so a fast unmount cannot fire a
  // dismiss into a torn-down store.
  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), DWELL_MS));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  if (!toasts.length) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed end-4 bottom-4 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="pointer-events-auto flex items-center gap-2 max-w-[360px] py-2.5 px-3 border border-[var(--border)] rounded-[min(calc(var(--radius)_+_2px),_10px)] bg-[var(--pop)] text-[var(--fg)] shadow-[var(--shadow-elevated)] text-[var(--app-font,_13.5px)] text-start cursor-pointer [animation:ichIn_.14s_ease]"
        >
          <Glyph
            name={t.icon}
            size={14}
            color={t.icon === 'alert-circle' ? 'var(--danger)' : 'var(--accent-text)'}
          />
          <span className="flex-1 min-w-0">{t.msg}</span>
        </button>
      ))}
    </div>
  );
}
