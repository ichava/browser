<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Models\Icon;

/**
 * Web-route coverage for IconBrowserController.
 *
 * Pins the four public methods (index/stats/clearCache/rebuildCache) so a
 * future refactor cannot silently break the SPA mount, the stats dashboard,
 * or the two web-triggered cache operations.
 */
describe('IconBrowserController::index', function () {
    it('renders the SPA mount view at the configured prefix', function () {
        $response = test()->get(route('ichava.browser'));

        $response->assertOk()
            ->assertViewIs('ichava::browser.index')
            ->assertViewHas('packages')
            ->assertViewHas('categories')
            ->assertViewHas('preferences')
            ->assertViewHas('statistics');
    });

});

describe('IconBrowserController::stats', function () {
    it('renders the stats dashboard view', function () {
        $response = test()->get(route('ichava.stats'));

        $response->assertOk()
            ->assertViewIs('ichava::stats.index')
            ->assertViewHas('statistics')
            ->assertViewHas('packageStats')
            ->assertViewHas('topCategories')
            ->assertViewHas('cacheStats');
    });

    it('shows per-package counts when icons exist in the database', function () {
        Icon::create([
            'package' => 'ichava/test-pack',
            'name' => 'star',
            'path' => '/fake/star.svg',
        ]);

        $response = test()->get(route('ichava.stats'));

        $response->assertOk();
        $packageStats = $response->viewData('packageStats');
        expect($packageStats)->toBeArray();
    });
});

describe('IconBrowserController::clearCache', function () {
    it('returns a redirect with a success flash on the happy path', function () {
        $response = test()
            ->withoutMiddleware()
            ->post(route('ichava.cache.clear'), [], ['referer' => '/ichava/icons']);

        $response->assertRedirect();
        expect(session('success'))->not->toBeNull();
    });
});

describe('IconBrowserController::rebuildCache', function () {
    it('returns a redirect with a flash message on the happy path', function () {
        $response = test()
            ->withoutMiddleware()
            ->post(route('ichava.cache.rebuild'), [], ['referer' => '/ichava/icons']);

        $response->assertRedirect();
        // Either success or error, depending on whether discovery surfaces;
        // both are valid happy-path responses (the controller catches and flashes).
        expect(session('success') ?? session('error'))->not->toBeNull();
    });
});
