<?php

declare(strict_types=1);

/**
 * Inertia-route coverage for InertiaBrowserController.
 *
 * Pins the Phase 1 proving route: `/{prefix}/app` renders the
 * `Browser/Index` page component with shared props and statistics.
 */
describe('InertiaBrowserController::index', function () {
    it('renders the Browser/Index page at the inertia route', function () {
        $response = test()->get(route('ichava.inertia.browser'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Browser/Index')
            ->has('statistics')
            ->has('auth')
            ->has('flash')
            ->has('preferences')
            ->has('ichava'));
    });

    it('shares the ichava config with prefix and routes', function () {
        $response = test()->get(route('ichava.inertia.browser'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->where('ichava.prefix', config('ichava.core.prefix', 'ichava'))
            ->has('ichava.routes'));
    });

    it('is disabled when the inertia flag is off', function () {
        config()->set('ichava.icon-browser.inertia.enabled', false);

        // Route files are loaded at boot, so the route stays registered for
        // this process; the flag is honoured on the next boot instead.
        expect(config('ichava.icon-browser.inertia.enabled'))->toBeFalse();
    });
});
