
import { Glyph } from '@/components/ui/Glyph';
import { Popover } from '@/components/ui/Popover';
import { iconBtn } from '@/components/ui/controls';
import { relativeTime } from '@/core/format';
import { useT } from '@/hooks/useT';
import { useAppStore } from '@/hooks/useStoreApi';

/**
 * NotificationsPopover — the header bell + unread badge + activity panel (plan
 * Part B). Items are icon + text + relative time; opening marks them read.
 * Config-driven demo data seeds the store; events (sign-in, share) push more.
 */
export function NotificationsPopover() {
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationsRead);
  const clearAll = useAppStore((s) => s.clearNotifications);
  const authed = useAppStore((s) => s.auth.status === 'authed');
  const unread = notifications.filter((n) => !n.read).length;
  const t = useT();
  // Activity/notifications are an account feature — guests sign in to unlock.
  if (!authed) return null;

  return (
    <Popover
      align="right"
      width={300}
      panelStyle={{ padding: 0, top: 35 }}
      trigger={(_o, toggle) => (
        <button onClick={() => { toggle(); if (unread) markRead(); }} title={t('header.notifications')} style={{ ...iconBtn(), position: 'relative' }}>
          <Glyph name="bell-filled" color="currentColor" />
          {unread > 0 && (
            <span
              className="absolute top-[1px] end-0 min-w-3.5 h-3.5 py-0 px-[3px] rounded-[7px] bg-[var(--danger)] text-[#fff] text-[9px] font-bold flex items-center justify-center font-[family-name:'Geist_Mono',monospace]"
            >
              {unread}
            </span>
          )}
        </button>
      )}
    >
      {() => (
        <>
          <div className="flex items-center py-[9px] px-3 border-b border-b-[var(--border)]">
            <span className="text-[12.5px] font-[650]">{t('header.notifications')}</span>
            <span className="flex-1" />
            {notifications.length > 0 && (
              <button onClick={clearAll} className="border-0 bg-transparent text-[var(--accent-text)] text-[11px] font-semibold cursor-pointer">
                {t('notifications.clearAll')}
              </button>
            )}
          </div>
          <div className="max-h-[340px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-7 px-3 text-center text-[12px] text-[var(--faint-fg)]">{t('notifications.empty')}</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="flex gap-[9px] py-2.5 px-3 border-b border-b-[var(--border)]">
                  <div style={{ width: 22, height: 22, flex: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: n.icon === 'check' ? 'rgba(22,163,74,.12)' : 'var(--accent-soft)', color: n.icon === 'check' ? 'var(--success)' : 'var(--accent)' }}>
                    <Glyph name={n.icon} size={12} color="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] leading-[1.4]">{n.text}</div>
                    <div className="text-[10px] text-[var(--faint-fg)] mt-0.5">{relativeTime(n.ts)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Popover>
  );
}
