<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware;

use Inertia\Middleware;
use Illuminate\Http\Request;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

final class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'ichava/icon-browser::app';

    public function __construct(
        private readonly IconPreferenceService $preferences,
    ) {}

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => fn () => $request->user()
                ? $request->user()->only('id', 'name', 'email')
                : null,

            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
            ],

            'preferences' => fn () => $this->preferences->getAll(),

            'ichava' => fn () => [
                'prefix'       => config('ichava.core.prefix', 'ichava'),
                'perPage'      => (int) config('ichava.icon-browser.browser.per_page', 24),
                'defaultTheme' => config('ichava.icon-browser.browser.default_theme', 'light'),
                'routes'       => [
                    'browser'     => route('ichava.inertia.browser'),
                    'stats'       => route('ichava.inertia.stats'),
                    'packages'    => route('ichava.inertia.packages.index'),
                    'favorites'   => route('ichava.inertia.favorites.index'),
                    'collections' => route('ichava.inertia.collections.index'),
                    'history'     => route('ichava.inertia.history.index'),
                    'commands'    => route('ichava.inertia.commandHistory.index'),
                    'settings'    => route('ichava.inertia.settings.index'),
                    'cache'       => [
                        'clear'   => route('ichava.inertia.cache.clear'),
                        'rebuild' => route('ichava.inertia.cache.rebuild'),
                    ],
                ],
            ],
        ]);
    }
}
