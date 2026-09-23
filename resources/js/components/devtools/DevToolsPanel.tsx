import { useEffect, useMemo, useRef, useState } from 'react';
import { type DevToolsTab, type DevToolsEvent } from '@/store';
import { useCopy } from '@/hooks/useClipboard';
import { Glyph } from '@/components/ui/Glyph';
import { devbus } from '@/core/devbus';
import { logger, type LogEntry } from '@/core/logger';
import { getDriver, clearPersisted, PERSIST_KEY } from '@/core/storage';
import { runRegression, type TestResult } from '@/components/devtools/regression';
import { useAppStore, useStoreApi } from '@/hooks/useStoreApi';

const TABS: { id: DevToolsTab; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'state', label: 'State' },
  { id: 'storage', label: 'Storage' },
  { id: 'tests', label: 'Tests' },
  { id: 'logs', label: 'Logs' },
  { id: 'boot', label: 'Boot' },
];

/**
 * DevToolsPanel — bottom-docked developer panel (plan Parts B+E). Events (live
 * devbus log, pause/clear), State (picked UI state), Storage (real driver toggle +
 * copy/reset), Tests (real regression), Logs (logger ring buffer), Boot (splash
 * phase timeline). Mounted only when debug tooling is available (env gate).
 */
export function DevToolsPanel() {
  const storeApi = useStoreApi();
  const tab = useAppStore((s) => s.devtools.tab);
  const setTab = useAppStore((s) => s.setDevToolsTab);
  const toggle = useAppStore((s) => s.toggleDevtools);

  // Subscribe to devbus → store events (returns disposer, no leak).
  useEffect(() => devbus.on((e) => storeApi.getState().pushDevEvent(e)), [storeApi]);

  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-55 h-[260px] bg-[var(--pop)] border-t border-t-[var(--border)] shadow-[0_-8px_24px_-12px_rgba(0,0,0,.3)] flex flex-col text-[12px]"
    >
      <div className="flex items-center gap-1 h-[34px] py-0 px-2.5 border-b border-b-[var(--border)] flex-none">
        <Glyph name="zap" size={13} color="var(--accent-text)" />
        <span className="text-[12px] font-[650] mr-1.5">Ichava DevTools</span>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ height: 24, padding: '0 9px', border: 'none', background: tab === t.id ? 'var(--muted)' : 'transparent', color: tab === t.id ? 'var(--fg)' : 'var(--muted-fg)', borderRadius: 5, fontSize: 11.5, fontWeight: tab === t.id ? 600 : 500, cursor: 'pointer' }}
          >
            {t.label}
          </button>
        ))}
        <span className="flex-1" />
        <span className="font-[family-name:'Geist_Mono',monospace] text-[10px] text-[var(--faint-fg)]">window.dispatchEvent → ichava:*</span>
        <button onClick={toggle} title="Close — ⌘D / Esc" className="ml-2 w-6 h-6 border border-[var(--border)] bg-[var(--bg)] rounded-[5px] cursor-pointer flex items-center justify-center text-[var(--muted-fg)]">
          <Glyph name="close" size={11} color="currentColor" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3 font-[family-name:'Geist_Mono',monospace]">
        {tab === 'events' && <EventsTab />}
        {tab === 'state' && <StateTab />}
        {tab === 'storage' && <StorageTab />}
        {tab === 'tests' && <TestsTab />}
        {tab === 'logs' && <LogsTab />}
        {tab === 'boot' && <BootTab />}
      </div>
    </div>
  );
}

function fmtTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString();
  } catch {
    return String(ts);
  }
}

