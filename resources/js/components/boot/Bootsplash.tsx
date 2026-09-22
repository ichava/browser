// Pure rendering for the boot splash (R7) -- consumes useBootsplash()'s state and
// produces the exact DOM shape (same `ichbs__*` classes) the vendored engine's
// _html()/_barHtml()/_ringHtml()/_logHtml()/_counterHtml() built as raw HTML
// strings, so bootsplash.css (moved here verbatim) needs no changes at all.
import { createPortal } from 'react-dom';
import { BootIcon } from './BootIcon';
import './bootsplash.css';
import type { BootConfig } from './bootsplashConfig';
import { logItemsSteps, logItemsTree, logWindow, rowStatus } from './bootsplashEngine';
import type { BootsplashHandle } from './useBootsplash';

const NS = 'ichbs';

function fmt(n: number): string {
  return (n || 0).toLocaleString();
}

export function Bootsplash({ boot, isBody = true }: { boot: BootsplashHandle; isBody?: boolean }) {
  const { config: c, state: s, isIndeterminate: indet } = boot;
  const pct = indet ? 0 : s.pct;

  const th = c.theme === 'auto'
    ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : c.theme;

  let statusClass = '';
  if (c.contextColors !== false) {
    if (s.phase === 'error') statusClass = `${NS}--status-error`;
    else if (s.phase === 'ready' || s.phase === 'complete') statusClass = `${NS}--status-success`;
  }

  const rootClass = [
    NS,
    isBody ? `${NS}--fullpage` : `${NS}--inline`,
    `${NS}--${th}`,
    `${NS}--bg-${c.background}`,
    `${NS}--layout-${c.layout}`,
    `${NS}--align-${c.align}`,
    indet && `${NS}--indeterminate`,
    c.reduceMotion && `${NS}--reduce`,
    statusClass,
    s.phase === 'complete' && 'is-complete',
    s.phase === 'hidden' && 'is-hidden',
  ].filter(Boolean).join(' ');

  const rootStyle: Record<string, string> = { [`--${NS}-progress`]: String(pct) };
  if (!statusClass && c.brand.accent) {
    rootStyle[`--${NS}-accent`] = c.brand.accent;
    rootStyle[`--${NS}-accent-soft`] = `color-mix(in srgb, ${c.brand.accent} 16%, transparent)`;
  }

  const node = (
    <div
      className={rootClass}
      style={rootStyle as React.CSSProperties}
      role="status"
      aria-live={s.phase === 'error' ? 'assertive' : 'polite'}
      aria-busy={s.phase === 'loading'}
      dir={c.rtl ? 'rtl' : 'ltr'}
    >
      {c.background === 'aurora' && (
        <div className={`${NS}__aurora`}>
          <div className={`${NS}__aurora-blob ${NS}__aurora-blob--a`} />
          <div className={`${NS}__aurora-blob ${NS}__aurora-blob--b`} />
        </div>
      )}
      <Banner config={c} state={s} />
      <div className={`${NS}__stack`}>
        <Logo config={c} />
        <Wordmark config={c} />
        {c.footer.enabled && <BrandMeta config={c} />}
        {c.showStat && <StatLine config={c} />}
        {s.phase === 'error' && <ErrorPanel config={c} onRetry={boot.retry} />}
        {s.phase === 'ready' && <ReadyPanel config={c} />}
        {s.phase !== 'offline' && s.phase !== 'error' && s.phase !== 'ready' && (
          <Progress config={c} state={s} indet={indet} pct={pct} />
        )}
        {c.showStats && s.phase !== 'offline' && s.phase !== 'error' && s.phase !== 'ready' && <StatsStrip config={c} state={s} />}
        {c.showCancel && s.phase !== 'offline' && s.phase !== 'error' && s.phase !== 'ready' && s.phase !== 'complete' && (
          <button className={`${NS}__cancel`} onClick={boot.cancel} type="button">{c.i18n.cancel}</button>
        )}
        {c.tips.enabled && s.phase !== 'error' && s.phase !== 'offline' && c.tips.items.length > 0 && (
          <div className={`${NS}__tip`}>
            <BootIcon name="tip" />
            <span className={`${NS}__tip-text`}>{c.tips.items[s.tipIdx % c.tips.items.length]}</span>
          </div>
        )}
      </div>
      {c.footer.enabled && (c.footer.version || c.footer.env) && (
        <div className={`${NS}__footer`}>
          <span>{c.footer.version}</span>
          {c.footer.env && <span className={`${NS}__env`}>{c.footer.env}</span>}
        </div>
      )}
    </div>
  );

  return isBody ? createPortal(node, document.body) : node;
}

