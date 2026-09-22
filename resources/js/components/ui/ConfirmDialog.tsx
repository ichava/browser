
import { Modal } from '@js/components/ui/Modal';
import { Glyph } from '@js/components/ui/Glyph';
import { useT } from '@js/hooks/useT';
import { useAppStore } from '@js/hooks/useStoreApi';

/**
 * ConfirmDialog — one shared confirmation modal driven by the store's `confirm`
 * slice (plan Part A). Reused by reset-filters, factory-reset, sign-out. Danger
 * variant paints the confirm button red and shows an alert glyph.
 */
export function ConfirmDialog() {
  const confirm = useAppStore((s) => s.confirm);
  const close = useAppStore((s) => s.closeConfirm);
  const t = useT();
  if (!confirm) return null;
  const { title, body, confirmLabel, cancelLabel = t('common.cancel'), danger, onConfirm } = confirm;

  return (
    <Modal onClose={close} width={440} label={title} panelStyle={{ padding: 22 }}>
      <div className="flex gap-3.5">
        <div
          style={{
            width: 34,
            height: 34,
            flex: 'none',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: danger ? 'var(--danger-soft)' : 'var(--accent-soft)',
            color: danger ? 'var(--danger)' : 'var(--accent)',
          }}
        >
          <Glyph name="alert-circle" size={17} color="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-[650] mb-1.5">{title}</div>
          <div className="text-[12.5px] text-[var(--muted-fg)] leading-[1.5]">{body}</div>
          <div className="flex justify-end gap-2 mt-[18px]">
            <button onClick={close} style={btn(false)}>
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                close();
              }}
              style={btn(true, danger)}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function btn(primary: boolean, danger?: boolean): React.CSSProperties {
  return {
    height: 34,
    padding: '0 16px',
    borderRadius: 'calc(var(--radius) - 2px)',
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    border: primary ? 'none' : '1px solid var(--border)',
    background: primary ? (danger ? 'var(--danger)' : 'var(--accent)') : 'var(--bg)',
    color: primary ? '#fff' : 'var(--fg)',
  };
}
