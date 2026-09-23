
import { Glyph } from '@/components/ui/Glyph';
import { Popover } from '@/components/ui/Popover';
import { iconBtn, menuItem } from '@/components/ui/controls';
import { modKey } from '@/core/format';
import { useT } from '@/hooks/useT';
import { useAppStore } from '@/hooks/useStoreApi';

/**
 * HelpMenu — the header "info" button as a dropdown (plan Part A): About Ichava /
 * Documentation / Replay product tour / Keyboard shortcuts (⌘K → command palette).
 * Replaces the old direct-open-About behavior.
 */
export function HelpMenu() {
  const openLayer = useAppStore((s) => s.openLayer);
  const startTour = useAppStore((s) => s.startTour);
  const docsUrl = useAppStore((s) => s.config?.about.links.find((l) => l.label.toLowerCase() === 'docs')?.href ?? 'https://opensource.simtabi.com/documentation/ichava/browser/');
  const mod = modKey();
  const t = useT();

  return (
    <Popover
      align="right"
      width={230}
      panelStyle={{ padding: 6, top: 35 }}
      trigger={(_o, toggle) => (
        <button onClick={toggle} title={t('help.title')} style={iconBtn()}>
          <Glyph name="info" color="currentColor" />
        </button>
      )}
    >
      {(close) => (
        <>
          <button style={menuItem} onClick={() => { openLayer('about'); close(); }}>
            <Glyph name="info" size={14} color="var(--muted-fg)" />
            <span className="flex-1 text-start">{t('help.about')}</span>
          </button>
          <a href={docsUrl} target="_blank" rel="noreferrer" style={{ ...menuItem, textDecoration: 'none' }} onClick={close}>
            <Glyph name="text" size={14} color="var(--muted-fg)" />
            <span className="flex-1 text-start text-[var(--fg)]">{t('help.docs')}</span>
          </a>
          <button style={menuItem} onClick={() => { startTour(); close(); }}>
            <Glyph name="sparkles" size={14} color="var(--muted-fg)" />
            <span className="flex-1 text-start">{t('help.replayTour')}</span>
          </button>
          <button style={menuItem} onClick={() => { openLayer('palette'); close(); }}>
            <Glyph name="command" size={14} color="var(--muted-fg)" />
            <span className="flex-1 text-start">{t('help.shortcuts')}</span>
            <kbd className="font-[family-name:'Geist_Mono',monospace] text-[10px] py-[1px] px-[5px] border border-[var(--border)] rounded-[4px] text-[var(--muted-fg)]">{mod}K</kbd>
          </button>
        </>
      )}
    </Popover>
  );
}
