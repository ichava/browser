<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;

/**
 * Inertia-route coverage for CacheController.
 *
 * Pins the gated destructive cache operations, which redirect back with
 * flash data. The gate is granted here; the fail-closed denial path is
 * covered by CacheAdminAuthorizationTest.
 */
beforeEach(function () {
    Gate::define('ichava.manage-cache', fn (?object $user) => true);
});

describe('CacheController', function () {
    it('clears the cache and redirects back with flash', function () {
        $response = test()->from('/ichava/stats')->post(
            route('ichava.inertia.cache.clear'),
        );

        $response->assertRedirect('/ichava/stats')->assertSessionHas('success');
    });

    it('rebuilds the cache and redirects back with flash', function () {
        $response = test()->from('/ichava/stats')->post(
            route('ichava.inertia.cache.rebuild'),
        );

        $response->assertRedirect('/ichava/stats')->assertSessionHas('success');
    });
});
