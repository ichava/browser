# Changelog

All notable changes to `ichava/browser` follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Web-route coverage for `IconBrowserController` (`tests/Feature/Web/IconBrowserControllerTest.php`) -- pins index/stats/clearCache/rebuildCache.
- `tests/TestCase::defineEnvironment()` now sets `app.key`, the SQLite testing connection, and `cache.default = array` so Web tests that exercise sessions/cookies don't trip `MissingAppKeyException`.

### Fixed

- `resources/views/stats/index.blade.php` now defaults missing `total_icons`/`total_packages`/`total_categories`/`total_variants` keys to 0 instead of crashing with `number_format(null)`.
- `resources/views/stats/index.blade.php` cache-stat values that come back as nested arrays are now rendered via `json_encode()` instead of crashing `htmlspecialchars()`.
- `IchavaApiSecurity::getCorsHeaders()` no longer wraps the CORS-origins config read in a redundant `config('app.url', '')` fallback -- the config file already resolves the chain via `env('APP_URL', 'http://localhost')`.
- `IconBrowserApiController::package()` now returns a structured `validationErrorResponse()` for the package-name format check instead of raw `response()->json([..., 422])`, restoring response-shape consistency with the rest of the API.
- `routes/web.php` no longer carries an unused `Simtabi\Laranail\Ichava\Support\Helpers` import.
- `IconBrowserController::stats()` no longer fires 3 queries per registered package (N+1). Replaced with two batched `GROUP BY` queries that fetch all icon counts and all term counts in O(1) round-trips, then reassembled in PHP.
- `IconBrowserApiController::svg()` now sanitises the icon name before emitting it in the `Content-Disposition` header (whitelisted to `[A-Za-z0-9._-]`); previously a name containing a quote / newline / semicolon could break out of the header value.
- PII (`request()->ip()` + `request()->userAgent()`) demoted from `info` to `debug` in `IconBrowserController::index()` and `stats()`; removed entirely from cache mutation logs (audit channel is the right place if you need it).

### Changed

- AI-tell phrase scrub in `IconBrowserController`.
- IchavaStatefulGuard docblock orphan-asterisk fixed; "Defence in depth" -> "Defense in depth".
- Idiomatic-Laravel pass on `src/`: every raw `str_*` call in `IchavaApiSecurity`, `ValidateIchavaRoute`, and `SriAsset` replaced with `Str::*` equivalents; every raw `file_*` call in `InjectNpmScriptsCommand` replaced with `File::*` facade methods.
- Exception details no longer leak to the rendered view in `IconBrowserController::{index, stats, clearCache, rebuildCache}`. The full exception is still logged with trace via `logger->error(...['exception' => $e])`; the user-facing flash / view error is now a generic message.
- Pint formatting normalised to the project's CI ruleset.

### Added (tests)

- `tests/Feature/Middleware/IchavaApiSecurityTest.php` -- pins the security middleware (header emission, SQL/XSS/path-traversal rejection, Content-Type validation). 5 tests.
- `tests/Feature/Api/IconsApiTest.php` -- 8 tests against `/ichava/api/icons*` endpoints (pagination contract, per_page minimum, SVG security headers, Content-Disposition filename escape).

### Added (frontend)

- Client-side SVG sanitiser at `resources/assets/scripts/ichava-ts/utils/sanitizeSvg.ts` (DOMPurify wrapper with SVG allowlist + forbidden-tag list). Wired into all 8 `v-html` sites in `IconCard.vue`, `App.vue`, `IconModal.vue`, and `IconPreview.vue` for defense-in-depth on top of the existing server-side `SanitizesSvg` trait.
- Vitest scaffold: `vitest.config.ts`, `npm run test:js` / `test:js:watch` scripts, happy-dom environment, Vue Test Utils + V8 coverage reporter, plus a starter `sanitizeSvg.test.ts` exercising the XSS-strip paths.
- IconGrid pagination buttons now carry `role="navigation"`, `aria-label="Pagination"`, per-button `aria-label`, and `aria-current="page"` on the active page (accessibility).
- `HttpClient::handleError()` signature changed from `error: any` to `error: unknown` with proper type narrowing (no behaviour change; tightens types).

### Dependencies

- Added `dompurify ^3.2.4` and `@types/dompurify ^3.0.5` to `dependencies`.
- Added `vitest ^2.1.5`, `@vitest/coverage-v8 ^2.1.5`, `@vue/test-utils ^2.4.6`, and `happy-dom ^15.11.6` to `devDependencies`.

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
