import { useEffect } from 'react';
import { toListParams } from '@/store';
import { IconRepository } from '@/core/IconRepository';
import { useStoreApi } from '@/hooks/useStoreApi';

/**
 * Platform-aware keyboard shortcuts, ported 1:1 from the mockup behavior spec:
 * ⌘K palette · ⌘T theme · ⌘, settings · ⌘1/2/3 library tabs · ⌘R reset · Esc closes.
 * Grid keys (F favorite / C copy / X select) are handled on the focused tile.
 */
export function useShortcuts() {
  const storeApi = useStoreApi();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const s = storeApi.getState();
      const target = e.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') {
        // Radix Modal/Popover overlays self-close; only the docked DevTools panel
        // (not a Radix modal) needs a manual Esc branch, before falling to `layer`.
        if (s.devtools.open) {
          s.toggleDevtools();
          e.preventDefault();
          return;
        }
        if (s.layer) {
          s.closeLayer();
          e.preventDefault();
        }
        return;
      }
      // "/" focuses the sidebar filter (parity with the Vue unified search).
      if (e.key === '/' && !mod && !typing) {
        const input = document.querySelector<HTMLInputElement>('input[data-role="icon-filter"]');
        if (input) {
          e.preventDefault();
          input.focus();
        }
        return;
      }
      if (!mod) return;

      switch (e.key.toLowerCase()) {
        case 'k':
          e.preventDefault();
          s.openLayer(s.layer === 'palette' ? null : 'palette');
          break;
        case 't':
          if (typing) return;
          e.preventDefault();
          s.toggleTheme();
          break;
        case ',':
          e.preventDefault();
          s.openLayer('settings');
          break;
        case '1':
          e.preventDefault();
          s.openLibrary('favorites');
          break;
        case '2':
          e.preventDefault();
          s.openLibrary('history');
          break;
        case '3':
          e.preventDefault();
          s.openLibrary('collections');
          break;
        case 'r':
          if (typing) return;
          e.preventDefault();
          s.openConfirm({
            title: 'Reset all filters?',
            body: 'Search, categories, variants, sort, page, selection and preview color return to defaults. Favorites, collections and appearance are untouched.',
            confirmLabel: 'Reset filters',
            danger: true,
            onConfirm: () => {
              s.resetFilters();
              s.showToast('Filters reset', 'refresh');
            },
          });
          break;
        case 'd':
          if (typing) return;
          if (!s.config || s.config.features.devtools === false) return;
          e.preventDefault();
          s.toggleDevtools();
          break;
        case 'a': {
          if (typing || !s.catalog) return;
          e.preventDefault();
          const page = new IconRepository(s.catalog).page(toListParams(s.filters));
          s.setSelection(page.items.map((i) => i.id));
          break;
        }
        default:
          break;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [storeApi]);
}
