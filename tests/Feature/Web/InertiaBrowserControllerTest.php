<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Models\Icon;

/**
 * Inertia-route coverage for InertiaBrowserController.
 *
 * Pins the browser listing (with filters, pagination and library props),
 * the icon detail page and the stats dashboard.
 */
describe('InertiaBrowserController::index', function () {
    it('renders the Browser/Index page with the full prop contract', function () {
        Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        Icon::create(['package' => 'ichava/test-pack', 'name' => 'moon', 'path' => '/fake/moon.svg']);

        $response = test()->get(route('ichava.inertia.browser'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Browser/Index')
            ->has('icons', 2)
            ->where('pagination.total', 2)
            ->has('appliedFilters')
            ->has('filterOptions')
            ->has('statistics')
            ->has('tree')
            ->has('packages')
            ->has('favorites')
            ->has('collections')
            ->has('history')
            ->has('commandHistory')
            ->has('auth')
            ->has('flash')
            ->has('preferences')
            ->has('ichava'));
    });

    it('narrows the listing through validated query filters', function () {
        Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        Icon::create(['package' => 'ichava/other-pack', 'name' => 'comet', 'path' => '/fake/comet.svg']);

        $response = test()->get(route('ichava.inertia.browser', [
            'search'   => 'star',
            'packages' => ['ichava/test-pack'],
            'per_page' => 10,
        ]));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Browser/Index')
            ->where('pagination.total', 1)
            ->where('appliedFilters.search', 'star'));
    });

    it('renders empty props rather than failing on an empty database', function () {
        $response = test()->get(route('ichava.inertia.browser'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Browser/Index')
            ->where('pagination.total', 0)
            ->has('icons', 0));
    });
});

describe('InertiaBrowserController::show', function () {
    it('renders the Browser/Show page with the icon and related', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);

        $response = test()->get(route('ichava.inertia.icons.show', ['id' => $icon->id]));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Browser/Show')
            ->where('icon.id', $icon->id)
            ->where('icon.name', 'star')
            ->has('related'));
    });

    it('redirects to the browser with an error for a missing icon', function () {
        $response = test()->get(route('ichava.inertia.icons.show', ['id' => 999999]));

        $response->assertRedirect(route('ichava.inertia.browser'))
            ->assertSessionHas('error');
    });
});

describe('InertiaBrowserController::stats', function () {
    it('renders the Stats/Index page with dashboard props', function () {
        Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);

        $response = test()->get(route('ichava.inertia.stats'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Stats/Index')
            ->has('statistics')
            ->has('packageStats')
            ->has('topCategories')
            ->has('cacheStats')
            ->has('cacheHealthy')
            ->has('updateStatus'));
    });
});
