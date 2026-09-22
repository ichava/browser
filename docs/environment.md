[← Docs index](../README.md#documentation)

# Environment variables

*Reference.*

Browser-specific `ICHAVA_*` env vars (HTTP layer: SPA + REST API + middleware). Engine vars (database, queue, logging) live in [core/environment.md](https://opensource.simtabi.com/documentation/ichava/core/environment).

Copy what you need from [`.env.example`](https://github.com/ichava/icon-browser/blob/main/.env.example) into your application's `.env`.

## Vite dev server

| Key | Default | Effect | Config |
|---|---|---|---|
| `ICHAVA_VITE_DEV` | `true` | Use Vite dev server for live editing in `local`. Auto-disabled in production | `ichava.icon-browser.vite_dev_mode` |

## Browser UI

| Key | Default | Effect | Config |
|---|---|---|---|
| `ICHAVA_BROWSER_PREFIX` | `ichava` | URL prefix segment. Browser mounts at `/{prefix}/icons` and core's API at `/{prefix}/api/...`. Lives in core's config (`ichava.prefix`); listed here because env-var ownership is conventional | `ichava.prefix` *(in core)* |
| `ICHAVA_BROWSER_PER_PAGE` | `60` | Default page size in the icon-browser grid | `ichava.icon-browser.browser.per_page` |
| `ICHAVA_BROWSER_CACHE` | `3600` | Discovery cache TTL (seconds) | `ichava.icon-browser.browser.cache_duration` |

## Demo Blade components

| Key | Default | Effect | Config |
|---|---|---|---|
| `ICHAVA_TEST_COMPONENT_ENABLED` | `true` | Register the bundled `<x-ichava::ichava-test-icons>` and `<x-ichava::ichava-ui-icons>` Blade components | `ichava.icon-browser.test_component_enabled` |

## Multi-domain support

| Key | Default | Effect | Config |
|---|---|---|---|
| `ICHAVA_DOMAINS` | empty | Comma-separated domains to restrict routes to (e.g. `app.test,admin.test`). Empty means routes work on every domain | `ichava.icon-browser.domains` |

## REST API

| Key | Default | Effect | Config |
|---|---|---|---|
| `ICHAVA_API_PRETTY_PRINT` | `true` | Indented JSON responses | `ichava.icon-browser.api.pretty_print` |
| `ICHAVA_API_CORS_ENABLED` | `true` | Apply CORS headers from the `ichava.api` middleware group | `ichava.icon-browser.api.cors.enabled` |
| `ICHAVA_API_CORS_ORIGINS` | `*` | `Access-Control-Allow-Origin`. Override to your host's `app.url` in production | `ichava.icon-browser.api.cors.allowed_origins` |

## HTTP request size guard

| Key | Default | Effect | Config |
|---|---|---|---|
| `ICHAVA_MAX_REQUEST_SIZE` | `1_048_576` | Maximum request body in bytes (1 MiB). Enforced by `IchavaApiSecurity` middleware | `ichava.icon-browser.max_request_size` |

## Rate limiting

| Key | Default | Effect | Config |
|---|---|---|---|
| `ICHAVA_RATE_LIMITING_ENABLED` | `false` | Master switch for per-route throttle middleware | `ichava.icon-browser.rate_limiting.enabled` |
| `ICHAVA_BROWSER_RATE_LIMIT` | `300` | Browser-route limit (requests per minute) | `ichava.icon-browser.rate_limiting.browser` |
| `ICHAVA_API_RATE_LIMIT` | `600` | API-route limit (requests per minute) | `ichava.icon-browser.rate_limiting.api` |
| `ICHAVA_API_FLOOR` | `300` | Global throttle floor on the `ichava.api` middleware group, applied regardless of the master switch | `ichava.icon-browser.rate_limiting.api_floor` |

## See also

- [Configuration reference](configuration.md)
- [Core environment variables](https://opensource.simtabi.com/documentation/ichava/core/environment)
- [API endpoints](tools/api-endpoints.md)

---

[← Docs index](../README.md#documentation)
