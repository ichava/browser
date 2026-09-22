// Tiny typed event bus (plan Part B/E). Store actions emit app events; the DevTools
// "Events" tab subscribes for a live log. Set-backed so re-subscription can't dup;
// subscribers return a disposer (no leak). `payload?: unknown` — never `any`.

export type DevEventKind = 'auth' | 'share' | 'collection' | 'notify' | 'nav' | 'reset' | 'storage' | 'boot' | 'devtools';

export interface DevEvent {
  kind: DevEventKind;
  label: string;
  payload?: unknown;
  ts: number;
}

type Handler = (e: DevEvent) => void;


const handlers = new Set<Handler>();

export const devbus = {
  emit(kind: DevEventKind, label: string, payload?: unknown): void {
    const e: DevEvent = { kind, label, payload, ts: Date.now() };
    handlers.forEach((fn) => {
      try {
        fn(e);
      } catch {
        /* isolate listener errors */
      }
    });
  },
  on(fn: Handler): () => void {
    handlers.add(fn);
    return () => handlers.delete(fn);
  },
};
