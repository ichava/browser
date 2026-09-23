[← Docs index](../README.md#documentation)

# Installation

*How-to guide.*

`ichava/icon-browser` is the optional HTTP layer for Ichava: visual icon browser SPA + REST API + middleware. Install it on top of [`ichava/core`](https://opensource.simtabi.com/documentation/ichava/core/installation).

## 1. Require the package

`ichava/icon-browser` is not on Packagist either, so add its repository alongside the ones
[core's installation](https://opensource.simtabi.com/documentation/ichava/core/installation) already asked for:

```json
{ "type": "vcs", "url": "https://github.com/ichava/icon-browser" }
```

```bash
composer require ichava/icon-browser:^0.1
```

The `IconBrowserServiceProvider` registers automatically. The browser depends on `ichava/core`, so Composer pulls it transitively if you don't already have it, but only if core's repository is declared in **your** `composer.json`: Composer reads `repositories` from the root package only.

## 2. Publish the browser config

```bash
php artisan vendor:publish --tag=ichava:browser-config
```

Creates `config/ichava/icon-browser.php`. See [configuration](configuration.md) for the keys.

## 3. Publish the SPA assets

```bash
php artisan vendor:publish --tag=ichava-assets
```

Copies the pre-built Vite output (`ichava.js`, `ichava.css`, source maps) into `public/vendor/ichava/`. Do this after every `composer update` of the package.

## 4. Visit the browser

```
http://example.com/ichava/icons
```

The prefix (`ichava` by default) is set by `ICHAVA_BROWSER_PREFIX`. The same prefix is shared with core's REST API at `/ichava/api/...`.

## 5. (Optional) Inject npm scripts for development

If you want to rebuild the SPA yourself:

```bash
php artisan ichava::icon-browser.inject-scripts
```

Adds `ichava:build`, `ichava:build:prod`, and `ichava:watch` to your host app's `package.json`. Run `npm run ichava:watch` to rebuild on change, or `npm run ichava:build:prod` for a production bundle.

You only need this if you customise the SPA. End users running pre-built assets do not.

## What you get on top of core

- The React + Inertia.js icon browser at `/{prefix}/icons`
- The REST API at `/{prefix}/api/...` (icons, packages, terms, preferences, cache)
- All Ichava middleware (`ichava.api`, `ichava.web`, hybrid Sanctum/session detection)
- The `<x-ichava:ichava-test-icons>` and `<x-ichava:ichava-ui-icons>` demo Blade components
- The `ui-icons` icon set used by the SPA
- The `ichava::icon-browser.inject-scripts` Artisan command

## See also

- [Configuration](configuration.md)
- [Environment variables](environment.md)
- [API endpoints](tools/api-endpoints.md)
- [Core installation](https://opensource.simtabi.com/documentation/ichava/core/installation)
- [Troubleshooting](https://opensource.simtabi.com/documentation/ichava/core/troubleshooting)

---

[← Docs index](../README.md#documentation)
