<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Constants\IchavaConstants;

return [
    /*
    |--------------------------------------------------------------------------
    | Vite dev mode (HMR)
    |--------------------------------------------------------------------------
    | Enable Vite's hot-module-reload dev server during local development.
    | Auto-disabled in production regardless of this value.
    */
    'vite_dev_mode' => env('ICHAVA_VITE_DEV', true),

    /*
    |--------------------------------------------------------------------------
    | Browser UI
    |--------------------------------------------------------------------------
    | Mounted at /{prefix}/icons by default ({prefix} is the value below).
    | The same prefix is used by core's API routes (/{prefix}/api/...) so
    | the SPA and the REST API share a unified URL space.
    */
    'browser' => [
        'per_page' => env('ICHAVA_BROWSER_PER_PAGE', IchavaConstants::BROWSER_PER_PAGE),
        'cache_duration' => env('ICHAVA_BROWSER_CACHE', IchavaConstants::DEFAULT_CACHE_TTL),
        'theme_toggle' => true,
        'default_theme' => 'light', // 'light' | 'dark'
    ],

    /*
    |--------------------------------------------------------------------------
    | Demo / test components
    |--------------------------------------------------------------------------
    | The `<x-ichava::ichava-test-icons>` and `<x-ichava::ichava-ui-icons>`
    | shorthand components are registered by this package. Toggle off in
    | production if you don't want them rendered.
    */
    'test_component_enabled' => env('ICHAVA_TEST_COMPONENT_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Multi-domain support
    |--------------------------------------------------------------------------
    | [] (default) → routes work on every domain.
    | ['app.test', 'admin.test'] → restrict to listed domains.
    | Or pass a comma-separated string via ICHAVA_DOMAINS.
    */
    'domains' => env('ICHAVA_DOMAINS', []),

    /*
    |--------------------------------------------------------------------------
    | API
    |--------------------------------------------------------------------------
    | JSON-API behaviour and CORS policy.
    */
    'api' => [
        'pretty_print' => env('ICHAVA_API_PRETTY_PRINT', true),

        'cors' => [
            'enabled' => env('ICHAVA_API_CORS_ENABLED', true),
            // Default to the host application's URL only; never wildcard. Set
            // ICHAVA_API_CORS_ORIGINS to a comma-separated list to allow more.
            'allowed_origins' => env('ICHAVA_API_CORS_ORIGINS', env('APP_URL', 'http://localhost')),
            'allowed_methods' => 'GET, POST, PUT, DELETE, OPTIONS',
            'allowed_headers' => 'Content-Type, Authorization, X-Requested-With, Accept',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP request size guard
    |--------------------------------------------------------------------------
    | Hard cap on request body size (in bytes) enforced by IchavaApiSecurity
    | middleware. Default 1 MiB.
    */
    'max_request_size' => env('ICHAVA_MAX_REQUEST_SIZE', 1048576),

    /*
    |--------------------------------------------------------------------------
    | Rate limiting
    |--------------------------------------------------------------------------
    | Per-route throttle (requests per minute) for the browser UI and JSON API.
    */
    'rate_limiting' => [
        'enabled' => env('ICHAVA_RATE_LIMITING_ENABLED', false),
        'browser' => env('ICHAVA_BROWSER_RATE_LIMIT', 300),
        'api' => env('ICHAVA_API_RATE_LIMIT', 600),
        // Global floor applied to the `ichava.api` middleware group on top of
        // per-endpoint limits. Acts as a safety net regardless of `enabled`.
        'api_floor' => env('ICHAVA_API_FLOOR', 300),
    ],

    /*
    |--------------------------------------------------------------------------
    | HTTP security policy
    |--------------------------------------------------------------------------
    | Tunable knobs for IchavaApiSecurity middleware (CSP mode, HSTS, frame
    | policy, referrer policy) and the SriAsset Blade component (Subresource
    | Integrity for published assets).
    |
    | CSP modes:
    |   strict, '... default-src none ...' (current behaviour, JSON API only)
    |   nonce,  reads SecurityNonce + emits 'nonce-XYZ' in script-src/style-src
    |   hash,   pre-computed sha256 hashes from `security.csp.hashes`
    |
    | The browser SPA should run under `nonce` mode. Stateless JSON-only
    | deployments can stay on `strict`.
    */
    'security' => [
        'csp' => [
            'mode' => env('ICHAVA_CSP_MODE', 'strict'),
            'report_uri' => env('ICHAVA_CSP_REPORT_URI'),
            'report_only' => (bool) env('ICHAVA_CSP_REPORT_ONLY', false),
            'extra_directives' => [
                // 'connect-src' => "'self' https://api.example.test",
            ],
            'hashes' => [
                // 'script-src' => ["'sha256-...'"],
                // 'style-src'  => ["'sha256-...'"],
            ],
        ],

        'hsts' => [
            'enabled' => (bool) env('ICHAVA_HSTS_ENABLED', true),
            'max_age' => (int) env('ICHAVA_HSTS_MAX_AGE', 31536000),
            'include_subdomains' => (bool) env('ICHAVA_HSTS_INCLUDE_SUBDOMAINS', true),
            'preload' => (bool) env('ICHAVA_HSTS_PRELOAD', false),
        ],

        'frame_options' => env('ICHAVA_FRAME_OPTIONS', 'DENY'),
        'referrer_policy' => env('ICHAVA_REFERRER_POLICY', 'strict-origin-when-cross-origin'),
        'permissions_policy' => env(
            'ICHAVA_PERMISSIONS_POLICY',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        ),

        'sri' => [
            'enabled' => (bool) env('ICHAVA_SRI_ENABLED', true),
            'algorithm' => env('ICHAVA_SRI_ALGORITHM', 'sha384'),
            'manifest' => env('ICHAVA_SRI_MANIFEST'), // path to JSON map; null => compute on demand
        ],
    ],
];
