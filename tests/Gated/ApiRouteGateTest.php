<?php

declare(strict_types=1);

/**
 * The REST API mounts only when opted in.
 *
 * Runs under ApiDisabledTestCase, which withholds the suite-wide opt-in, so
 * this boots the default-off state: no JSON route names resolve, while the
 * Inertia pages and legacy web redirect are unaffected.
 */
it('leaves every JSON route unmounted by default', function () {
    $router = app('router');

    expect($router->has('ichava.api.icons.index'))->toBeFalse()
        ->and($router->has('ichava.api.favorites.toggle'))->toBeFalse()
        ->and($router->has('ichava.api.cache.clear'))->toBeFalse();
});

it('keeps Inertia pages mounted while the API is off', function () {
    $response = test()->get(route('ichava.inertia.packages.index'));

    $response->assertOk();
});

it('answers unknown JSON paths with 404 rather than Inertia pages', function () {
    // No JSON route claims /ichava/api/*, so nothing matches: the request
    // must not fall through to an Inertia page or the home redirect.
    $response = test()->get('/ichava/api/icons');

    $response->assertNotFound();
});
