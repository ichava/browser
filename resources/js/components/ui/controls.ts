import type { CSSProperties } from 'react';

/** Shared control styles so header/toolbar/footer buttons stay pixel-consistent. */

export const iconBtn = (active = false): CSSProperties => ({
  width: 30,
  height: 30,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: active ? 'var(--accent-soft)' : 'transparent',
  borderRadius: 'calc(var(--radius) - 2px)',
  cursor: 'pointer',
  color: active ? 'var(--accent)' : 'var(--muted-fg)',
  flex: 'none',
});

export const segBtn = (active: boolean): CSSProperties => ({
  height: 24,
  padding: '0 9px',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  border: 'none',
  background: active ? 'var(--pop)' : 'transparent',
  color: active ? 'var(--fg)' : 'var(--muted-fg)',
  borderRadius: 'calc(var(--radius) - 3px)',
  fontSize: 11.5,
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  boxShadow: active ? 'var(--shadow)' : 'none',
});

export const toolBtn: CSSProperties = {
  height: 28,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '0 9px',
  border: '1px solid var(--border)',
  borderRadius: 'calc(var(--radius) - 3px)',
  background: 'var(--bg)',
  cursor: 'pointer',
  color: 'var(--fg)',
  fontSize: 12,
};

export const menuItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  height: 30,
  padding: '0 8px',
  border: 'none',
  background: 'transparent',
  borderRadius: 'calc(var(--radius) - 3px)',
  cursor: 'pointer',
  color: 'var(--fg)',
  fontSize: 12.5,
};

export const segWrap: CSSProperties = {
  display: 'flex',
  gap: 2,
  border: '1px solid var(--border)',
  borderRadius: 'calc(var(--radius) - 2px)',
  padding: 2,
  background: 'var(--muted2)',
};

// The popover caret is now rendered by Popover.tsx and positioned in CSS off Radix's
// data-side/data-align (see .ich-caret in theme.css) — the old static caret() helper
// was removed with the intelligent-caret change (plan Part B).
