<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Simtabi\Laranail\Ichava\Browser\Http\Controllers\Web\IconBrowserController;

/*
|--------------------------------------------------------------------------
| Ichava Web Routes
|--------------------------------------------------------------------------
|
| Web routes for the Ichava icon browser interface.
| These routes return HTML views and handle web-triggered cache operations.
|
| Middleware: 'ichava.web' (includes web + validation)
| Prefix: /ichava
|
*/

Route::prefix(config('ichava.core.prefix', 'ichava'))
    ->middleware('ichava.web')
    ->name('ichava.')
    ->group(function () {

        // Redirect bare /{prefix} to the canonical browser URL.
        Route::redirect('/', '/'.config('ichava.core.prefix', 'ichava').'/icons')
            ->name('home');

        // Browser UI. Route name kept as `browser` so views/layouts that call
        // route('ichava.browser') keep resolving.
        Route::get('/icons', [IconBrowserController::class, 'index'])
            ->name('browser');

        Route::get('/stats', [IconBrowserController::class, 'stats'])
            ->name('stats');

        // =====================================================================
        // WEB CACHE MANAGEMENT (returns redirects)
        // =====================================================================
        // Same gate as the JSON API. These call the identical services, so leaving the
        // web pair open would make the API's authorization a formality -- an attacker
        // would simply post to the HTML route instead.
        Route::prefix('cache')
            ->name('cache.')
            ->middleware('ichava.cache-admin')
            ->group(function () {
                Route::post('/clear', [IconBrowserController::class, 'clearCache'])
                    ->name('clear');
                Route::post('/rebuild', [IconBrowserController::class, 'rebuildCache'])
                    ->name('rebuild');
            });
    });
