# Ichava Browser

[![Latest Version](https://img.shields.io/packagist/v/ichava/browser.svg)](https://packagist.org/packages/ichava/browser)
[![License](https://img.shields.io/packagist/l/ichava/browser.svg)](LICENSE)
[![PHP Version](https://img.shields.io/packagist/php-v/ichava/browser.svg)](https://packagist.org/packages/ichava/browser)

The HTTP layer for the [Ichava ecosystem](https://github.com/ichava/documentation). REST API, Vue + Vite SPA, Blade browser views, middleware. Optional. Install on top of [`ichava/core`](https://github.com/ichava/core) when you want a visual icon browser or programmatic REST access.

## What's in browser

| | |
|---|---|
| Visual SPA | Vue 3 + Vite + Tailwind icon browser at `/{prefix}/icons`. Search, filter by pack/variant/category, copy-to-clipboard, theme toggle. |
| REST API | Endpoints for icons, packages, terms, preferences, command history, cache, statistics. |
| Middleware | `ichava.api` and `ichava.web` groups, plus per-middleware aliases (`ichava.guard`, `ichava.security`, `ichava.json`, `ichava.log`, `ichava.session`, `ichava.validate`). |
| Hybrid auth | `HostCapabilities` detects Sanctum + sessions and adapts the stack. Works in any Laravel app. |
| Blade views | `<x-ichava::layouts.app>`, `<x-ichava::layouts.browser>`, plus `<x-ichava::ichava-test-icons>` and `<x-ichava::ichava-ui-icons>` demo components. |
| `ui-icons` pack | Bundled icon set used by the SPA. |
| Asset publish | `vendor:publish --tag=ichava-assets` copies the pre-built Vite output into `public/vendor/ichava/`. |
| `ichava:inject-npm-scripts` | Adds `ichava:dev`, `ichava:build`, `ichava:watch` scripts to your host app's `package.json`. |

## Requirements

- PHP 8.3+
- Laravel 10, 12, or 13+
- [`ichava/core`](https://github.com/ichava/core) `^1.0` (Composer pulls this automatically)

## Install

```bash
composer require ichava/browser
```

Publish the browser config and the SPA assets:

```bash
php artisan vendor:publish --tag=ichava-browser-config
php artisan vendor:publish --tag=ichava-assets
```

Visit:

```
http://example.com/ichava/icons
```

The `ichava` prefix comes from `ICHAVA_BROWSER_PREFIX` in core's config (the prefix is shared between core's API and the browser SPA).

## Quick example

After installing an icon pack, every installed pack is searchable in the SPA. To call the REST API instead:

```bash
curl "https://example.com/ichava/api/icons?search=home&package=ichava/tabler-icons"
```

```php
// PHP equivalent
use Illuminate\Support\Facades\Http;

$icons = Http::get('https://example.com/ichava/api/icons', [
    'search'  => 'home',
    'package' => 'ichava/tabler-icons',
])->json();
```

## Documentation

Full docs at [`ichava/documentation`](https://github.com/ichava/documentation).

Per-topic shortcuts:

- [Installation](https://github.com/ichava/documentation/blob/main/browser/installation.md)
- [Configuration](https://github.com/ichava/documentation/blob/main/browser/configuration.md)
- [Environment variables](https://github.com/ichava/documentation/blob/main/browser/environment.md)
- [API endpoints](https://github.com/ichava/documentation/blob/main/browser/api-endpoints.md)
- [shadcn-vue installer](https://github.com/ichava/documentation/blob/main/browser/shadcn-installer.md)

Cross-cutting:

- [Architecture](https://github.com/ichava/documentation/blob/main/architecture.md)
- [Security model](https://github.com/ichava/documentation/blob/main/security-model.md)
- [Troubleshooting](https://github.com/ichava/documentation/blob/main/troubleshooting.md)

## Contributing

PHP tests run with `vendor/bin/pest`. Frontend dev server: `npm install && npm run dev` (port 5174). See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Email `security@simtabi.com` privately for vulnerabilities. See [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License.  

© Simtabi LLC
