<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
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