function Banner({ config: c, state: s }: { config: BootConfig; state: BootsplashHandle['state'] }) {
  const offline = s.phase === 'offline';
  const showProgress = !offline && s.phase !== 'error' && s.phase !== 'ready';
  if (!offline && !(s.slow && showProgress)) return null;
  return (
    <div className={`${NS}__banner ${NS}__banner--${offline ? 'offline' : 'slow'} ${NS}__banner--pos-${c.notice.position}`}>
      <BootIcon name={offline ? 'offline' : 'clock'} />
      <span className={`${NS}__banner-text`}>{offline ? c.i18n.offline : c.i18n.slow}</span>
    </div>
  );
}

function Logo({ config: c }: { config: BootConfig }) {
  const logo = c.brand.logo;
  return (
    <div className={`${NS}__logo`}>
      {logo.type === 'image' && logo.value ? (
        <img src={logo.value} alt="" />
      ) : logo.type === 'emoji' ? (
        <span className={`${NS}__logo-text`}>{logo.value || '✨'}</span>
      ) : logo.type === 'initials' ? (
        <span className={`${NS}__logo-text`}>{(c.brand.name || '').slice(0, 2).toUpperCase()}</span>
      ) : (
        <BootIcon name="layers" />
      )}
    </div>
  );
}

function Wordmark({ config: c }: { config: BootConfig }) {
  return (
    <>
      <div className={`${NS}__wordmark`}>
        <span className={`${NS}__brand`}>{c.brand.name}</span>
        {c.brand.suffix && <span className={`${NS}__suffix`}>{c.brand.suffix}</span>}
      </div>
      {c.brand.tagline && <div className={`${NS}__tagline`}>{c.brand.tagline}</div>}
    </>
  );
}

