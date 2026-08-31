// Ichava Browser — React 19 parallel-run entry (Consumer 1: in-Laravel).
//
// Mounts into the Blade-provided node ONLY when present, so it is inert on the
// default Vue route. Reads the SAME `window.ichavaConfig` + CSRF meta the Vue app
// reads. The UI itself comes from the shared component library
// `@ichava/react-browser` (Consumer 2 = the standalone demo + landing) — no UI is
// duplicated here; this file only wires the Laravel bootstrap into the library.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initCsrf, getBrowserId } from '@ichava/react-browser';
import '@ichava/react-browser/styles.css';
import { ReactBootstrap } from './app/App';

declare global {
  interface Window {
    ichavaConfig?: Record<string, unknown>;
    ichavaRoutes?: Record<string, string>;
  }
}

const el = document.getElementById('ichava-app-react');
if (el) {
  // Prime the browser fingerprint (parity: same X-Browser-Id as Vue) + Sanctum CSRF.
  void getBrowserId();
  void initCsrf();
  createRoot(el).render(
    <StrictMode>
      <ReactBootstrap config={window.ichavaConfig ?? {}} />
    </StrictMode>,
  );
}
