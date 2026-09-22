[← Docs index](../README.md#documentation)

# Configuration

*Reference.*

Publish `config/ichava/icon-browser.php` once after install:

```bash
php artisan vendor:publish --tag=ichava::icon-browser-config
```

Browser-specific HTTP keys live here. Engine config (database, queue, logging) is in [`config/ichava/core.php`](https://opensource.simtabi.com/documentation/ichava/core/configuration).

## Top-level keys

```php
return [
    // Vite dev server (HMR)
    'vite_dev_mode' => env('ICHAVA_VITE_DEV', true),

    // Browser UI
    'browser' => [
        'per_page'       => env('ICHAVA_BROWSER_PER_PAGE', 60),
        'cache_duration' => env('ICHAVA_BROWSER_CACHE', 3600),
        'theme_toggle'   => true,
        'default_theme'  => 'light', // 'light' | 'dark'
    ],

    // Demo Blade components (<x-ichava::ichava-test-icons>, <x-ichava::ichava-ui-icons>)
    'test_component_enabled' => env('ICHAVA_TEST_COMPONENT_ENABLED', true),

    // Multi-domain restriction (empty = every domain)
    'domains' => env('ICHAVA_DOMAINS', []),

    // REST API
    'api' => [
        'pretty_print' => env('ICHAVA_API_PRETTY_PRINT', true),
        'cors' => [
            'enabled'         => env('ICHAVA_API_CORS_ENABLED', true),
            'allowed_origins' => env('ICHAVA_API_CORS_ORIGINS', '*'),
            'allowed_methods' => 'GET, POST, PUT, DELETE, OPTIONS',
            'allowed_headers' => 'Content-Type, Authorization, X-Requested-With, Accept',
        ],
    ],

    // HTTP request body cap (bytes, IchavaApiSecurity middleware)
    'max_request_size' => env('ICHAVA_MAX_REQUEST_SIZE', 1_048_576),

    // Rate limiting (requests per minute)
    'rate_limiting' => [
        'enabled'   => env('ICHAVA_RATE_LIMITING_ENABLED', false),
        'browser'   => env('ICHAVA_BROWSER_RATE_LIMIT', 300),
        'api'       => env('ICHAVA_API_RATE_LIMIT', 600),
        'api_floor' => env('ICHAVA_API_FLOOR', 300),
    ],
];
```

## Notes

- The route prefix (`/{prefix}/icons`, `/{prefix}/api/...`) is set by `ICHAVA_BROWSER_PREFIX` and lives in **core's** config (`config('ichava.core.prefix')`). Both packages read it.
- `rate_limiting.enabled = false` (default) makes per-bucket limits no-ops. The `api_floor` global throttle still applies regardless.
- Multi-domain mode: set `ICHAVA_DOMAINS=app.test,admin.test` to restrict routes. Empty (default) means routes are reachable on every domain.

## See also

- [Environment variables](environment.md), every browser-related `ICHAVA_*` env var
- [Core configuration](https://opensource.simtabi.com/documentation/ichava/core/configuration), engine keys
- [API endpoints](tools/api-endpoints.md)
- [Architecture](https://opensource.simtabi.com/documentation/ichava/core/architecture)

---

[← Docs index](../README.md#documentation)
