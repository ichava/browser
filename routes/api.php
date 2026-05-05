<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api\IconBrowserApiController;
use Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api\FavoritesApiController;
use Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api\CollectionsApiController;
use Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api\HistoryApiController;
use Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api\CommandHistoryApiController;
use Simtabi\Laranail\Ichava\Browser\Support\Helpers;

/*
|--------------------------------------------------------------------------
| Ichava API Routes
|--------------------------------------------------------------------------
|
| RESTful API endpoints for the Ichava icon browser.
| All routes return JSON responses.
|
| Middleware: ['api']
| Prefix: /ichava/api
|
*/

// Ichava API Routes
// Uses 'ichava.api' middleware group which includes:
// - web (session, CSRF, cookies)
// - ichava.session (ensure session started)
// - ichava.security (XSS, SQL injection protection)
// - ichava.json (force JSON responses)
// - ichava.log (request logging in debug mode)
Route::prefix(config('ichava.prefix', 'ichava') . '/api')
    ->middleware('ichava.api')
    ->name('ichava.api.')
    ->group(function () {

        // =====================================================================
        // ICON MANAGEMENT API
        // =====================================================================
        Route::prefix('icons')
            ->name('icons.')
            ->group(function () {
                // List all icons with filtering, searching, and pagination
                Route::get('/', [IconBrowserApiController::class, 'index'])
                    ->middleware(Helpers::getRateLimit('api', 120))
                    ->name('index');

                // Get single icon details
                Route::get('/{id}', [IconBrowserApiController::class, 'show'])
                    ->middleware(Helpers::getRateLimit('api', 300))
                    ->name('show')
                    ->where('id', '[0-9]+');

                // Get SVG content for a specific icon
                Route::get('/{id}/svg', [IconBrowserApiController::class, 'svg'])
                    ->middleware(Helpers::getRateLimit('api', 300))
                    ->name('svg')
                    ->where('id', '[0-9]+');

                // Get filter options (packages, categories, variants)
                Route::get('/filters', [IconBrowserApiController::class, 'filters'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('filters');

                // Get hierarchical tree structure
                Route::get('/tree', [IconBrowserApiController::class, 'tree'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('tree');

                // Get icon statistics
                Route::get('/statistics', [IconBrowserApiController::class, 'statistics'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('statistics');
            });

        // =====================================================================
        // PACKAGES API
        // =====================================================================
        Route::prefix('packages')
            ->name('packages.')
            ->group(function () {
                // List all packages with icon counts
                Route::get('/', [IconBrowserApiController::class, 'packages'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('index');

                // Get single package details
                // Package names use vendor/package format (e.g., ichava/tabler-icons)
                Route::get('/{package}', [IconBrowserApiController::class, 'package'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('show')
                    ->where('package', '[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+');
            });

        // =====================================================================
        // TERMS API (Categories & Variants)
        // =====================================================================
        Route::prefix('terms')
            ->name('terms.')
            ->group(function () {
                // Get all categories
                Route::get('/categories', [IconBrowserApiController::class, 'categories'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('categories');

                // Get all variants
                Route::get('/variants', [IconBrowserApiController::class, 'variants'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('variants');

                // Get category/variant hierarchy with icon counts
                Route::get('/hierarchy', [IconBrowserApiController::class, 'termsHierarchy'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('hierarchy');
            });

        // =====================================================================
        // USER PREFERENCES API
        // =====================================================================
        Route::prefix('preferences')
            ->name('preferences.')
            ->group(function () {
                Route::get('/', [IconBrowserApiController::class, 'preferences'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('index');

                Route::post('/', [IconBrowserApiController::class, 'updatePreferences'])
                    ->middleware(Helpers::getRateLimit('api', 30))
                    ->name('update');

                Route::post('/search', [IconBrowserApiController::class, 'updateSearch'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('search');

                Route::post('/filters', [IconBrowserApiController::class, 'updateFilters'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('filters');

                Route::delete('/', [IconBrowserApiController::class, 'clearPreferences'])
                    ->middleware(Helpers::getRateLimit('api', 30))
                    ->name('clear');
            });

        // =====================================================================
        // CACHE MANAGEMENT API
        // =====================================================================
        // Get cache statistics
        Route::get('/cache/stats', [IconBrowserApiController::class, 'cacheStats'])
            ->middleware(Helpers::getRateLimit('api', 60))
            ->name('cache.stats');

        // Cache write operations
        Route::prefix('cache')
            ->name('cache.')
            ->middleware(Helpers::getRateLimit('api', 10))
            ->group(function () {
                Route::post('/clear', [IconBrowserApiController::class, 'clearCache'])
                    ->name('clear');

                Route::post('/rebuild', [IconBrowserApiController::class, 'rebuildCache'])
                    ->name('rebuild');
            });

        // =====================================================================
        // FAVORITES API
        // =====================================================================
        Route::prefix('favorites')
            ->name('favorites.')
            ->group(function () {
                // List user's favorites
                Route::get('/', [FavoritesApiController::class, 'index'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('index');

                // Add icon to favorites
                Route::post('/{iconId}', [FavoritesApiController::class, 'store'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('store')
                    ->where('iconId', '[0-9]+');

                // Remove icon from favorites
                Route::delete('/{iconId}', [FavoritesApiController::class, 'destroy'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('destroy')
                    ->where('iconId', '[0-9]+');

                // Toggle favorite status
                Route::post('/{iconId}/toggle', [FavoritesApiController::class, 'toggle'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('toggle')
                    ->where('iconId', '[0-9]+');
            });

        // =====================================================================
        // COLLECTIONS API
        // =====================================================================
        Route::prefix('collections')
            ->name('collections.')
            ->group(function () {
                // List user's collections
                Route::get('/', [CollectionsApiController::class, 'index'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('index');

                // Get single collection
                Route::get('/{id}', [CollectionsApiController::class, 'show'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('show');

                // Create new collection
                Route::post('/', [CollectionsApiController::class, 'store'])
                    ->middleware(Helpers::getRateLimit('api', 30))
                    ->name('store');

                // Update collection
                Route::put('/{id}', [CollectionsApiController::class, 'update'])
                    ->middleware(Helpers::getRateLimit('api', 30))
                    ->name('update');

                // Delete collection
                Route::delete('/{id}', [CollectionsApiController::class, 'destroy'])
                    ->middleware(Helpers::getRateLimit('api', 30))
                    ->name('destroy');

                // Add icon to collection
                Route::post('/{id}/icons/{iconId}', [CollectionsApiController::class, 'addIcon'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('addIcon')
                    ->where('iconId', '[0-9]+');

                // Remove icon from collection
                Route::delete('/{id}/icons/{iconId}', [CollectionsApiController::class, 'removeIcon'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('removeIcon')
                    ->where('iconId', '[0-9]+');
            });

        // =====================================================================
        // HISTORY API
        // =====================================================================
        Route::prefix('history')
            ->name('history.')
            ->group(function () {
                // Get user's history
                Route::get('/', [HistoryApiController::class, 'index'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('index');

                // Log icon action
                Route::post('/', [HistoryApiController::class, 'store'])
                    ->middleware(Helpers::getRateLimit('api', 120))
                    ->name('store');

                // Clear history
                Route::delete('/', [HistoryApiController::class, 'clear'])
                    ->middleware(Helpers::getRateLimit('api', 30))
                    ->name('clear');
            });

        // =====================================================================
        // COMMAND HISTORY API (Command Palette)
        // =====================================================================
        Route::prefix('command-history')
            ->name('commandHistory.')
            ->group(function () {
                // Get recent command history
                Route::get('/', [CommandHistoryApiController::class, 'index'])
                    ->middleware(Helpers::getRateLimit('api', 60))
                    ->name('index');

                // Log command execution
                Route::post('/', [CommandHistoryApiController::class, 'store'])
                    ->middleware(Helpers::getRateLimit('api', 120))
                    ->name('store');

                // Clear command history
                Route::delete('/', [CommandHistoryApiController::class, 'clear'])
                    ->middleware(Helpers::getRateLimit('api', 30))
                    ->name('clear');
            });
    });

