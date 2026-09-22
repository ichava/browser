import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { Glyph } from '@js/components/ui/Glyph';
import { useT } from '@js/hooks/useT';
import { useAppStore } from '@js/hooks/useStoreApi';

/**
 * ContextMenu — a REUSABLE, data-driven context menu (plan Part D). Renders whatever
 * `store.ctx.items` supplies (label/icon/run/danger/disabled/divider/kbd), so any
 * component can `openCtx(x, y, items, title?)`. Cursor-positioned with a measured
 * viewport clamp; roving arrow-key/Enter/Home/End nav + role=menu; closes on outside
 * click / Escape / scroll / resize.
 */
export function ContextMenu() {
  const ctx = useAppStore((s) => s.ctx);
  const closeCtx = useAppStore((s) => s.closeCtx);
  const t = useT();
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // Measure then clamp within the viewport (variable-length menus never overflow).
  useLayoutEffect(() => {
    if (!ctx) {
      setPos(null);
      return;
    }
    const el = menuRef.current;
    const w = el?.offsetWidth ?? 210;
    const h = el?.offsetHeight ?? 176;
    setPos({
      x: Math.max(8, Math.min(ctx.x, window.innerWidth - w - 8)),
      y: Math.max(8, Math.min(ctx.y, window.innerHeight - h - 8)),
    });
  }, [ctx]);

  // Focus the first enabled item for keyboard nav.
  useEffect(() => {
    if (!ctx) return;
    const t = setTimeout(() => menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)')?.focus(), 0);
    return () => clearTimeout(t);
  }, [ctx]);

  useEffect(() => {
    if (!ctx) return;
    const close = () => closeCtx();
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [ctx, closeCtx]);

  if (!ctx) return null;

  // Portalled to <body> (OUTSIDE the zoomed app-root): its fixed pointer coords
  // (ctx.x/ctx.y = clientX/clientY, un-zoomed viewport space) then match 1:1, so
  // the menu lands under the cursor at any UI Zoom.

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not(:disabled)') ?? []);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const list = items();
    const idx = list.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') { e.preventDefault(); closeCtx(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); list[(idx + 1) % list.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(idx - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus(); }
  };

  return createPortal(
    <>
      <div onClick={closeCtx} onContextMenu={(e) => { e.preventDefault(); closeCtx(); }} className="fixed inset-0 z-88" />
      <div
        ref={menuRef}
        role="menu"
        aria-label={ctx.title ?? t('contextMenu.actions')}
        onKeyDown={onKeyDown}
        data-region="context-menu"
        style={{
          position: 'fixed',
          top: pos?.y ?? ctx.y,
          left: pos?.x ?? ctx.x,
          minWidth: 200,
          visibility: pos ? 'visible' : 'hidden',
          zIndex: 89,
          background: 'var(--pop)',
          border: '1px solid var(--border)',
          borderRadius: 'min(calc(var(--radius) + 2px), 10px)',
          boxShadow: 'var(--shadow-elevated)',
          animation: 'ichIn .1s ease',
          overflow: 'hidden',
          fontSize: 'var(--app-font, 13.5px)',
        }}
      >
        {ctx.title && (
          <div className="flex items-center gap-2 py-2 px-2.5 border-b border-b-[var(--border)]">
            <span className="font-[family-name:'Geist_Mono',monospace] text-[12px] font-semibold">{ctx.title}</span>
          </div>
        )}
        <div className="p-1 flex flex-col">
          {ctx.items.map((it, i) =>
            it.divider ? (
              <div key={`d-${i}`} role="separator" className="h-[1px] bg-[var(--border)] my-1 mx-1.5" />
            ) : (
              <button
                key={`${it.label}-${i}`}
                role="menuitem"
                disabled={it.disabled}
                onClick={() => { it.run?.(); closeCtx(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  height: 30,
                  padding: '0 8px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 6,
                  cursor: it.disabled ? 'default' : 'pointer',
                  color: it.disabled ? 'var(--faint-fg)' : it.danger ? 'var(--danger)' : 'var(--fg)',
                  fontSize: 12.5,
                  textAlign: 'start',
                  opacity: it.disabled ? 0.6 : 1,
                }}
                onMouseEnter={(e) => !it.disabled && (e.currentTarget.style.background = it.danger ? 'var(--danger-soft)' : 'var(--muted)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onFocus={(e) => !it.disabled && (e.currentTarget.style.background = it.danger ? 'var(--danger-soft)' : 'var(--muted)')}
                onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {it.icon && <Glyph name={it.icon} size={14} color={it.danger ? 'var(--danger)' : 'var(--muted-fg)'} />}
                <span className="flex-1">{it.label}</span>
                {it.kbd && <kbd className="font-[family-name:'Geist_Mono',monospace] text-[10px] py-[1px] px-[5px] border border-[var(--border)] rounded-[4px] text-[var(--muted-fg)]">{it.kbd}</kbd>}
              </button>
            ),
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
