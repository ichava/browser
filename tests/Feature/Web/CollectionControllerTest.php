<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

/**
 * Inertia-route coverage for CollectionController.
 *
 * Pins the collections pages and the full CRUD plus icon membership
 * mutations, which redirect with flash data.
 */
function create_test_collection(string $name = 'Arrows'): array
{
    return app(IconPreferenceService::class)->createCollection($name, '#ff0000');
}

describe('CollectionController::index', function () {
    it('renders the Collections/Index page', function () {
        create_test_collection();

        $response = test()->get(route('ichava.inertia.collections.index'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Collections/Index')
            ->has('collections', 1));
    });
});

describe('CollectionController::show', function () {
    it('renders the Collections/Show page with resolved icons', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        $collection = create_test_collection();
        app(IconPreferenceService::class)->addIconToCollection($collection['id'], $icon->id);

        $response = test()->get(route('ichava.inertia.collections.show', [
            'id' => $collection['id'],
        ]));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('Collections/Show')
            ->where('collection.name', 'Arrows')
            ->has('collection.icons', 1));
    });

    it('redirects with an error for a missing collection', function () {
        $response = test()->get(route('ichava.inertia.collections.show', [
            'id' => 'no-such-id',
        ]));

        $response->assertRedirect(route('ichava.inertia.collections.index'))
            ->assertSessionHas('error');
    });
});

describe('CollectionController mutations', function () {
    it('stores a collection and redirects to its page', function () {
        $response = test()->post(route('ichava.inertia.collections.store'), [
            'name'  => 'Arrows',
            'color' => '#ff0000',
        ]);

        $response->assertSessionHas('success');
        expect($response->getTargetUrl())->toContain('/ichava/collections/');
    });

    it('rejects an invalid colour with errors', function () {
        $response = test()->from('/ichava/collections')->post(
            route('ichava.inertia.collections.store'),
            ['name' => 'Arrows', 'color' => 'not-a-colour'],
        );

        $response->assertSessionHasErrors('color');
    });

    it('updates a collection and redirects back', function () {
        $collection = create_test_collection();

        $response = test()->from('/ichava/collections')->put(
            route('ichava.inertia.collections.update', ['id' => $collection['id']]),
            ['name' => 'Renamed'],
        );

        $response->assertRedirect('/ichava/collections')->assertSessionHas('success');
        expect(app(IconPreferenceService::class)->getCollection($collection['id'])['name'])->toBe('Renamed');
    });

    it('destroys a collection and redirects to the index', function () {
        $collection = create_test_collection();

        $response = test()->delete(route('ichava.inertia.collections.destroy', [
            'id' => $collection['id'],
        ]));

        $response->assertRedirect(route('ichava.inertia.collections.index'))
            ->assertSessionHas('success');
        expect(app(IconPreferenceService::class)->getCollection($collection['id']))->toBeNull();
    });

    it('adds and removes an icon with flash feedback', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        $collection = create_test_collection();
        $service = app(IconPreferenceService::class);

        test()->from('/ichava/collections')->post(route('ichava.inertia.collections.addIcon', [
            'id'     => $collection['id'],
            'iconId' => $icon->id,
        ]))->assertSessionHas('success');
        expect($service->getCollection($collection['id'])['icon_ids'])->toContain($icon->id);

        test()->from('/ichava/collections')->delete(route('ichava.inertia.collections.removeIcon', [
            'id'     => $collection['id'],
            'iconId' => $icon->id,
        ]))->assertSessionHas('success');
        expect($service->getCollection($collection['id'])['icon_ids'] ?? [])->not->toContain($icon->id);
    });

    it('rejects adding a missing icon with an error flash', function () {
        $collection = create_test_collection();

        $response = test()->from('/ichava/collections')->post(
            route('ichava.inertia.collections.addIcon', ['id' => $collection['id'], 'iconId' => 999999]),
        );

        $response->assertSessionHas('error');
    });
});
