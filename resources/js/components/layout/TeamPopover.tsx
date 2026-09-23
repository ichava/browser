
import { Popover } from '@/components/ui/Popover';
import { useT } from '@/hooks/useT';
import { useAppStore, useStoreApi } from '@/hooks/useStoreApi';

const avatarBase: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 9,
  fontWeight: 700,
  color: 'var(--accent-fg)',
  background: 'var(--accent)',
  border: '2px solid var(--bg)',
};

/**
 * TeamPopover — workspace presence (mockup Team button). Avatar stack of online
 * members from `config.team`; the dropdown lists members with online status, the
 * active workspace, and a shareable invite link. Config-driven, no backend calls.
 */
export function TeamPopover() {
  const storeApi = useStoreApi();
  const config = useAppStore((s) => s.config);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const authed = useAppStore((s) => s.auth.status === 'authed');
  const t = useT();
  // Team presence is an enhanced, account-tied feature — guests sign in to unlock.
  if (!config || config.features.presence === false || !authed) return null;

  const team = config.team ?? [];
  const online = team.filter((m) => m.online);
  const workspace = config.user.workspaces.find((w) => w.id === activeWorkspaceId) ?? config.user.workspaces[0];
  if (!team.length) return null;
  const PALETTE = config.ui.avatarPalette?.length ? config.ui.avatarPalette : DEFAULT_PALETTE;

  return (
    <Popover
      align="right"
      width={250}
      panelStyle={{ padding: 0 }}
      trigger={(_o, toggle) => (
        <button onClick={toggle} title={`${t('team.online', { n: online.length })} · ${workspace?.name ?? t('team.title')}`} className="flex items-center ps-2 h-[30px] border-0 bg-transparent cursor-pointer">
          {online.slice(0, 3).map((m, i) => (
            <div key={m.initials} style={{ ...avatarBase, marginInlineStart: i === 0 ? 0 : -8, background: PALETTE[i % PALETTE.length] }}>{m.initials}</div>
          ))}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-2 py-[9px] px-3 border-b border-b-[var(--border)]">
            <span className="text-[12px] font-[650]">{t('team.title')}</span>
            <span className="font-[family-name:'Geist_Mono',monospace] text-[9.5px] text-[var(--faint-fg)]">{workspace?.name}</span>
            <span className="flex-1" />
            <span className="text-[10px] text-[var(--muted-fg)]">{t('team.online', { n: online.length })}</span>
          </div>
          <div className="p-1">
            {team.map((m, i) => {
              const status = m.status ?? (m.online ? 'online' : 'offline');
              const dot = status === 'online' ? 'var(--success)' : status === 'away' ? 'var(--warning)' : 'var(--border)';
              const label = status === 'online' ? t('team.onlineNow') : status === 'away' ? t('team.away') : t('team.offline');
              return (
                <div key={m.initials} className="flex items-center gap-[9px] h-9 py-0 px-2 rounded-[6px]">
                  <div style={{ ...avatarBase, border: 'none', background: PALETTE[i % PALETTE.length] }}>{m.initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-[550]">{m.name}</div>
                    <div className="text-[10px] text-[var(--faint-fg)]">{label}</div>
                  </div>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot }} />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5 py-2 px-3 border-t border-t-[var(--border)]">
            <button
              onClick={() => { storeApi.getState().openShared(); close(); }}
              className="flex-1 h-7 border border-[var(--border)] rounded-[calc(var(--radius)_-_3px)] bg-[var(--bg)] text-[var(--fg)] text-[11px] cursor-pointer"
            >
              {t('account.sharedCollections')}
            </button>
            <button
              onClick={() => { storeApi.getState().openInvite(); close(); }}
              className="flex-1 h-7 border-0 rounded-[calc(var(--radius)_-_3px)] bg-[var(--accent)] text-[var(--accent-fg)] text-[11px] font-semibold cursor-pointer"
            >
              {t('team.invite')}
            </button>
          </div>
        </>
      )}
    </Popover>
  );
}

const DEFAULT_PALETTE = ['#7c3aed', '#0891b2', '#059669', '#e11d48', '#ea580c'];
