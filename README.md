# ichava/icon-browser

[![Tests](https://github.com/ichava/icon-browser/actions/workflows/tests.yml/badge.svg)](https://github.com/ichava/icon-browser/actions/workflows/tests.yml)
[![Code Quality](https://github.com/ichava/icon-browser/actions/workflows/code-quality.yml/badge.svg)](https://github.com/ichava/icon-browser/actions/workflows/code-quality.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> The HTTP layer for the Ichava Laravel icon ecosystem — REST API, Vue 3 + Vite SPA, Blade browser views and middleware, installed on top of `ichava/core` when you want a visual icon browser or programmatic REST access.

This package is not published to Packagist, so there is no registry-version badge to show. Targets PHP `^8.4.1 || ^8.5` on Laravel `^13`, against `ichava/core` `^0.2.8 || ^0.3.1`.

## Install

```bash
composer require ichava/icon-browser
```

Browser and its dependencies are unpublished, so your application's `composer.json` needs VCS repository entries before that command resolves — [Installation](docs/installation.md) gives the block, then covers publishing the config and SPA assets and reaching the browser at `/{prefix}/icons`.

## <a name="documentation"></a>Documentation

Full documentation is at **[opensource.simtabi.com/documentation/ichava/icon-browser](https://opensource.simtabi.com/documentation/ichava/icon-browser/)**.

### Guides

- [Installation](docs/installation.md) — VCS repositories, config, asset publishing, the prefix
- [Getting started](docs/getting-started.md) — the SPA and your first REST call
- [Configuration](docs/configuration.md) — every config key and what it changes
- [Environment variables](docs/environment.md) — the `ICHAVA_BROWSER_*` surface
- [Architecture](docs/architecture.md) — what browser ships, the middleware stack, hybrid auth
- [Release](docs/release.md) — how a version is cut, and what a release carries

### Reference

- [API endpoints](docs/tools/api-endpoints.md) — every route, its parameters and its shape
- [shadcn-vue installer](docs/tools/shadcn-installer.md) — the interactive component installer

### Ecosystem

- [Core architecture](https://opensource.simtabi.com/documentation/ichava/core/architecture)
- [Troubleshooting](https://opensource.simtabi.com/documentation/ichava/core/troubleshooting)

## Contributing & security

See [CONTRIBUTING.md](CONTRIBUTING.md). PHP tests run with `vendor/bin/pest`; the frontend dev server is `npm install && npm run dev` on port 5174. Report vulnerabilities privately through [SECURITY.md](SECURITY.md) — never in a public issue.

## License

MIT. © Simtabi LLC. See [LICENSE](LICENSE).