function EventsTab() {
  const events = useAppStore((s) => s.devtools.events);
  const capturing = useAppStore((s) => s.devtools.capturing);
  const setCapturing = useAppStore((s) => s.setCapturing);
  const clear = useAppStore((s) => s.clearDevEvents);
  return (
    <>
      <Bar>
        <BarBtn onClick={() => setCapturing(!capturing)}>{capturing ? 'Pause' : 'Resume'} capture</BarBtn>
        <BarBtn onClick={clear}>Clear log</BarBtn>
        <span className="text-[var(--faint-fg)]">{events.length} events</span>
      </Bar>
      {events.length === 0 ? (
        <Muted>No events yet — interact with the app (sign in, share, toggle theme…).</Muted>
      ) : (
        events.map((e: DevToolsEvent, i) => (
          <Row key={i}>
            <span className="text-[var(--faint-fg)]">{fmtTime(e.ts)}</span>
            <span className="text-[var(--accent-text)] font-semibold">{e.label}</span>
            {e.payload != null && <span className="text-[var(--muted-fg)]">{JSON.stringify(e.payload)}</span>}
          </Row>
        ))
      )}
    </>
  );
}

function StateTab() {
  // The whole store, deliberately: this tab renders a state dump. Everywhere else,
  // select narrowly -- a selector returning the whole object re-renders on every change.
  const s = useAppStore((st) => st);
  const picked = {
    theme: s.theme,
    view: s.view,
    accent: s.accent,
    size: s.size,
    sizeUnit: s.sizeUnit,
    gridStroke: s.gridStroke,
    color: s.color,
    treatment: s.treatment,
    filters: s.filters,
    auth: { status: s.auth.status, plan: s.auth.user?.plan ?? null },
    favorites: s.favorites.length,
    collections: s.collections.length,
    storageDriver: s.storageDriver,
    consent: s.consent,
  };
  return <pre className="m-0 whitespace-pre-wrap text-[var(--fg)] text-[11.5px] leading-[1.55]">{JSON.stringify(picked, null, 2)}</pre>;
}

