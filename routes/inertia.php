<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\CacheController;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\HistoryController;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\PackageController;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\FavoriteController;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\SettingsController;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\CollectionController;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\CommandHistoryController;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\InertiaBrowserController;

/*
|--------------------------------------------------------------------------
| Ichava Inertia Routes
|--------------------------------------------------------------------------
|
| React pages served through Inertia.js. Loaded only when
| `ichava.icon-browser.inertia.enabled` is truthy (see
| IconBrowserServiceProvider::configurePackage()).
|
| Page actions return Inertia responses; mutations redirect back with
| flash data. Validation failures redirect back with errors via the
| shared `errors` prop automatically.
|
| Middleware: 'ichava.inertia' (web + shared props + prefix validation)
| Prefix: /ichava
|
*/

Route::prefix(config('ichava.core.prefix', 'ichava'))
    ->middleware('ichava.inertia')
    ->name('ichava.inertia.')
    ->group(function () {

        // Browser: filtered icon listing + detail + stats dashboard.
        Route::get('/icons', [InertiaBrowserController::class, 'index'])
            ->name('browser');
        Route::get('/icons/{id}', [InertiaBrowserController::class, 'show'])
            ->name('icons.show')
            ->where('id', '[0-9]+');
        Route::get('/stats', [InertiaBrowserController::class, 'stats'])
            ->name('stats');

        // Packages.
        Route::get('/packages', [PackageController::class, 'index'])
            ->name('packages.index');
        // Loose constraint: the controller validates the vendor/package shape
        // itself so malformed input redirects back with a flash message
        // instead of falling through to a bare 404.
        Route::get('/packages/{package}', [PackageController::class, 'show'])
            ->name('packages.show')
            ->where('package', '.*');

        // Favorites.
        Route::get('/favorites', [FavoriteController::class, 'index'])
            ->name('favorites.index');
        Route::post('/favorites/{iconId}', [FavoriteController::class, 'store'])
            ->name('favorites.store')
            ->where('iconId', '[0-9]+');
        Route::delete('/favorites/{iconId}', [FavoriteController::class, 'destroy'])
            ->name('favorites.destroy')
            ->where('iconId', '[0-9]+');
        Route::post('/favorites/{iconId}/toggle', [FavoriteController::class, 'toggle'])
            ->name('favorites.toggle')
            ->where('iconId', '[0-9]+');

        // Collections.
        Route::get('/collections', [CollectionController::class, 'index'])
            ->name('collections.index');
        Route::post('/collections', [CollectionController::class, 'store'])
            ->name('collections.store');
        Route::get('/collections/{id}', [CollectionController::class, 'show'])
            ->name('collections.show');
        Route::put('/collections/{id}', [CollectionController::class, 'update'])
            ->name('collections.update');
        Route::delete('/collections/{id}', [CollectionController::class, 'destroy'])
            ->name('collections.destroy');
        Route::post('/collections/{id}/icons/{iconId}', [CollectionController::class, 'addIcon'])
            ->name('collections.addIcon')
            ->where('iconId', '[0-9]+');
        Route::delete('/collections/{id}/icons/{iconId}', [CollectionController::class, 'removeIcon'])
            ->name('collections.removeIcon')
            ->where('iconId', '[0-9]+');

        // Activity history.
        Route::get('/history', [HistoryController::class, 'index'])
            ->name('history.index');
        Route::post('/history', [HistoryController::class, 'store'])
            ->name('history.store');
        Route::delete('/history', [HistoryController::class, 'clear'])
            ->name('history.clear');

        // Command palette history.
        Route::get('/command-history', [CommandHistoryController::class, 'index'])
            ->name('commandHistory.index');
        Route::post('/command-history', [CommandHistoryController::class, 'store'])
            ->name('commandHistory.store');
        Route::delete('/command-history', [CommandHistoryController::class, 'clear'])
            ->name('commandHistory.clear');

        // Settings (preferences).
        Route::get('/settings', [SettingsController::class, 'index'])
            ->name('settings.index');
        Route::put('/settings', [SettingsController::class, 'update'])
            ->name('settings.update');
        Route::post('/settings/search', [SettingsController::class, 'updateSearch'])
            ->name('settings.search');
        Route::post('/settings/filters', [SettingsController::class, 'updateFilters'])
            ->name('settings.filters');
        Route::delete('/settings', [SettingsController::class, 'clear'])
            ->name('settings.clear');

        // Cache management. Same gate as the JSON API and the legacy web
        // pair: destructive, fails closed unless the host grants the ability.
        Route::prefix('cache')
            ->name('cache.')
            ->middleware('ichava.cache-admin')
            ->group(function () {
                Route::post('/clear', [CacheController::class, 'clear'])
                    ->name('clear');
                Route::post('/rebuild', [CacheController::class, 'rebuild'])
                    ->name('rebuild');
            });
    });
