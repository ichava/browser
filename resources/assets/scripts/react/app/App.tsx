// Parallel-run bootstrap (Consumer 1). STEP-1: proves the wiring — the flag-gated
// Blade node mounts React, which reads the SAME `window.ichavaConfig` bootstrap the
// Vue app reads, and the byte-identical `X-Browser-Id` is primed for the API.
//
// NEXT (P1 data hook): swap this screen for the shared library's <IchavaBrowser>,
// fed by a RestCatalog(`/ichava/api`) source so the full grid renders against the
// live backend with server pagination. Kept behind `?ui=react` until parity.

import { getBrowserId } from '@ichava/react-browser';

interface Props {
  config: Record<string, unknown>;
}

export function ReactBootstrap({ config }: Props) {
  const packages = Array.isArray((config as { packages?: unknown[] }).packages)
    ? (config as { packages: unknown[] }).packages.length
    : 0;
  const categories = Array.isArray((config as { categories?: unknown[] }).categories)
    ? (config as { categories: unknown[] }).categories.length
    : 0;

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg, #0a0a0b)', color: 'var(--fg, #fafafa)', fontFamily: "'Geist', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 460, padding: 24 }}>
        <p style={{ fontSize: 11, letterSpacing: '.08em', opacity: 0.6, textTransform: 'uppercase' }}>Ichava Browser</p>
        <h1 style={{ fontSize: 22, fontWeight: 650, margin: '8px 0' }}>React 19 mount active</h1>
        <p style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>
          Parallel-run wiring verified: bootstrap received <b>{packages}</b> package(s) and <b>{categories}</b>{' '}
          category(ies) from <code>window.ichavaConfig</code>; API fingerprint <code>{getBrowserId()}</code>.
        </p>
        <p style={{ fontSize: 12, opacity: 0.55, marginTop: 10 }}>
          Vue remains the reference at <code>/ichava/icons</code>. The full grid renders here once the REST data hook lands.
        </p>
      </div>
    </div>
  );
}