function StorageTab() {
  const storeApi = useStoreApi();
  const copy = useCopy();
  const storageDriver = useAppStore((s) => s.storageDriver);
  const setStorageDriver = useAppStore((s) => s.setStorageDriver);
  const factoryReset = useAppStore((s) => s.factoryReset);
  const openConfirm = useAppStore((s) => s.openConfirm);
  return (
    <>
      <div className="font-[600] mb-1.5">Frontend storage driver</div>
      <div className="inline-flex gap-0.5 border border-[var(--border)] rounded-[6px] p-0.5 mb-2.5">
        {(['local', 'session'] as const).map((d) => (
          <button key={d} onClick={() => setStorageDriver(d)} style={{ height: 24, padding: '0 12px', border: 'none', borderRadius: 4, background: storageDriver === d ? 'var(--accent-soft)' : 'transparent', color: storageDriver === d ? 'var(--accent)' : 'var(--muted-fg)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
            {d === 'local' ? 'localStorage' : 'sessionStorage'}
          </button>
        ))}
      </div>
      <div className="text-[11px] text-[var(--muted-fg)] leading-[1.5] mb-2.5 font-[family-name:'Geist',system-ui]">
        State key <b>{PERSIST_KEY}</b> — appearance, filters, view, favorites, collections, auth, notifications, consent. Active driver: <b>{getDriver()}</b>.
      </div>
      <Bar>
        <BarBtn onClick={() => copy(JSON.stringify(storeApi.getState(), (k, v) => (k === 'catalog' || k === 'filtersData' ? undefined : v)), 'State JSON copied')}>Copy state JSON</BarBtn>
        <BarBtn
          onClick={() => openConfirm({ title: 'Reset stored state?', body: 'Clears the persisted snapshot from the active storage driver and restores factory defaults.', confirmLabel: 'Reset state', danger: true, onConfirm: () => { clearPersisted(); factoryReset(); } })}
        >
          Reset stored state…
        </BarBtn>
      </Bar>
    </>
  );
}

function TestsTab() {
  const storeApi = useStoreApi();
  const catalog = useAppStore((s) => s.catalog);
  const config = useAppStore((s) => s.config);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const passed = results?.filter((r) => r.pass).length ?? 0;
  const total = results?.length ?? 0;
  return (
    <>
      <Bar>
        <BarBtn onClick={() => setResults(runRegression(catalog, config, storeApi))} primary>Run full regression</BarBtn>
        {results && <span style={{ color: passed === total ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{passed} passed · {total - passed} failed</span>}
        <span className="text-[var(--faint-fg)] font-[family-name:'Geist',system-ui]">Covers catalog, pagination, snippets, treatments, config, store invariants</span>
      </Bar>
      {results?.map((r, i) => (
        <Row key={i}>
          <Glyph name={r.pass ? 'check' : 'close'} size={12} color={r.pass ? 'var(--success)' : 'var(--danger)'} />
          <span className="text-[var(--fg)]">{r.name}</span>
          {r.detail && !r.pass && <span className="text-[var(--danger)]">{r.detail}</span>}
        </Row>
      ))}
    </>
  );
}

function LogsTab() {
  const [, force] = useState(0);
  const filter = useRef<string>('all');
  useEffect(() => logger.subscribe(() => force((n) => n + 1)), []);
  const entries = useMemo<readonly LogEntry[]>(() => logger.buffer(), [force]);
  const copy = useCopy();
  return (
    <>
      <Bar>
        <BarBtn onClick={() => { logger.clear(); force((n) => n + 1); }}>Clear</BarBtn>
        <BarBtn onClick={() => copy(JSON.stringify(entries, null, 2), 'Logs copied')}>Export JSON</BarBtn>
        <span className="text-[var(--faint-fg)]">{entries.length} entries · level {logger.getLevel()}</span>
      </Bar>
      {entries.length === 0 ? (
        <Muted>No log entries.</Muted>
      ) : (
        entries.slice().reverse().map((e, i) => (
          <Row key={i}>
            <span className="text-[var(--faint-fg)]">{fmtTime(e.ts)}</span>
            <span style={{ color: e.level === 'error' ? 'var(--danger)' : e.level === 'warn' ? 'var(--warning)' : 'var(--muted-fg)', fontWeight: 600, minWidth: 40 }}>{e.level}</span>
            <span className="text-[var(--accent-text)]">{e.channel}</span>
            <span className="text-[var(--fg)]">{e.message}</span>
          </Row>
        ))
      )}
      <button hidden onClick={() => (filter.current = 'all')} />
    </>
  );
}

function BootTab() {
  const boot = useAppStore((s) => s.boot);
  const replay = () => {
    const inst = (window as unknown as { ichavaBoot?: { retry: () => void } }).ichavaBoot;
    if (inst) inst.retry();
  };
  const sim = (fn: 'simSlow' | 'simOffline') => {
    const inst = (window as unknown as { ichavaBoot?: Record<string, (v: boolean) => void> }).ichavaBoot;
    inst?.[fn]?.(true);
  };
  return (
    <>
      <Bar>
        <BarBtn onClick={replay}>Replay boot</BarBtn>
        <BarBtn onClick={() => sim('simSlow')}>Sim slow</BarBtn>
        <BarBtn onClick={() => sim('simOffline')}>Sim offline</BarBtn>
      </Bar>
      <Row><span className="text-[var(--faint-fg)]">phase</span><span className="text-[var(--accent-text)] font-semibold">{boot.phase}</span></Row>
      <Row><span className="text-[var(--faint-fg)]">progress</span><span className="text-[var(--fg)]">{boot.progress}%</span></Row>
      <Row><span className="text-[var(--faint-fg)]">label</span><span className="text-[var(--fg)]">{boot.label || '—'}</span></Row>
      <Row><span className="text-[var(--faint-fg)]">done</span><span className="text-[var(--fg)]">{String(boot.done)}</span></Row>
    </>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 mb-2.5">{children}</div>;
}
function BarBtn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button onClick={onClick} style={{ height: 26, padding: '0 10px', border: primary ? 'none' : '1px solid var(--border)', borderRadius: 5, background: primary ? 'var(--accent)' : 'var(--bg)', color: primary ? 'var(--accent-fg)' : 'var(--fg)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Geist',system-ui" }}>
      {children}
    </button>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 py-0.5 px-0 text-[11.5px]">{children}</div>;
}
function Muted({ children }: { children: React.ReactNode }) {
  return <div className="text-[var(--faint-fg)] font-[family-name:'Geist',system-ui] py-2 px-0">{children}</div>;
}
