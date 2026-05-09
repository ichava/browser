<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;
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

Route::prefix(config('ichava.prefix', 'ichava'))
    ->middleware('ichava.web')
    ->name('ichava.')
    ->group(function () {

        // Redirect bare /{prefix} to the canonical browser URL.
        Route::redirect('/', '/'.config('ichava.prefix', 'ichava').'/icons')
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
        Route::prefix('cache')
            ->name('cache.')
            ->group(function () {
                Route::post('/clear', [IconBrowserController::class, 'clearCache'])
                    ->name('clear');
                Route::post('/rebuild', [IconBrowserController::class, 'rebuildCache'])
                    ->name('rebuild');
            });
    });


