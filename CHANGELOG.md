# Changelog

All notable changes to `ichava/browser` follow [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and [Semantic Versioning](https://semver.org/).

## [0.2.8] - 2026-09-21

### Fixed

- **Package titles and descriptions were read under a key nothing ever wrote.**
  Seven call sites read `$packageData['browser_metadata'][...]`. `IconRegistry`
  has never written that key -- 16 reads across `ichava/core` and this package,
  **zero writes** -- so every one fell through its `??` default. The SPA showed
  the package slug where a title belonged and an empty string where a
  description belonged.

  Nothing failed, because each fallback looked plausible. A fallback is only a
  safety net if something notices you are standing in it. The values were there
  the whole time, one level up.

- **A missing shared Vite generator now says so.** `vite.config.js` imports
  `ViteConfigGenerator` from `<workspace>/.scripts/vite/vite-configurator.js`,
  which lives outside every repository by design. A bare `import` of a path that
  is not there fails with `ERR_MODULE_NOT_FOUND` naming a resolved absolute
  path, which reads like a broken install rather than a workspace this package
  was never checked out into.

  Since the file is outside every repo, its absence is the *normal* case for
  anyone who cloned this package on its own -- a contributor, CI, a consumer
  rebuilding assets. The config now checks for it first and explains what is
  missing, where it was expected, and that prebuilt assets are committed under
  `public/assets` so no build is needed to use the package.

  **Deliberately not falling back to a locally-reconstructed config.** The
  generator owns asset naming and the CSS-only-entry stub; a fallback producing
  subtly different output than the committed assets would be worse than one that
  refuses, because the build would succeed and ship the wrong files.

  > The import depth itself was corrected separately in #22 -- four levels up
  > from `packages/browser` reaches the workspace root, three did before the
  > restructure. That fix is right; this is about what happens when the file at
  > that path does not exist.

- **`public/assets/js/ichava-react.js` was 18 days stale and shipped five package names that no
  longer exist.** It is build output, checked in, last built 2026-09-03 — before the react
  sources moved to the `icon-sets-` names on 2026-09-21. Rebuilt rather than edited; the
  `ichava-react.css` beside it was stale for the same reason and moved with it.

### Security

- **The package endpoint no longer risks publishing filesystem paths.** One of
  those reads passed the whole array through as
  `'metadata' => $packageData['browser_metadata'] ?? []`, which returned an
  empty array for its entire life. Repointing it at the real metadata without
  filtering would have started serving `base_path` and `provider_class` --
  absolute paths and internal class names -- from an endpoint anyone who can
  reach the browser can call.

  It now goes through an **allow-list**, not a blocklist, so a key the registry
  grows later is withheld until someone chooses to publish it. A test adds an
  unknown key and asserts it does not escape.

  > Not an exploitable regression in any released version: the key never
  > existed, so the response was always empty. It would have become one in this
  > change.

## [0.2.7] - 2026-09-21

### Changed

- **`ichava/core` floor raised to `^0.2.8 || ^0.3.1`.** The `labels` payload
  below arrives from core and was written to degrade to an absent key, so this
  is not a correctness fix -- it is the difference between localised taxonomy
  labels being guaranteed and being best-effort. `0.3.1` is the first core
  release that carries them.

  The `^0.2.8` arm is kept deliberately. Dropping it to require `^0.3.1` alone
  would cut off the 0.2 line for no benefit; raising the floor of the 0.3 arm
  excludes the releases without `labels` and nothing else.

### Added

- **Localised taxonomy labels in the package payloads.** `labels` carries a
  pack's `variants` / `categories` / `sets` display names, which `config.json`
  has no equivalent for, and follows the application locale because
  `ichava/core` applies its translation overlay on read.

  Degrades cleanly: against a core that does not supply `labels`, the key is
  simply absent. The composer floor is unchanged for that reason -- it moves
  when core next tags a release carrying the overlay.

## [0.2.6] - 2026-09-21

### Added

- **`actionlint` runs on every pull request.** Nothing validated the workflow files at all:
  `release.yml` triggers only on `push: tags`, so a broken workflow was first observed as a
  release that refused to start — after the decision to release had been made.

  A YAML parse is not a substitute, and that is the sharp part. `yaml.safe_load` accepts a
  duplicate key and silently keeps the last one, so a double-applied patch that left
  `continue-on-error:` twice on a single step validated clean and would have failed only at tag
  time. `actionlint` rejects what Actions rejects.

  Checked against the defect rather than assumed: injecting that duplicate key, a typo'd step
  key, and an `if:` referencing a property that does not exist are all caught, while
  `yaml.safe_load` still parses the first of them without complaint.

### Fixed

- **A failed SBOM download no longer takes the whole release down.** `release.yml` generates the
  SBOM before it publishes, and the Syft installer fetches its checksums from GitHub's
  release-asset CDN. On 2026-09-21 that answered `504` for about twenty minutes, failing the job
  four times *before* the publish step — so the tag existed with no release behind it, which is
  the drift the release table exists to catch, produced by the release machinery itself.

  Two changes. The step now retries once after 45 seconds, which covers a single transient `504`
  — the common case. And a second failure no longer fails the job: the release publishes without
  the asset and emits a `::warning::` naming the re-run.

  **The two failure states are not equally bad, and that asymmetry is the whole design.** A
  release missing an attachment is repaired by re-running this workflow, which re-attaches it. A
  tag with no release persists silently until a person notices. Preferring the recoverable one
  is worth the loss of "every release always carries an SBOM" as an absolute.

  `fail_on_unmatched_files: false` is now stated on the publish step. It is already the action's
  default, but the point of this change is that a missing SBOM must not fail the publish, so it
  should not rest on a default a future reader has to know.

### Security

- **Floor raised to `ichava/core: ^0.2.8`.** Core `0.2.8` fixes two issues a pack inherits
  through the engine: `%` and `_` in a search query acted as `LIKE` wildcards, widening results
  and forcing full-table scans; and the icon watcher followed symlinks and read files of
  unbounded size, so a link inside a watched directory pointed the reader anywhere on disk.

  `^0.2.5` still permitted resolving to `0.2.5`, `0.2.6` or `0.2.7`, all of which carry both.
  The `|| ^0.3` arm is unchanged — core `0.3.0` moved the scaffolder out but left the engine,
  registry, seeder and SVG pipeline untouched, so an installed pack is unaffected by it.

## [0.2.5] - 2026-09-21

### Changed

- **`ichava/core` widened to `^0.2.5 || ^0.3`.** Core `0.3.0` removes the icon-package
  scaffolder and its stub tree, which moved to `ichava/icon-package-scaffolder`. This package
  never used either, so it works unchanged on both series.

  Widened rather than raised on purpose. A caret on a `0.x` version pins the minor, so plain
  `^0.2.5` cannot resolve `0.3.0` and this package would have held every consumer back on the
  0.2 series for a removal that does not affect it. Raising it to `^0.3` instead would have
  forced a core upgrade on anyone deliberately staying on 0.2.x, for the same non-reason.
  Both series genuinely work, so the constraint says so.

## [0.2.4] - 2026-09-21

### Security

- **Floor raised to `ichava/core: ^0.2.5`.** Core `0.2.5` closes an address-notation gap in the
  pack update-check guard: `isPublicIp()` judged addresses by how they were written, so
  `::7f00:1` and `::a9fe:a9fe` — IPv4-compatible IPv6 spellings of `127.0.0.1` and of the
  `169.254.169.254` cloud-metadata address — were accepted while the same addresses in dotted
  form were refused. `^0.2.4` still permitted resolving to `0.2.4`, which has it.

  Weaker than the containment fixes in `0.2.4`: the notation was deprecated in 2006 and most
  stacks will not route it. The floor moves anyway, because a constraint that can resolve to a
  release with a known gap is the thing this rule exists to prevent.

## [0.2.3] - 2026-09-21

### Security

- **Floor raised to `ichava/core: ^0.2.4`.** Core `0.2.4` carries seven security fixes — post-
  sanitizer attribute gating, icon-path containment, off-document paint URLs, sanitizer policy
  flag enforcement, SVG driver containment, debug path leakage and pack update-check URL
  restriction. `^0.2.3` still permitted resolving to `0.2.3`, which has all seven. Raising a
  floor to exclude a known-broken release is not a pin; the constraint stays a range.

## [0.2.2] - 2026-09-16

### Changed

- **Requires `ichava/core: ^0.2.3`.** `0.2.2` decided readiness against columns the schema has
  never had, so `ichava::ichava-core.info status` reported `UNINITIALIZED` on a fully seeded
  database and both auto-seed listeners, which gate on the same check, never fired. The floor is
  raised rather than the range widened; it still tracks every `0.2.x` from `0.2.3` on.

## [0.2.1] - 2026-09-16

### Changed

- **Requires `ichava/core: ^0.2.2`.** The floor is raised rather than the range widened: `0.2.0`
  invoked six of its own Artisan commands by names it had just retired, and `0.2.1` still passed
  `migrate` a `--path` that resolved nowhere, so `database migrate` reported success and created
  no tables. `^0.2` admitted both. Raising a floor to exclude a known-broken release is not a
  pin — the range still tracks every `0.2.x` from `0.2.2` on.

## [0.2.0] - 2026-09-16


### Breaking

- **Requires `ichava/core: ^0.2`.** Core `0.2.0` moved its config key to `ichava.ichava-core.*`
  and renamed every Artisan command with no bare aliases, so a host application upgrading this
  package has to upgrade core with it.
- **`ichava:inject-scripts` is now `ichava::browser.inject-scripts`, and the bare name is gone.**
  Artisan's command table is a flat map keyed by name, so a bare slug is a key any sibling
  package could also claim, and the second claimant replaces the first silently. It is not
  retained as an alias: an alias that reintroduces the bare name hands back the same collision.


### Fixed

- Four `config('ichava.core.*')` reads left orphaned by core's config rename — CORS, request
  logging, auth debug and the route prefix were silently returning defaults.
- Icon components called non-existent `::getName()`; now use `::getPackageName()`.
- Facade imports (`DB`) made explicit in both controllers.

### Changed

- Third-party GitHub Actions pinned to the commit SHA of their latest release; `actions/*` keep
  floating on a major tag. A tag is mutable, so `@v4` is a promise the action's owner can
  rewrite; pinning GitHub's own actions inside GitHub's own runner buys nothing.
- The test harness reads `DB_CONNECTION`, so the suite targets SQLite, PostgreSQL, MySQL or
  MariaDB. SQLite runs enable `foreign_key_constraints`, which Laravel applies only when the key
  is present.
- Hardened CI workflows: concurrency groups, job timeouts, problem matchers, docs-only skip paths, test coverage, and tidy composer scripts.
- Aligned Pest to `^4.6 || ^5.0` and CI branch triggers on `main` only.

### Added

- `release.yml` — a `v*.*.*` tag now publishes a release whose body is that version's CHANGELOG
  section, and fails closed when the tagged version has no section.
- The database matrix: CI runs the suite against PostgreSQL 17, MySQL 8.4 and MariaDB 11.4 as
  service containers alongside the SQLite lane. These API tests refresh real tables and query
  through core's models, so SQLite alone proved nothing about the other three.

## [0.1.1] - 2026-09-02

### Fixed

- **`IchavaApiSecurity` no longer overwrites headers a route set deliberately.** It ran after
  the controller and unconditionally `set()` every header, so the SVG endpoint's `immutable`
  cache header and its tight `sandbox` CSP never reached a client and every icon was served
  `no-store`. Routes now declare ownership through `IchavaApiSecurity::claimHeaders()`, limited
  to an `OVERRIDABLE_HEADERS` allow-list -- a route cannot opt out of `nosniff`,
  `X-Frame-Options`, CORS or HSTS. A plain `has()` check could not implement this: Symfony
  synthesises `Cache-Control: no-cache, private` on every response, so a `has()`-gated
  middleware would have silently stopped sending `no-store` on the JSON API.
- **The frontend test environment no longer hides sanitiser failures.** Under happy-dom
  (tested at 15 and 20) DOMPurify strips every element -- `sanitize('<b>hi</b>')` returns
  `hi` -- so the sanitiser suite passed by returning nothing and every "strips X" assertion
  was true for the wrong reason. Switched to jsdom, and added an assertion that checks
  removal and survival of the same input, which fails both for an empty return and for a
  passthrough.
- **The client SVG sanitiser fails closed.** It returned its raw input when DOMPurify was
  unavailable, emitting unsanitised markup exactly when it could not sanitise. It now returns
  an empty string.

### Changed

- **Client SVG sanitisation derives from the shared policy.** The allow-lists were literals
  in `sanitizeSvg.ts`, which is how this runtime and the server drifted apart: `W1-6` widened
  the server and nothing widened the client, and a census then measured 3,507 icons rendering
  correctly on the Blade path and wrong in the SPA -- metronic worst at 266 of 501. Both now
  read `security/svg-policy.json`.
- **`SanitizeOptions.allowStyle` removed.** It had no callers and had stopped doing anything:
  the policy lists the `style` element in `forbiddenTags`, and DOMPurify's `FORBID_TAGS` wins
  over `ALLOWED_TAGS`, so it could only ever have appeared to work. The style *attribute* is
  separate and is allowed.
- **The SVG URL is content-addressed.** `IconResource::svg_url` publishes
  `?v=<render_version>`, and the endpoint serves `public, max-age=31536000, immutable` only
  when the request carries the current token; anything else gets
  `public, max-age=300, must-revalidate` with the same ETag. Callers on the bare id URL keep
  working and receive current bytes -- they simply do not get a year of immutability on a URL
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
