<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

/**
 * Inertia-route coverage for FavoriteController.
 *
 * Pins the favorites page and the store/destroy/toggle mutations, which
 * redirect back with flash data.
 */
describe('FavoriteController::index', function () {
    it('renders the Favorites/Index page with ids and icons', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        app(IconPreferenceService::class)->addFavorite($icon->id);

        $response = test()->get(route('ichava.inertia.favorites.index'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Favorites/Index')
            ->where('count', 1)
            ->has('ids', 1)
            ->has('icons', 1));
    });

    it('renders empty props with no favorites', function () {
        $response = test()->get(route('ichava.inertia.favorites.index'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Favorites/Index')
            ->where('count', 0));
    });
});

describe('FavoriteController mutations', function () {
    it('stores a favorite and redirects back with flash', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);

        $response = test()->from('/ichava/icons')->post(route('ichava.inertia.favorites.store', [
            'iconId' => $icon->id,
        ]));

        $response->assertRedirect('/ichava/icons')->assertSessionHas('success');
        expect(app(IconPreferenceService::class)->getFavorites())->toContain($icon->id);
    });

    it('rejects a missing icon with an error flash', function () {
        $response = test()->from('/ichava/icons')->post(route('ichava.inertia.favorites.store', [
            'iconId' => 999999,
        ]));

        $response->assertRedirect('/ichava/icons')->assertSessionHas('error');
    });

    it('toggles a favorite off and on', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        $service = app(IconPreferenceService::class);

        test()->from('/ichava/icons')->post(route('ichava.inertia.favorites.toggle', [
            'iconId' => $icon->id,
        ]))->assertSessionHas('success');
        expect($service->getFavorites())->toContain($icon->id);

        test()->from('/ichava/icons')->post(route('ichava.inertia.favorites.toggle', [
            'iconId' => $icon->id,
        ]))->assertSessionHas('success');
        expect($service->getFavorites())->not->toContain($icon->id);
    });

    it('destroys a favorite and redirects back with flash', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        $service = app(IconPreferenceService::class);
        $service->addFavorite($icon->id);

        $response = test()->from('/ichava/icons')->delete(route('ichava.inertia.favorites.destroy', [
            'iconId' => $icon->id,
        ]));

        $response->assertRedirect('/ichava/icons')->assertSessionHas('success');
        expect($service->getFavorites())->not->toContain($icon->id);
    });
});
