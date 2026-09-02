# Changelog

All notable changes to `ichava/browser` follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

## [0.1.1] - 2026-09-02

### Fixed

- **`IchavaApiSecurity` no longer overwrites headers a route set deliberately.** It ran after
  the controller and unconditionally `set()` every header, so the SVG endpoint's `immutable`
  cache header and its tight `sandbox` CSP never reached a client and every icon was served
  `no-store`. Routes now declare ownership through `IchavaApiSecurity::claimHeaders()`, limited
  to an `OVERRIDABLE_HEADERS` allow-list — a route cannot opt out of `nosniff`,
  `X-Frame-Options`, CORS or HSTS. A plain `has()` check could not implement this: Symfony
  synthesises `Cache-Control: no-cache, private` on every response, so a `has()`-gated
  middleware would have silently stopped sending `no-store` on the JSON API.
- **The frontend test environment no longer hides sanitiser failures.** Under happy-dom
  (tested at 15 and 20) DOMPurify strips every element — `sanitize('<b>hi</b>')` returns
  `hi` — so the sanitiser suite passed by returning nothing and every "strips X" assertion
  was true for the wrong reason. Switched to jsdom, and added an assertion that checks
  removal and survival of the same input, which fails both for an empty return and for a
  passthrough.
- **The client SVG sanitiser fails closed.** It returned its raw input when DOMPurify was
  unavailable, emitting unsanitised markup exactly when it could not sanitise. It now returns
  an empty string.

### Changed

- **The SVG URL is content-addressed.** `IconResource::svg_url` publishes
  `?v=<render_version>`, and the endpoint serves `public, max-age=31536000, immutable` only
  when the request carries the current token; anything else gets
  `public, max-age=300, must-revalidate` with the same ETag. Callers on the bare id URL keep
  working and receive current bytes — they simply do not get a year of immutability on a URL
  that cannot express which year. Requires `ichava/core` 0.1.1 for `Icon::render_version`.

## [0.1.0] - 2026-08-31

First open-source release. The entire HTTP layer of the Ichava icon ecosystem: REST API, web
routes, middleware, Blade views and the Vue + Vite browser SPA. `ichava/core` ships no HTTP
surface, so this package is what turns the headless engine into a browsable icon library.

Earlier `v1.0.0` and `v2.0.0` tags existed on GitHub and were never published to Packagist. They
are withdrawn: the ecosystem restarts from a single `0.1.0` across every package.

### Added

- REST API over the icon catalogue: listing, filtering, search, per-package detail, stats, raw SVG
  delivery, and `GET /api/icons/update-status`, which surfaces core's `IconPackUpdateChecker` for
  dashboards. Response shape mirrors `ichava:check-icon-updates --format=json`.
- Vue 3 + Vite single-page browser with Blade views and layout components.
- `HostCapabilities`, which adapts the middleware stack to whatever the host app provides, 
  Sanctum plus sessions, sessions only, or a stateless host: rather than assuming one shape.
- `SriAsset` Blade component resolving subresource-integrity hashes from a Vite manifest or from
  disk.
- A configurable security layer: CSP with `strict`/`nonce`/`hash` modes, HSTS, frame, referrer and
  permissions policies, CORS, and per-route rate limits.

### Security

- **Destructive cache endpoints require authorization and fail closed.** `POST
  ichava/api/cache/clear`, `POST ichava/api/cache/rebuild` and their web equivalents shipped with
  a rate limit and no authorization, so any caller who could reach the API could flush the icon
  cache. `rebuildCache()` also calls `PreferenceService::clear()`, so one unauthenticated request
  wiped every stored preference. Grant access with:

  ```php
  Gate::define('ichava.manage-cache', fn ($user) => $user->isAdmin());
  ```

  The ability is configurable at `ichava.browser.security.cache_admin.ability`. A trusted internal
  deployment can set `…cache_admin.allow_without_gate` to `true`; it is off by default.
- CORS defaults to `APP_URL` rather than `*`. Set `ICHAVA_API_CORS_ORIGINS=*` explicitly if you
  need the wildcard.
- `svg()` sanitises the icon name before emitting it in `Content-Disposition`; a name carrying a
  quote, newline or semicolon could previously break out of the header value.
- Request PII (IP, user agent) demoted from `info` to `debug`, and removed entirely from
  cache-mutation logs. The audit channel is the right home for it.
- Exception detail no longer reaches the rendered view. The full exception with trace still goes
  to the log.

### Fixed

- **The package config now loads at the key the source reads.** The file was
  `config/ichava-browser.php` while the package short name is `browser`, so it merged at
  `ichava.browser.ichava-browser.*` while all 27 read sites used `config('ichava-browser.*')`.
  Every one returned `null`, which left the CSP, HSTS, frame and referrer policies, the rate
  limits, `max_request_size` and the CORS origins inert, the CORS default above included. The
  file is now `config/browser.php` and the key is `ichava.browser`.
- `stats()` no longer fires three queries per registered package. Two batched `GROUP BY` queries
  fetch all icon and term counts, reassembled in PHP.
- The stats view no longer crashes on a missing count key or on a cache statistic that comes back
  as a nested array.
- The npm package is `@ichava/browser`. It was `@tusente/ichava`, a scope belonging to an
  unrelated product, while the sibling React package is `@ichava/react-browser`.
- `dompurify` floor raised to `^3.4.14`; everything at or below `3.4.12` carries an XSS advisory
  where removing an `IN_PLACE` hook leaves a detached subtree executable.

### Requirements

- PHP `^8.4.1 || ^8.5`, `illuminate/support` `^13.0`, `ichava/core` `^0.1`.
- Neither `ichava/*` nor `laranail/*` is published on Packagist, so the package declares VCS
  repository entries for core and the three laranail dependencies.
