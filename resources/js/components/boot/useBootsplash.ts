// The Bootsplash state machine, as a hook (R7). Transcribed from the vendored
// @ichava/bootsplash v2.1.0 engine's mount/start/_runProgress/_complete/retry/
// cancel/finish/fail/destroy lifecycle -- an imperative Emitter-based class there,
// React state + refs + effects here. The math (progress curve, task thresholds,
// rolling-log window) lives in bootsplashEngine.ts as pure functions so it can be
// tested without fake-timer choreography; this file owns the timers and wires
// their output into that math.
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { mergeConfig } from '@js/core/config';
import { BOOT_DEFAULTS, type BootConfig } from './bootsplashConfig';
import { advanceTasks, progressCurve, type NodeStatus } from './bootsplashEngine';

export type BootPhase = 'idle' | 'loading' | 'offline' | 'error' | 'complete' | 'ready' | 'hidden';

export interface BootsplashState {
  phase: BootPhase;
  pct: number;
  slow: boolean;
  offline: boolean;
  tipIdx: number;
  stats: Record<string, number>;
  stepTimes: Record<string, number>;
  nodeState: Record<string, NodeStatus>;
  fetchState: 'idle' | 'loading' | 'done';
}

const INITIAL_STATE: BootsplashState = {
  phase: 'idle', pct: 0, slow: false, offline: false, tipIdx: 0,
  stats: {}, stepTimes: {}, nodeState: {}, fetchState: 'idle',
};

type Action =
  | { type: 'RESET'; phase: BootPhase }
  | { type: 'PHASE'; phase: BootPhase }
  | { type: 'ADVANCE'; pct: number; nodeState: Record<string, NodeStatus>; stepTimes: Record<string, number>; stats: Record<string, number> }
  | { type: 'SLOW' }
  | { type: 'FETCH_STATE'; fetchState: BootsplashState['fetchState'] }
  | { type: 'PCT_ONLY'; pct: number }
  | { type: 'TIP_NEXT'; count: number }
  | { type: 'SET_STAT'; key: string; value: number };

function reducer(s: BootsplashState, a: Action): BootsplashState {
  switch (a.type) {
    case 'RESET':
      return { ...INITIAL_STATE, phase: a.phase };
    case 'PHASE':
      return { ...s, phase: a.phase };
    case 'ADVANCE':
      return { ...s, pct: a.pct, nodeState: a.nodeState, stepTimes: a.stepTimes, stats: a.stats };
    case 'SLOW':
      return { ...s, slow: true };
    case 'FETCH_STATE':
      return { ...s, fetchState: a.fetchState };
    case 'PCT_ONLY':
      return { ...s, pct: a.pct };
    case 'TIP_NEXT':
      return { ...s, tipIdx: (s.tipIdx + 1) % Math.max(1, a.count) };
    case 'SET_STAT':
      return { ...s, stats: { ...s.stats, [a.key]: a.value } };
    default:
      return s;
  }
}

export interface UseBootsplashOptions {
  /** Deep-merges over BOOT_DEFAULTS, same precedence the vendored engine gave its config layer. */
  config?: Record<string, unknown> | null;
  /**
   * Gates completion on the host's real data load, matching the original's
   * `beforeComplete` hook contract exactly: while this rejects, the splash's own
   * retry UI stays up instead of the page going blank. Return (or omit) to let
   * completion proceed normally.
   */
  beforeComplete?: () => Promise<void>;
  onStart?: () => void;
  onTaskStart?: (id: string) => void;
  onTaskDone?: (id: string) => void;
  onProgress?: (pct: number, stats: Record<string, number>) => void;
  onComplete?: (elapsedMs: number, stats: Record<string, number>) => void;
  onHidden?: () => void;
  onError?: (reason: string) => void;
}

