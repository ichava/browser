
import { Glyph } from '@/components/ui/Glyph';
import { AppearancePopover } from '@/components/appearance/AppearancePopover';
import { LanguagePopover } from '@/components/layout/LanguagePopover';
import { TeamPopover } from '@/components/layout/TeamPopover';
import { AccountMenu } from '@/components/auth/AccountMenu';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import { HelpMenu } from '@/components/help/HelpMenu';
import { iconBtn } from '@/components/ui/controls';
import { Button } from '@/components/base/buttons/button';
import { Tooltip } from '@/components/ui/Tooltip';
import { modKey } from '@/core/format';
import { isDevToolsAvailable } from '@/core/env';
import { useT } from '@/hooks/useT';
import { useFullscreen } from '@/hooks/useFullscreen';
import { rem } from '@/core/appScale';
import { useAppStore } from '@/hooks/useStoreApi';

/** Top bar: brand, command trigger, view toggle, library shortcuts, appearance, theme, settings, account. */
export function AppHeader() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const openLayer = useAppStore((s) => s.openLayer);
  const openLibrary = useAppStore((s) => s.openLibrary);
  const favorites = useAppStore((s) => s.favorites);
  const authed = useAppStore((s) => s.auth.status === 'authed');
  const openAuth = useAppStore((s) => s.openAuth);
  const config = useAppStore((s) => s.config);
  const devtoolsOpen = useAppStore((s) => s.devtools.open);
  const toggleDevtools = useAppStore((s) => s.toggleDevtools);
  const devtoolsAvailable = isDevToolsAvailable(config);
  const mod = modKey();
  const t = useT();
  const [isFull, toggleFull] = useFullscreen();

  return (
    <header
      style={{
        height: rem(48),
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)',
        userSelect: 'none',
      }}
    >
      <button
        className="ich-hamburger"
        onClick={toggleSidebar}
        title={t('header.filtersPackages')}
        aria-label={t('header.toggleSidebar')}
        style={{ width: 30, height: 30, alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', background: 'var(--bg)', borderRadius: 'calc(var(--radius) - 2px)', cursor: 'pointer', color: 'var(--muted-fg)', flex: 'none' }}
      >
        <Glyph name="sliders" size={14} color="currentColor" />
      </button>
      <div className="flex items-center gap-2 flex-none">
        <div
          className="w-6 h-6 rounded-[6px] bg-[var(--accent)] flex items-center justify-center"
        >
          <Glyph name="layers" size={14} color="var(--accent-fg)" />
        </div>
        <div className="flex items-baseline gap-[5px] whitespace-nowrap">
          <span className="font-[650] text-[13.5px] tracking-[-.01em]">{config?.brand.name ?? 'Ichava'}</span>
          <span className="text-[var(--muted-fg)] text-[12.5px]">{config?.brand.suffix ?? 'Browser'}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex justify-center">
        <button
          onClick={() => openLayer('palette')}
          title={`${t('header.commandPalette')} — ${mod}K`}
          className="w-[280px] max-w-[40vw] h-[30px] flex items-center gap-2 py-0 px-2 border border-[var(--border)] rounded-[calc(var(--radius)_-_2px)] bg-[var(--muted2)] text-[var(--muted-fg)] cursor-pointer text-[12.5px]"
        >
          <Glyph name="search" size={13} color="var(--muted-fg)" />
          <span className="flex-1 text-start">{t('common.search')}</span>
          <kbd
            className="font-[family-name:'Geist_Mono',monospace] text-[10px] py-0.5 px-[5px] border border-[var(--border)] rounded-[4px] bg-[var(--bg)]"
          >
            {mod}K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip content={view === 'grid' ? t('header.listView') : t('header.gridView')}>
          <button
            onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
            aria-label={view === 'grid' ? t('header.listView') : t('header.gridView')}
            style={{ ...iconBtn(), color: 'var(--accent-text)' }}
          >
            <Glyph name={view === 'grid' ? 'grid' : 'list'} size={14} color="currentColor" />
          </button>
        </Tooltip>

        <Divider />

        <Tooltip content={t('header.favorites')} shortcut={`${mod}1`}>
        <button onClick={() => openLibrary('favorites')} aria-label={t('header.favorites')} style={{ ...iconBtn(), position: 'relative' }}>
          <Glyph name={favorites.length ? 'heart-filled' : 'heart'} color={favorites.length ? 'var(--accent)' : 'currentColor'} />
          {favorites.length > 0 && (
            <span
              className="absolute top-0.5 end-[1px] min-w-3.5 h-3.5 py-0 px-[3px] rounded-[7px] bg-[var(--accent)] text-[var(--accent-fg)] text-[9px] font-semibold flex items-center justify-center font-[family-name:'Geist_Mono',monospace]"
            >
              {favorites.length}
            </span>
          )}
        </button>
        </Tooltip>
        {config?.features.history !== false && (
          <Tooltip content={t('header.history')} shortcut={`${mod}2`}>
            <button onClick={() => openLibrary('history')} aria-label={t('header.history')} style={iconBtn()}>
              <Glyph name="clock" color="currentColor" />
            </button>
          </Tooltip>
        )}
        {config?.features.collections !== false && (
          <Tooltip content={t('header.collections')} shortcut={`${mod}3`}>
            <button onClick={() => openLibrary('collections')} aria-label={t('header.collections')} style={iconBtn()}>
              <Glyph name="folder" color="currentColor" />
            </button>
          </Tooltip>
        )}

        <NotificationsPopover />

        <TeamPopover />

        <Divider />

        <AppearancePopover />
        <LanguagePopover />
        <Tooltip content={t('header.toggleTheme')} shortcut={`${mod}T`}>
          <button onClick={toggleTheme} aria-label={t('header.toggleTheme')} style={iconBtn()}>
            <Glyph name={theme === 'dark' ? 'sun' : 'moon'} color="currentColor" />
          </button>
        </Tooltip>
        <Tooltip content={isFull ? t('header.exitFullscreen') : t('header.fullscreen')}>
          <button onClick={toggleFull} aria-label={isFull ? t('header.exitFullscreen') : t('header.fullscreen')} style={iconBtn(isFull)}>
            <Glyph name={isFull ? 'minimize' : 'resize'} color="currentColor" />
          </button>
        </Tooltip>
        {devtoolsAvailable && (
          <Tooltip content={t('header.devtools')} shortcut={`${mod}D`}>
            <button onClick={toggleDevtools} aria-label={t('header.devtools')} style={iconBtn(devtoolsOpen)}>
              <Glyph name="zap" color="currentColor" />
            </button>
          </Tooltip>
        )}
        <HelpMenu />
        <Tooltip content={t('header.settings')} shortcut={`${mod},`}>
          <button onClick={() => openLayer('settings')} aria-label={t('header.settings')} style={iconBtn()}>
            <Glyph name="settings" color="currentColor" />
          </button>
        </Tooltip>

        {authed ? (
          <AccountMenu />
        ) : (
          // No `title` prop: react-aria's Button does not forward it, and here it only
          // duplicated the visible label, which is already the accessible name.
          <Button size="sm" onClick={() => openAuth('signin')} className="ms-1">
            {t('common.signIn')}
          </Button>
        )}
      </div>
    </header>
  );
}

const Divider = () => <div className="w-[1px] h-[18px] bg-[var(--border)] my-0 mx-1" />;
