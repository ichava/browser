import { useAppStore } from '@js/hooks/useStoreApi';

/** Copy text with a graceful fallback + a toast, so callers stay one-liners. */
export function useCopy() {
  const showToast = useAppStore((s) => s.showToast);
  return async (text: string, label = 'Copied to clipboard') => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast(label, 'copy');
    } catch {
      showToast('Copy failed — select and copy manually', 'alert-circle');
    }
  };
}
