
import { useT } from '@/hooks/useT';
import { Modal } from '@/components/ui/Modal';
import { Glyph } from '@/components/ui/Glyph';
import { useAppStore } from '@/hooks/useStoreApi';

const sectionLabel: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: 'var(--faint-fg)', textTransform: 'uppercase', letterSpacing: '.04em' };

/**
 * ProfileModal — the user's PROFILE + account (identity, workspace, account
 * actions). Deliberately separate from the app Settings dialog, which holds app
 * behaviour/config (per-page, copy format, storage, reset). "App settings" links
 * across so the two surfaces stay distinct.
 */
export function ProfileModal() {
  const closeLayer = useAppStore((s) => s.closeLayer);
  const openLayer = useAppStore((s) => s.openLayer);
  const openConfirm = useAppStore((s) => s.openConfirm);
  const signOut = useAppStore((s) => s.signOut);
  const showToast = useAppStore((s) => s.showToast);
  const config = useAppStore((s) => s.config);
  const authUser = useAppStore((s) => s.auth.user);
  const activeWorkspaceId = useAppStore((s) => s.activeWorkspaceId);
  const setActiveWorkspace = useAppStore((s) => s.setActiveWorkspace);
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
    <Modal showClose={false} onClose={closeLayer} width={440} label={t('profile.title')}>
      <div className="flex items-center gap-2 py-3 px-4 border-b border-b-[var(--border)]">
        <Glyph name="settings" size={15} color="var(--accent-text)" />
        <span className="text-[13.5px] font-[650]">{t('profile.title')}</span>
        <span className="flex-1" />
        <button onClick={closeLayer} title={`${t('common.close')} — Esc`} aria-label={t('common.close')} className="w-[26px] h-[26px] border border-[var(--border)] bg-[var(--bg)] shadow-[var(--shadow)] rounded-[6px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
          <Glyph name="close" size={12} color="currentColor" />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* identity */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center text-[15px] font-bold">{user.initials}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-[650]">{user.name}</span>
              <span className="text-[9.5px] font-bold text-[var(--accent-text)] bg-[var(--accent-soft)] rounded-[5px] py-0.5 px-1.5">{user.plan}</span>
            </div>
            <div className="text-[12px] text-[var(--muted-fg)]">{user.email}</div>
          </div>
        </div>

        {/* workspaces */}
        {workspaces.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span style={sectionLabel}>{t('account.workspace')}</span>
            {workspaces.map((w) => {
              const active = w.id === activeWorkspaceId;
              return (
                <button
                  key={w.id}
                  onClick={() => { setActiveWorkspace(w.id); showToast(t('profile.switched', { name: w.name }), 'check'); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, height: 38, padding: '0 10px', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'calc(var(--radius) - 2px)', background: active ? 'var(--accent-soft)' : 'var(--bg)', cursor: 'pointer', color: 'var(--fg)' }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? 'var(--accent)' : 'var(--border)' }} />
                  <span className="flex-1 text-start text-[12.5px] font-[550]">{w.name}</span>
                  <span className="text-[10px] text-[var(--muted-fg)]">{w.plan}</span>
                  {active && <Glyph name="check" size={12} color="var(--accent-text)" />}
                </button>
              );
            })}
          </div>
        )}

        {/* account actions — profile is separate from app settings/config */}
        <div className="flex flex-col gap-1.5">
          <span style={sectionLabel}>{t('profile.account')}</span>
          <button
            onClick={() => openLayer('settings')}
            className="flex items-center gap-[9px] h-[38px] py-0 px-2.5 border border-[var(--border)] rounded-[calc(var(--radius)_-_2px)] bg-[var(--bg)] cursor-pointer text-[var(--fg)]"
          >
            <Glyph name="sliders" size={14} color="var(--muted-fg)" />
            <span className="flex-1 text-start text-[12.5px]">{t('profile.appSettings')}</span>
            <Glyph name="chevron-right" size={12} color="var(--faint-fg)" />
          </button>
          <button
            onClick={() => { closeLayer(); confirmSignOut(); }}
            className="flex items-center gap-[9px] h-[38px] py-0 px-2.5 border border-[var(--border)] rounded-[calc(var(--radius)_-_2px)] bg-[var(--bg)] cursor-pointer text-[var(--danger)]"
          >
            <Glyph name="close" size={14} color="var(--danger)" />
            <span className="flex-1 text-start text-[12.5px] font-[550]">{t('common.signOut')}…</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
