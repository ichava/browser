<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

/**
 * Inertia-route coverage for SettingsController.
 *
 * Pins the settings page and the preference mutations, which redirect
 * back with flash data.
 */
describe('SettingsController::index', function () {
    it('renders the Settings/Index page with validated preferences', function () {
        $response = test()->get(route('ichava.inertia.settings.index'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Settings/Index')
            ->has('preferences'));
    });
});

describe('SettingsController mutations', function () {
    it('updates preferences and redirects back with flash', function () {
        $response = test()->from('/ichava/settings')->put(
            route('ichava.inertia.settings.update'),
            ['preferences' => ['is_dark' => true]],
        );

        $response->assertRedirect('/ichava/settings')->assertSessionHas('success');
    });

    it('updates the search query', function () {
        $response = test()->from('/ichava/settings')->post(
            route('ichava.inertia.settings.search'),
            ['search' => 'arrow'],
        );

        $response->assertRedirect('/ichava/settings')->assertSessionHas('success');
        expect(app(IconPreferenceService::class)->getSearch())->toBe('arrow');
    });

    it('updates filters', function () {
        $response = test()->from('/ichava/settings')->post(
            route('ichava.inertia.settings.filters'),
            ['packages' => ['ichava/test-pack']],
        );

        $response->assertRedirect('/ichava/settings')->assertSessionHas('success');
        expect(app(IconPreferenceService::class)->getFilters()['packages'])->toContain('ichava/test-pack');
    });

    it('clears preferences with flash feedback', function () {
        $response = test()->from('/ichava/settings')->delete(
            route('ichava.inertia.settings.clear'),
        );

        $response->assertRedirect('/ichava/settings')->assertSessionHas('success');
    });
});
