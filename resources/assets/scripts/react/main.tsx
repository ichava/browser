// Ichava Browser -- React 19 entry (Consumer 1: in-Laravel).
//
// Mounts into the Blade-provided node ONLY when present, so it is inert on the
// default Vue route. Reads the SAME `window.ichavaConfig` + CSRF meta the Vue
// app reads, and primes the byte-identical `X-Browser-Id` fingerprint before
// the first API call. The UI itself comes entirely from the shared component
// library `@ichava/react-browser` (Consumer 2 = the standalone demo + landing)
// -- nothing is duplicated here; this file only wires the Laravel bootstrap
// into the library's `mountIchavaBrowser`.
//
// Data source: `RestCatalog` against `/ichava/api`, with server-side
// pagination -- the corpus this fronts can be hundreds of thousands of icons
// (`bundled-icons` alone is 121,314), so there is no "load everything into a
// window global" step the way `App.tsx`'s standalone demo has for its bundled
// fixture catalog.

import {
  initCsrf,
  getBrowserId,
  mountIchavaBrowser,
  createCatalog,
  resolveConfig,
  configureTransport,
  type PartialConfig,
} from '@ichava/react-browser';
import '@ichava/react-browser/styles.css';

declare global {
  interface Window {
    ichavaConfig?: PartialConfig;
    ichavaRoutes?: Record<string, string>;
  }
}

const el = document.getElementById('ichava-app-react');

if (el) {
  // The Laravel routes carry a per-purpose set of full URLs
  // (`ichava.api.icons.index`, `ichava.api.icons.svg`, ...), not one API root
  // the client can build `/icons`, `/icons/{id}/svg` etc. onto by string
  // concatenation. `ichava.api.icons.index` already resolves to
  // `{prefix}/api/icons`, so stripping the trailing segment gives the root
  // `RestCatalog` needs, without hardcoding `{prefix}` here and drifting from
  // whatever `config('ichava.prefix')` the host actually has.
  const iconsIndex = window.ichavaRoutes?.['ichava.api.icons.index'];
  const apiBase = iconsIndex ? iconsIndex.replace(/\/icons\/?$/, '') : '/ichava/api';

  // `LARAVEL_SANCTUM_PRESET` (credentials, CSRF strategy, timeout) is already
  // the default at module load; only `baseUrl` needs a host-specific override.
  configureTransport({ baseUrl: apiBase });

  // Prime the browser fingerprint (parity: same X-Browser-Id as Vue) + Sanctum
  // CSRF before the client's first request, matching the Vue app's own boot
  // order.
  void getBrowserId();
  void initCsrf();

  mountIchavaBrowser(el, {
    client: createCatalog('rest', { base: apiBase }),
    config: resolveConfig(window.ichavaConfig),
  });
}
