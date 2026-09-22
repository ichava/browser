
import { Glyph } from '@js/components/ui/Glyph';
import { Popover } from '@js/components/ui/Popover';
import { iconBtn } from '@js/components/ui/controls';
import { useT } from '@js/hooks/useT';
import { LOCALES, type Locale } from '@js/core/i18n';
import { useAppStore } from '@js/hooks/useStoreApi';

/**
 * LanguagePopover — a globe-triggered locale picker for the app navbar. Lists the
 * advertised locales by endonym, checks the active one, and writes `store.locale`
 * (shared with the Appearance popover's selector and persisted under `ichava.locale`).
 * The landing uses a sibling switcher over the same key.
 */
export function LanguagePopover() {
  const locale = useAppStore((s) => s.locale);
  const setLocale = useAppStore((s) => s.setLocale);
  const t = useT();
  const active = LOCALES.find((l) => l.code === locale);

  return (
    <Popover
      align="right"
      width={188}
      panelStyle={{ padding: 5 }}
      trigger={(open, toggle) => (
        <button onClick={toggle} title={`${t('appearance.language')} — ${active?.label ?? ''}`} aria-label={t('appearance.language')} style={iconBtn(open)}>
          <Glyph name="globe" color="currentColor" />
        </button>
      )}
    >
      {(close) => (
        <div role="menu" aria-label={t('appearance.language')} className="flex flex-col">
          {LOCALES.map((l) => {
            const on = l.code === locale;
            return (
              <button
                key={l.code}
                role="menuitemradio"
                aria-checked={on}
                onClick={() => { setLocale(l.code as Locale); close(); }}
                dir={l.dir}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  height: 32,
                  padding: '0 9px',
                  border: 'none',
                  background: on ? 'var(--accent-soft)' : 'transparent',
                  borderRadius: 7,
                  cursor: 'pointer',
                  color: on ? 'var(--accent)' : 'var(--fg)',
                  fontSize: 12.5,
                  fontWeight: on ? 650 : 500,
                  textAlign: 'start',
                }}
                onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = 'var(--muted)'; }}
                onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent'; }}
              >
                <span className="flex-1 text-start">{l.label}</span>
                <span className="font-[family-name:'Geist_Mono',monospace] text-[10px] text-[var(--faint-fg)] uppercase">{l.code}</span>
                {on && <Glyph name="check" size={13} color="var(--accent-text)" />}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}
