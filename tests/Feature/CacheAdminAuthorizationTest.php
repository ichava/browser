<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Gate;

/**
 * S9 — the destructive cache endpoints must be authorised, not merely rate limited.
 *
 * `POST ichava/api/cache/clear` and `.../rebuild` shipped with a 10/minute limit and no
 * authorization at all. `rebuildCache()` also calls `PreferenceService::clear()`, so one
 * unauthenticated request flushed a 128,000-icon cache AND wiped every stored preference.
 * A rate limit slows repetition; it never decides who is allowed.
 *
 * These assert the gate from the outside, on the wire, rather than asserting that the
 * middleware class exists — a middleware registered but not attached to the route passes
 * the second kind of test and none of the first.
 */

/** Every route that mutates cache state, across both the JSON API and the HTML surface. */
function destructiveCacheRoutes(): array
{
    return [
        'api clear' => '/ichava/api/cache/clear',
        'api rebuild' => '/ichava/api/cache/rebuild',
        'web clear' => '/ichava/cache/clear',
        'web rebuild' => '/ichava/cache/rebuild',
    ];
}

it('refuses every destructive cache route when no ability is defined', function (string $uri) {
    // The default posture. An install that has not opted in must be closed, including in
    // local development: a gate that allows in some environments teaches the wrong thing
    // about what is protected.
    expect(Gate::has('ichava.manage-cache'))->toBeFalse();

    $this->postJson($uri)->assertForbidden();
})->with(destructiveCacheRoutes());

it('refuses every destructive cache route when the ability denies', function (string $uri) {
    Gate::define('ichava.manage-cache', fn (?object $user) => false);

    $this->postJson($uri)->assertForbidden();
})->with(destructiveCacheRoutes());

it('allows a destructive cache route when the ability grants', function (string $uri) {
    Gate::define('ichava.manage-cache', fn (?object $user) => true);

    // Anything but 403 proves the gate opened. The handlers themselves are covered
    // elsewhere; what matters here is that authorization is no longer what stops the
    // request.
    expect($this->postJson($uri)->status())->not->toBe(403);
})->with(destructiveCacheRoutes());

it('explains a missing ability differently from a denied one', function () {
    // The two cases need different messages: one is a misconfiguration the operator can
    // fix, the other is their own policy saying no. Collapsing them into a bare 403 sends
    // an operator hunting through their policies for a rule they never wrote.
    $missing = $this->postJson('/ichava/api/cache/clear');
    expect($missing->json('message'))->toContain('not configured');

    Gate::define('ichava.manage-cache', fn (?object $user) => false);
    $denied = $this->postJson('/ichava/api/cache/clear');
    expect($denied->json('message'))->not->toContain('not configured');
});

it('honours the deliberate escape hatch for trusted deployments', function () {
    // Some internal installs genuinely want the old behaviour. It has to be switched on
    // explicitly rather than being what happens when nobody decided.
    config()->set('ichava.browser.security.cache_admin.allow_without_gate', true);

    expect($this->postJson('/ichava/api/cache/clear')->status())->not->toBe(403);
});

it('uses the configured ability name rather than a hardcoded one', function () {
    config()->set('ichava.browser.security.cache_admin.ability', 'my-app.icons');
    Gate::define('my-app.icons', fn (?object $user) => true);

    expect($this->postJson('/ichava/api/cache/clear')->status())->not->toBe(403);
});
