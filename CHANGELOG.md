# Changelog

All notable changes to `ichava/browser` follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-05-05

### Added

- Vue 3 / Vite icon browser SPA mounted at `/{prefix}/icons`, including search, package filter, variant/category filter, theme toggle, and copy-to-clipboard.
- REST API for browsing icons, packages, terms, and statistics.
- Blade views: `<x-ichava::layouts.app>`, `<x-ichava::layouts.browser>`, stats page at `/{prefix}/stats`.
- Demo Blade components: `<x-ichava::ichava-test-icons>`, `<x-ichava::ichava-ui-icons>`.
- Bundled `ui-icons` set (UI / navigation icons used by the SPA).
- `ichava:inject-npm-scripts` Artisan command, injects `ichava:dev`, `ichava:build`, `ichava:watch` scripts into the host application's `package.json`.
- `IchavaBrowserServiceProvider` extending `Simtabi\Laranail\PackageTools\Providers\PackageServiceProvider`, registers web routes, views, translations, dist asset publishing, and Blade components.
- Web cache-management routes (`/{prefix}/cache/clear`, `/{prefix}/cache/rebuild`).
- Vite-built dist assets published to `public/vendor/ichava/` under the `ichava-assets` tag.
- **Hybrid API stack**: `IchavaApiSecurity` middleware adapts to host capabilities (Sanctum stateful, session-only, or stateless) via `HostCapabilities` detection. SQL/XSS/path-traversal pattern rejection with audit firing on every reject.
- **Configurable CSP**: `ichava-browser.security.csp.mode` accepts `strict` (default), `nonce` (request-scoped 192-bit nonce), or `hash` (pre-computed digest list). Optional report-only mode and report-uri forwarding.
- **Configurable HSTS / referrer / permissions / frame policies** under `ichava-browser.security.*`.
- **Subresource Integrity**: `<x-ichava::sri-asset>` Blade component emits `<script integrity="sha384-…" crossorigin="anonymous">`. Hashes can come from a JSON manifest (`ichava-browser.security.sri.manifest`) or be computed on demand from the public-path file.
- `.dev/shadcn_vue_installer.sh` helper for managing the icon-browser SPA's component dependencies.

### Changed

- **CORS default**: `ichava-browser.api.cors.allowed_origins` now defaults to `APP_URL` instead of `*`. Set `ICHAVA_API_CORS_ORIGINS=*` if you genuinely need the old wildcard.

### Requirements

- PHP 8.3+ (8.4 supported)
- Laravel 13.x
- `ichava/core` ^1.0