function BrandMeta({ config: c }: { config: BootConfig }) {
  const host = c.footer.url ? c.footer.url.replace(/^https?:\/\//, '') : '';
  return (
    <div className={`${NS}__brandmeta`}>
      <span>{c.footer.copyright}</span>
      {c.footer.url && (
        <>
          <span className={`${NS}__footer-dot`} />
          <a className={`${NS}__footer-link`} href={c.footer.url} target="_blank" rel="noopener">{host}</a>
        </>
      )}
      {c.footer.contact && (
        <>
          <span className={`${NS}__footer-dot`} />
          <a className={`${NS}__footer-link`} href={`mailto:${c.footer.contact}`}>{c.footer.contact}</a>
        </>
      )}
    </div>
  );
}

function StatLine({ config: c }: { config: BootConfig }) {
  const text = c.statText || `${fmt(c.counter.to)} icons · ${c.stats?.length ?? 0} packages`;
  return <div className={`${NS}__stat`}>{text}</div>;
}

function ErrorPanel({ config: c, onRetry }: { config: BootConfig; onRetry: () => void }) {
  return (
    <div className={`${NS}__error`} role="alert">
      <div className={`${NS}__error-msg`}>
        <BootIcon name="alert" />
        <span>{c.i18n.error}</span>
      </div>
      <button className={`${NS}__btn`} onClick={onRetry} type="button">
        <BootIcon name="replay" />
        {c.i18n.retry}
      </button>
    </div>
  );
}

function ReadyPanel({ config: c }: { config: BootConfig }) {
  return (
    <div className={`${NS}__ready`}>
      <span className={`${NS}__ready-check`}><BootIcon name="check" /></span>
      <span className={`${NS}__ready-text`}>{c.i18n.ready}</span>
    </div>
  );
}

function message(c: BootConfig, s: BootsplashHandle['state'], pct: number): string {
  if (s.phase === 'complete' || s.phase === 'ready') return c.i18n.ready;
  const msgs = c.messages;
  return msgs.length ? msgs[Math.min(msgs.length - 1, Math.floor(pct / (100 / msgs.length)))]! : '';
}

function Progress({ config: c, state: s, indet, pct }: { config: BootConfig; state: BootsplashHandle['state']; indet: boolean; pct: number }) {
  const msg = message(c, s, pct);
  return (
    <div className={`${NS}__progress`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      {c.variant === 'bar' && <BarVariant config={c} indet={indet} pct={pct} message={msg} />}
      {c.variant === 'ring' && <RingVariant config={c} indet={indet} pct={pct} message={msg} />}
      {c.variant === 'steps' && <LogVariant config={c} state={s} pct={pct} items={logItemsSteps(c.tasks)} />}
      {c.variant === 'tree' && <LogVariant config={c} state={s} pct={pct} items={logItemsTree(c.tasks)} />}
      {c.variant === 'dots' && (
        <div className={`${NS}__dots`}>
          <div className={`${NS}__dots-row`}>
            <span className={`${NS}__dot`} /><span className={`${NS}__dot`} /><span className={`${NS}__dot`} />
          </div>
          <span className={`${NS}__msg`}>{msg}</span>
        </div>
      )}
      {c.variant === 'counter' && <CounterVariant config={c} pct={pct} />}
    </div>
  );
}

function BarVariant({ config: c, indet, pct, message: msg }: { config: BootConfig; indet: boolean; pct: number; message: string }) {
  return (
    <div className={`${NS}__bar-wrap`}>
      <div className={`${NS}__bar-head`}>
        <span className={`${NS}__msg`}>{msg}</span>
        {c.showPercent && !indet && <span className={`${NS}__pct`}>{Math.round(pct)}%</span>}
      </div>
      <div className={`${NS}__bar`}>
        <div className={`${NS}__bar-fill`} />
        <div className={`${NS}__bar-shimmer`} />
      </div>
    </div>
  );
}

function RingVariant({ config: c, indet, pct, message: msg }: { config: BootConfig; indet: boolean; pct: number; message: string }) {
  const circ = 2 * Math.PI * 40;
  const offset = indet ? circ : circ * (1 - pct / 100);
  return (
    <div className={`${NS}__ring`}>
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle className={`${NS}__ring-track`} cx={48} cy={48} r={40} />
        <circle className={`${NS}__ring-fill`} cx={48} cy={48} r={40} strokeDasharray={circ.toFixed(1)} strokeDashoffset={offset.toFixed(1)} />
      </svg>
      <div className={`${NS}__ring-center`}>
        {c.showPercent && !indet ? (
          <span className={`${NS}__ring-pct`}>{Math.round(pct)}%</span>
        ) : indet ? (
          <span className={`${NS}__ring-spin`}><BootIcon name="spin" spin /></span>
        ) : null}
      </div>
      <div className={`${NS}__ring-msg`}>{msg}</div>
    </div>
  );
}

function CounterVariant({ config: c, pct }: { config: BootConfig; pct: number }) {
  const val = Math.round((c.counter.to || 0) * (pct / 100));
  return (
    <div className={`${NS}__counter`}>
      <span className={`${NS}__counter-num`}>{fmt(val)}</span>
      <span className={`${NS}__counter-cap`}>{c.counter.caption}</span>
      <div className={`${NS}__counter-bar`}><div className={`${NS}__bar-fill`} /></div>
    </div>
  );
}

function LogVariant({ config: c, state: s, pct, items }: { config: BootConfig; state: BootsplashHandle['state']; pct: number; items: Array<{ id: string; label: string; stat?: string }> }) {
  const len = items.length || 1;
  const isError = s.phase === 'error';
  const w = logWindow(pct, len, c.maxVisible || 4);
  const rows: React.ReactNode[] = [];
  for (let i = w.start; i <= w.end; i++) {
    const item = items[i]!;
    const status = rowStatus(pct, i, len, isError);
    const oldest = i === w.start && w.start > 0;
    const cls = [`${NS}__step`, status && `is-${status}`, oldest && 'is-oldest'].filter(Boolean).join(' ');
    const t = s.stepTimes[item.id];
    const extra = status === 'done' ? (item.stat ?? (t ? `${(t / 1000).toFixed(1)}s` : '')) : '';
    rows.push(
      <div key={item.id} className={cls} data-idx={i} data-step={item.id}>
        <span className={`${NS}__step-dot`}>
          {status === 'done' && <BootIcon name="check" />}
          {status === 'active' && <BootIcon name="spin" spin />}
          {status === 'error' && <BootIcon name="x" />}
        </span>
        <span className={`${NS}__step-label`}>{item.label}</span>
        {extra && <span className={`${NS}__step-ms`}>{extra}</span>}
      </div>,
    );
  }
  return <div className={`${NS}__steps ${NS}__steps--log`} data-total={len}>{rows}</div>;
}

function StatsStrip({ config: c, state: s }: { config: BootConfig; state: BootsplashHandle['state'] }) {
  return (
    <div className={`${NS}__stats`}>
      {c.stats.map((st) => (
        <div key={st.key} className={`${NS}__stat-item`} data-stat-key={st.key}>
          <span className={`${NS}__stat-value`}>{fmt(s.stats[st.key] ?? 0)}</span>
          <span className={`${NS}__stat-label`}>{st.label}</span>
        </div>
      ))}
    </div>
  );
}