export interface BootsplashHandle {
  config: BootConfig;
  state: BootsplashState;
  isIndeterminate: boolean;
  retry: () => void;
  cancel: () => void;
  finish: () => void;
  fail: (reason?: string) => void;
  setProgress: (pct: number) => void;
  setStat: (key: string, value: number) => void;
  /** Debug affordances -- mirrors the original's simSlow()/simOffline(), exposed on window.ichavaBoot when ?debug=boot. */
  simSlow: (on?: boolean) => void;
  simOffline: (on?: boolean) => void;
}

function readPrefs(persist: BootConfig['persist']): Partial<BootConfig> | null {
  if (!persist.enabled) return null;
  try {
    const raw = window.localStorage.getItem(persist.key);
    return raw ? (JSON.parse(raw) as Partial<BootConfig>) : {};
  } catch {
    return {};
  }
}

function savePrefs(persist: BootConfig['persist'], cfg: BootConfig): void {
  if (!persist.enabled) return;
  const out: Partial<BootConfig> = {};
  for (const f of persist.fields) {
    if (cfg[f] != null) (out as Record<string, unknown>)[f] = cfg[f];
  }
  try {
    window.localStorage.setItem(persist.key, JSON.stringify(out));
  } catch {
    /* storage unavailable */
  }
}

