
import { useT } from '@js/hooks/useT';
import { Glyph } from '@js/components/ui/Glyph';
import { Popover } from '@js/components/ui/Popover';
import { menuItem } from '@js/components/ui/controls';
import { useAppStore } from '@js/hooks/useStoreApi';

/**
 * AccountMenu — the signed-in avatar + dropdown (plan Part B). Identity is
 * `auth.user ?? config.user`; the workspace switcher + tier badges come from
 * config. Guest state renders a "Sign in" button in AppHeader instead of this.
 */
export function AccountMenu() {
  const authUser = useAppStore((s) => s.auth.user);
  const config = useAppStore((s) => s.config);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useAppStore((s) => s.setActiveWorkspace);
  const openLayer = useAppStore((s) => s.openLayer);
  const openShared = useAppStore((s) => s.openShared);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const signOut = useAppStore((s) => s.signOut);
  const showToast = useAppStore((s) => s.showToast);
  const t = useT();

  const user = authUser ?? (config ? { name: config.user.name, initials: config.user.initials, email: config.user.email, plan: config.user.plan } : null);
  if (!user) return null;
  const workspaces = config?.user.workspaces ?? [];

  const confirmSignOut = () =>
    openConfirm({
      title: t('profile.signOutTitle'),
      body: t('profile.signOutBody'),
      confirmLabel: t('common.signOut'),
      danger: true,
      onConfirm: () => { signOut(); showToast(t('profile.signedOut'), 'check'); },
    });

  return (
    <Popover
      align="right"
      width={230}
      panelStyle={{ padding: 6, top: 35 }}
      trigger={(_o, toggle) => (
        <button
          onClick={toggle}
          title={`${t('account.account')} — ${user.name}`}
          className="w-[30px] h-[30px] ml-1 rounded-full border-0 bg-[var(--accent)] text-[var(--accent-fg)] text-[11px] font-bold cursor-pointer"
        >
          {user.initials}
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="flex items-center gap-[9px] p-2 border-b border-b-[var(--border)] mb-1">
            <div className="w-[30px] h-[30px] rounded-full bg-[var(--accent)] text-[var(--accent-fg)] text-[11px] font-bold flex items-center justify-center flex-none">
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-[600] flex items-center gap-[5px]">
                {user.name}
                <span className="text-[9px] font-bold text-[var(--accent-text)] bg-[var(--accent-soft)] rounded-[4px] py-[1px] px-[5px]">{user.plan}</span>
              </div>
              <div className="text-[10.5px] text-[var(--muted-fg)] whitespace-nowrap overflow-hidden text-ellipsis">{user.email}</div>
            </div>
          </div>

          {workspaces.length > 0 && <div className="pt-1 px-2 pb-0.5 text-[10px] font-semibold text-[var(--faint-fg)]">{t('account.workspace')}</div>}
          {workspaces.map((w) => {
            const active = w.id === activeWorkspaceId;
            return (
              <button key={w.id} style={menuItem} onClick={() => { setActiveWorkspace(w.id); showToast(t('profile.switched', { name: w.name }), 'check'); close(); }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--accent)' : 'var(--border)', flex: 'none' }} />
                <span className="flex-1 text-start">{w.name}</span>
                <span className="text-[9px] font-semibold text-[var(--faint-fg)] mr-1">{w.plan}</span>
                {active && <Glyph name="check" size={11} color="var(--accent-text)" />}
              </button>
            );
          })}

          <div className="h-[1px] bg-[var(--border)] my-1 mx-0" />
          <button style={menuItem} onClick={() => { openLayer('profile'); close(); }}>
            <Glyph name="settings" size={14} color="var(--muted-fg)" />
            <span className="flex-1 text-start">{t('account.profile')}</span>
          </button>
          <button style={menuItem} onClick={() => { openShared(); close(); }}>
            <Glyph name="folder" size={14} color="var(--muted-fg)" />
            <span className="flex-1 text-start">{t('account.sharedCollections')}</span>
          </button>
          <button style={menuItem} onClick={() => { close(); confirmSignOut(); }}>
            <Glyph name="close" size={14} color="var(--danger)" />
            <span className="flex-1 text-start text-[var(--danger)]">{t('common.signOut')}…</span>
          </button>
        </>
      )}
    </Popover>
  );
}
