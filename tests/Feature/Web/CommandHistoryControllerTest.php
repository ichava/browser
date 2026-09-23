<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

/**
 * Inertia-route coverage for CommandHistoryController.
 *
 * Pins the command history page, entry logging and clearing.
 */
describe('CommandHistoryController::index', function () {
    it('renders the CommandHistory/Index page', function () {
        app(IconPreferenceService::class)->addCommandHistory('open settings', 'navigation', []);

        $response = test()->get(route('ichava.inertia.commandHistory.index'));

        $response->assertOk()->assertInertia(fn ($page) => $page
            ->component('CommandHistory/Index')
            ->where('count', 1)
            ->has('commands', 1));
    });
});

describe('CommandHistoryController mutations', function () {
    it('stores a command and redirects back', function () {
        $response = test()->from('/ichava/command-history')->post(
            route('ichava.inertia.commandHistory.store'),
            ['command' => 'toggle theme', 'type' => 'action'],
        );

        $response->assertRedirect('/ichava/command-history');
        expect(app(IconPreferenceService::class)->getCommandHistory())->toHaveCount(1);
    });

    it('rejects an unknown type with errors', function () {
        $response = test()->from('/ichava/command-history')->post(
            route('ichava.inertia.commandHistory.store'),
            ['command' => 'toggle theme', 'type' => 'explode'],
        );

        $response->assertSessionHasErrors('type');
    });

    it('clears the command history with flash feedback', function () {
        $service = app(IconPreferenceService::class);
        $service->addCommandHistory('open settings', 'navigation', []);

        $response = test()->from('/ichava/command-history')->delete(
            route('ichava.inertia.commandHistory.clear'),
        );

        $response->assertRedirect('/ichava/command-history')->assertSessionHas('success');
        expect($service->getCommandHistory())->toBeEmpty();
    });
});