export function useBootsplash(opts: UseBootsplashOptions): BootsplashHandle {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  // Config resolution: DEFAULTS <- host config <- persisted prefs. No fluent
  // setters/data-* layer -- see bootsplashConfig.ts's header note on why.
  const config = useMemo<BootConfig>(() => {
    const base = mergeConfig(BOOT_DEFAULTS, opts.config ?? {});
    const prefs = readPrefs(base.persist);
    return prefs ? mergeConfig(base, prefs) : base;
  }, [opts.config]);

  const isIndeterminate = config.variant === 'dots' || config.progress.mode === 'indeterminate';

  // Timer bookkeeping lives in refs -- it drives dispatches, but isn't itself
  // rendered state (mirrors the original's this._timers/_start/_completing).
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const startedAt = useRef(0);
  const completing = useRef(false);
  const simSlowRef = useRef(false);
  const simOfflineRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const optsRef = useRef(opts);
  const configRef = useRef(config);
  const stateRef = useRef(state);
  // Refs may not be written during render (react-hooks/refs); each callback below
  // that reads these already keeps stateRef in sync synchronously for the rest of
  // its own tick, so this effect only needs to re-assert the authoritative value
  // once React has actually committed it.
  useEffect(() => {
    optsRef.current = opts;
    configRef.current = config;
    stateRef.current = state;
  });

  const clearTimers = useCallback(() => {
    for (const k of Object.keys(timers.current)) {
      clearTimeout(timers.current[k]);
      clearInterval(timers.current[k]);
    }
    timers.current = {};
  }, []);

  const runHook = useCallback(async (): Promise<void> => {
    const fn = optsRef.current.beforeComplete;
    if (!fn) return;
    try {
      await fn();
    } catch {
      // Hang forever: matches the original's beforeComplete contract exactly --
      // on rejection the splash's own retry UI must stay up, not disappear to a
      // blank page. The caller (fail()) already put the splash in its error
      // state before this ever runs.
      await new Promise<never>(() => {});
    }
  }, []);

  const complete = useCallback(() => {
    if (completing.current) return; // guards double-fire (retry/cancel/finish races)
    completing.current = true;
    clearTimers();
    const elapsed = Date.now() - startedAt.current;
    const wait = Math.max(0, (configRef.current.progress.minDisplayMs || 0) - elapsed);
    timers.current.complete = setTimeout(() => {
      void runHook().then(() => {
        dispatch({ type: 'PCT_ONLY', pct: 100 });
        const totalElapsed = Date.now() - startedAt.current;
        optsRef.current.onComplete?.(totalElapsed, stateRef.current.stats);
        if (configRef.current.holdOnComplete) {
          dispatch({ type: 'PHASE', phase: 'ready' });
          return;
        }
        dispatch({ type: 'PHASE', phase: 'complete' });
        const fadeMs = configRef.current.reduceMotion ? 20 : 460;
        timers.current.hide = setTimeout(() => {
          dispatch({ type: 'PHASE', phase: 'hidden' });
          optsRef.current.onHidden?.();
        }, fadeMs);
      });
    }, wait);
  }, [clearTimers, runHook]);

  const fail = useCallback((reason?: string) => {
    clearTimers();
    dispatch({ type: 'PHASE', phase: 'error' });
    optsRef.current.onError?.(reason ?? 'error');
  }, [clearTimers]);

  const loadEndpoint = useCallback(() => {
    const c = configRef.current;
    dispatch({ type: 'FETCH_STATE', fetchState: 'loading' });
    const delay = simSlowRef.current ? 3200 : 650;
    const done = () => {
      if (stateRef.current.phase !== 'loading') return;
      dispatch({ type: 'FETCH_STATE', fetchState: 'done' });
    };
    if (!c.endpoint || c.endpoint.indexOf('mock:') === 0) {
      timers.current.fetch = setTimeout(done, delay);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    fetch(c.endpoint, { signal: ac.signal, headers: { Accept: 'application/json' } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(done)
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        fail('fetch');
      });
  }, [fail]);

  const runProgress = useCallback(() => {
    const c = configRef.current;
    const endpointGated = c.source !== 'config';
    const durationMs = c.progress.durationMs || 3400;
    const slowAt = c.progress.slowAfterMs;
    const timeoutAt = c.progress.timeoutMs;

    let acc = 0;
    let last = Date.now();
    let waitBase = -1;
    const CAP = 250;

    timers.current.progress = setInterval(() => {
      if (stateRef.current.phase !== 'loading') {
        clearInterval(timers.current.progress);
        return;
      }
      const now = Date.now();
      acc += Math.min(now - last, CAP);
      last = now;

      if (slowAt && acc >= slowAt && !stateRef.current.slow) dispatch({ type: 'SLOW' });
      if (timeoutAt && acc >= timeoutAt) {
        fail('timeout');
        return;
      }

      const waiting = endpointGated && stateRef.current.fetchState !== 'done';
      const { pct, waitBase: nextWaitBase } = progressCurve({ acc, prevPct: stateRef.current.pct, waiting, waitBase, durationMs });
      waitBase = nextWaitBase;

      const elapsedMs = now - startedAt.current;
      const advanced = advanceTasks(pct, c.tasks, stateRef.current, elapsedMs);
      dispatch({ type: 'ADVANCE', pct, nodeState: advanced.nodeState, stepTimes: advanced.stepTimes, stats: advanced.stats });
      stateRef.current = { ...stateRef.current, pct, nodeState: advanced.nodeState, stepTimes: advanced.stepTimes, stats: advanced.stats };
      for (const id of advanced.started) optsRef.current.onTaskStart?.(id);
      for (const id of advanced.finished) optsRef.current.onTaskDone?.(id);
      optsRef.current.onProgress?.(pct, advanced.stats);

      if (!waiting && pct >= 99.5) {
        clearInterval(timers.current.progress);
        timers.current.done = setTimeout(complete, 160);
      }
    }, 33);
  }, [complete, fail]);

  const start = useCallback(() => {
    clearTimers();
    completing.current = false;
    startedAt.current = Date.now();
    dispatch({ type: 'RESET', phase: 'idle' });
    stateRef.current = { ...INITIAL_STATE };

    if (typeof navigator !== 'undefined' && navigator.onLine === false || simOfflineRef.current) {
      dispatch({ type: 'PHASE', phase: 'offline' });
      stateRef.current = { ...stateRef.current, phase: 'offline' };
      return;
    }
    dispatch({ type: 'PHASE', phase: 'loading' });
    stateRef.current = { ...stateRef.current, phase: 'loading' };
    optsRef.current.onStart?.();

    const c = configRef.current;
    if (c.source !== 'config') loadEndpoint();
    if (isIndeterminate) {
      timers.current.slow = setTimeout(() => {
        if (stateRef.current.phase === 'loading') dispatch({ type: 'SLOW' });
      }, c.progress.slowAfterMs);
      timers.current.timeout = setTimeout(() => {
        if (stateRef.current.phase === 'loading') fail('timeout');
      }, c.progress.timeoutMs);
    } else {
      runProgress();
    }
  }, [clearTimers, fail, isIndeterminate, loadEndpoint, runProgress]);

  const retry = useCallback(() => {
    completing.current = false;
    start();
  }, [start]);

  const cancel = useCallback(() => {
    complete();
  }, [complete]);

  const finish = useCallback(() => {
    clearTimers();
    const c = configRef.current;
    const elapsedMs = Date.now() - startedAt.current;
    const advanced = advanceTasks(100, c.tasks, stateRef.current, elapsedMs);
    dispatch({ type: 'ADVANCE', pct: 100, nodeState: advanced.nodeState, stepTimes: advanced.stepTimes, stats: advanced.stats });
    stateRef.current = { ...stateRef.current, pct: 100, nodeState: advanced.nodeState, stepTimes: advanced.stepTimes, stats: advanced.stats };
    complete();
  }, [clearTimers, complete]);

  const setProgress = useCallback((pct: number) => {
    const c = configRef.current;
    const clamped = Math.max(0, Math.min(100, pct));
    const elapsedMs = Date.now() - startedAt.current;
    const advanced = advanceTasks(clamped, c.tasks, stateRef.current, elapsedMs);
    dispatch({ type: 'ADVANCE', pct: clamped, nodeState: advanced.nodeState, stepTimes: advanced.stepTimes, stats: advanced.stats });
    stateRef.current = { ...stateRef.current, pct: clamped, nodeState: advanced.nodeState, stepTimes: advanced.stepTimes, stats: advanced.stats };
    if (clamped >= 100) complete();
  }, [complete]);

  const setStat = useCallback((key: string, value: number) => {
    dispatch({ type: 'SET_STAT', key, value });
  }, []);

  // Persist theme/variant/layout/align whenever the resolved config's values for
  // those fields change and persistence is enabled -- mirrors _savePrefs(), called
  // on every fluent setter in the original; here it just tracks the resolved config.
  const persistKey = `${config.persist.enabled}|${config.persist.key}|${config.theme}|${config.variant}|${config.layout}|${config.align}`;
  useEffect(() => {
    if (config.persist.enabled) savePrefs(config.persist, config);
    // persistKey intentionally captures every field that can be persisted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistKey]);

  // Tips rotation -- only while actively loading.
  useEffect(() => {
    if (!config.tips.enabled || config.tips.items.length === 0 || state.phase !== 'loading') return;
    const id = setInterval(() => {
      if (stateRef.current.phase !== 'loading') return;
      dispatch({ type: 'TIP_NEXT', count: config.tips.items.length });
    }, config.tips.intervalMs || 3200);
    return () => clearInterval(id);
  }, [config.tips.enabled, config.tips.items.length, config.tips.intervalMs, state.phase]);

  // Online/offline: mirrors the original's window listeners, bound for the life of
  // the hook (not just while loading), so a connection dropping mid-load is caught.
  useEffect(() => {
    const onOffline = () => {
      dispatch({ type: 'PHASE', phase: 'offline' });
      stateRef.current = { ...stateRef.current, phase: 'offline' };
    };
    const onOnline = () => {
      if (stateRef.current.phase === 'offline') start();
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mount: start once. Unmount: clear every timer + in-flight fetch (mirrors destroy()).
  useEffect(() => {
    start();
    return () => {
      clearTimers();
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const simSlow = useCallback((on?: boolean) => {
    simSlowRef.current = on == null ? !simSlowRef.current : on;
  }, []);
  const simOffline = useCallback((on?: boolean) => {
    simOfflineRef.current = on == null ? !simOfflineRef.current : on;
    if (simOfflineRef.current) {
      dispatch({ type: 'PHASE', phase: 'offline' });
      stateRef.current = { ...stateRef.current, phase: 'offline' };
    }
  }, []);

  return { config, state, isIndeterminate, retry, cancel, finish, fail, setProgress, setStat, simSlow, simOffline };
}
