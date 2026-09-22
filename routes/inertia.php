<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Simtabi\Laranail\Ichava\Browser\Http\Controllers\Web\InertiaBrowserController;

/*
|--------------------------------------------------------------------------
| Ichava Inertia Routes
|--------------------------------------------------------------------------
|
| React pages served through Inertia.js. Loaded only when
| `ichava.browser.inertia.enabled` is truthy (see
| IchavaBrowserServiceProvider::configurePackage()).
|
| Middleware: 'ichava.inertia' (web + shared props + prefix validation)
| Prefix: /ichava
|
*/

Route::prefix(config('ichava.core.prefix', 'ichava'))
    ->middleware('ichava.inertia')
    ->name('ichava.inertia.')
    ->group(function () {

        Route::get('/app', [InertiaBrowserController::class, 'index'])
            ->name('browser');
    });
