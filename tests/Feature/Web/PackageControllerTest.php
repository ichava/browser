<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Models\Icon;

/**
 * Inertia-route coverage for PackageController.
 *
 * Pins the packages listing and the package detail page, including the
 * invalid-format and unknown-package redirects.
 */
describe('PackageController::index', function () {
    it('renders the Packages/Index page', function () {
        $response = test()->get(route('ichava.inertia.packages.index'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Packages/Index')
            ->has('packages'));
    });
});

describe('PackageController::show', function () {
    it('renders the Packages/Show page with counts', function () {
        Icon::create(['package' => 'ichava/ui-icons', 'name' => 'star', 'path' => '/fake/star.svg']);

        $response = test()->get(route('ichava.inertia.packages.show', [
            'package' => 'ichava/ui-icons',
        ]));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Packages/Show')
            ->where('package.name', 'ichava/ui-icons')
            ->where('package.icon_count', 1)
            ->has('package.categories')
            ->has('package.variants'));
    });

    it('redirects with an error for an invalid package format', function () {
        $response = test()->get('/ichava/packages/not-a-vendor-package');

        $response->assertRedirect(route('ichava.inertia.packages.index'))
            ->assertSessionHas('error');
    });

    it('redirects with an error for an unregistered package', function () {
        $response = test()->get(route('ichava.inertia.packages.show', [
            'package' => 'ichava/no-such-pack',
        ]));

        $response->assertRedirect(route('ichava.inertia.packages.index'))
            ->assertSessionHas('error');
    });
});
