<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

/**
 * Inertia-route coverage for HistoryController.
 *
 * Pins the history page with resolved icons, entry logging and clearing.
 */
describe('HistoryController::index', function () {
    it('renders the History/Index page with entries and icons', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        app(IconPreferenceService::class)->addHistoryEntry($icon->id, 'view');

        $response = test()->get(route('ichava.inertia.history.index'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('History/Index')
            ->where('count', 1)
            ->has('history', 1));
    });

    it('renders empty props with no history', function () {
        $response = test()->get(route('ichava.inertia.history.index'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('History/Index')
            ->where('count', 0));
    });
});

describe('HistoryController mutations', function () {
    it('stores an entry and redirects back', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);

        $response = test()->from('/ichava/history')->post(route('ichava.inertia.history.store'), [
            'icon_id' => $icon->id,
            'action'  => 'copy',
        ]);

        $response->assertRedirect('/ichava/history');
        expect(app(IconPreferenceService::class)->getHistory())->toHaveCount(1);
    });

    it('rejects an unknown action with errors', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);

        $response = test()->from('/ichava/history')->post(route('ichava.inertia.history.store'), [
            'icon_id' => $icon->id,
            'action'  => 'explode',
        ]);

        $response->assertSessionHasErrors('action');
    });

    it('rejects a missing icon with an error flash', function () {
        $response = test()->from('/ichava/history')->post(route('ichava.inertia.history.store'), [
            'icon_id' => 999999,
            'action'  => 'view',
        ]);

        $response->assertSessionHas('error');
    });

    it('clears the history with flash feedback', function () {
        $icon = Icon::create(['package' => 'ichava/test-pack', 'name' => 'star', 'path' => '/fake/star.svg']);
        $service = app(IconPreferenceService::class);
        $service->addHistoryEntry($icon->id, 'view');

        $response = test()->from('/ichava/history')->delete(route('ichava.inertia.history.clear'));

        $response->assertRedirect('/ichava/history')->assertSessionHas('success');
        expect($service->getHistory())->toBeEmpty();
    });
});
