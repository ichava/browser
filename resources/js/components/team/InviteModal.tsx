import { useState } from 'react';

import { useCopy } from '@js/hooks/useClipboard';
import { Input } from '@js/components/base/input/input';
import { Modal } from '@js/components/ui/Modal';
import { useT } from '@js/hooks/useT';
import { useAppStore } from '@js/hooks/useStoreApi';

const EXPIRIES = [{ v: '24h', k: 'invite.exp24h' }, { v: '7 days', k: 'invite.exp7d' }, { v: '30 days', k: 'invite.exp30d' }, { v: 'Never', k: 'invite.expNever' }];

/**
 * InviteModal — invite-to-workspace (plan Part B, mock). Email + role toggle +
 * link-expiry; "Generate link" copies a demo invite link, "Send invite" fires a
 * notification + toast. Client-side only.
 */
export function InviteModal() {
  const closeInvite = useAppStore((s) => s.closeInvite);
  const pushNotification = useAppStore((s) => s.pushNotification);
  const showToast = useAppStore((s) => s.showToast);
  const workspace = useAppStore((s) => {
    const ws = s.config?.user.workspaces ?? [];
    return ws.find((w) => w.id === s.activeWorkspaceId) ?? ws[0];
  });
  const copy = useCopy();
  const t = useT();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [expiry, setExpiry] = useState('7 days');

  const wsName = workspace?.name ?? t('invite.workspace');
  const link = `${location.origin}/ichava/invite/${workspace?.id ?? 'team'}-${role}-${expiry.replace(/\s/g, '')}`;

  return (
    <Modal onClose={closeInvite} width={520} label={t('invite.title')} panelStyle={{ padding: 0 }}>
      <div className="flex items-baseline gap-2 py-4 px-5 border-b border-b-[var(--border)]">
        <span className="text-[16px] font-[700]">{t('invite.title')}</span>
        <span className="font-[family-name:'Geist_Mono',monospace] text-[11px] text-[var(--faint-fg)]">{workspace?.id ?? wsName}</span>
      </div>
      <div className="p-5">
        <Input
          size="lg"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder={t('invite.emailPlaceholder')}
          aria-label={t('invite.emailPlaceholder')}
        />
        <div className="flex gap-2 mt-3.5">
          <Pill active={role === 'editor'} onClick={() => setRole('editor')}>{t('invite.roleEditor')}</Pill>
          <Pill active={role === 'viewer'} onClick={() => setRole('viewer')}>{t('invite.roleViewer')}</Pill>
        </div>
        <div className="flex items-center gap-2 mt-[18px]">
          <span className="text-[12.5px] font-[600]">{t('invite.linkExpires')}</span>
          <span className="flex-1" />
          {EXPIRIES.map((e) => (
            <Pill key={e.v} small active={expiry === e.v} onClick={() => setExpiry(e.v)}>{t(e.k)}</Pill>
          ))}
        </div>
        <div className="text-[12px] text-[var(--muted-fg)] leading-[1.5] mt-4">
          {t('invite.blurb')}
        </div>
      </div>
      <div className="flex justify-end gap-2 py-3.5 px-5 border-t border-t-[var(--border)]">
        <button
          onClick={() => copy(link, t('invite.linkCopied'))}
          className="h-[38px] py-0 px-4 border border-[var(--border)] rounded-[calc(var(--radius)_-_1px)] bg-[var(--bg)] text-[var(--fg)] text-[13px] font-semibold cursor-pointer"
        >
          {t('invite.generateLink')}
        </button>
        <button
          onClick={() => {
            const to = email.trim() || t('invite.yourTeammate');
            pushNotification({ icon: 'info', text: t('invite.sentNotification', { to, role }) });
            showToast(t('invite.sent'), 'check');
            closeInvite();
          }}
          className="h-[38px] py-0 px-[18px] border-0 rounded-[calc(var(--radius)_-_1px)] bg-[var(--accent)] text-[var(--accent-fg)] text-[13px] font-[650] cursor-pointer"
        >
          {t('invite.sendInvite')}
        </button>
      </div>
    </Modal>
  );
}

function Pill({ active, small, onClick, children }: { active: boolean; small?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: small ? 30 : 40,
        padding: small ? '0 12px' : '0 16px',
        borderRadius: 'calc(var(--radius) + 6px)',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-soft)' : 'var(--bg)',
        color: active ? 'var(--accent)' : 'var(--fg)',
        fontSize: 12.5,
        fontWeight: active ? 650 : 500,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
