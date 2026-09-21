<?php

declare(strict_types=1);

use Illuminate\Support\Facades\View;

/**
 * The view namespace is vendor-scoped, not the bare ecosystem slug.
 *
 * Laravel keeps view namespaces in a flat hint map, so `ichava` is a plausible
 * claim for any of the twelve repositories here and for the consuming
 * application. The loser of a collision is replaced silently and surfaces much
 * later as a missing view.
 *
 * Read from the live finder rather than the provider: grepping the
 * registration proves how it was written, not what the framework ended up
 * holding.
 */
it('registers views under the composer package name', function () {
    expect(array_keys(View::getFinder()->getHints()))->toContain('ichava/browser');
});

it('does not claim the bare ecosystem slug as a view namespace', function () {
    expect(array_keys(View::getFinder()->getHints()))->not->toContain('ichava');
});

it('resolves every view this package renders', function () {
    foreach ([
        'ichava/browser::browser.index',
        'ichava/browser::stats.index',
        'ichava/browser::components.layouts.app',
        'ichava/browser::components.layouts.browser',
        'ichava/browser::components.sri-asset',
    ] as $view) {
        expect(View::exists($view))->toBeTrue("view [{$view}] does not resolve");
    }
});

it('leaves the Blade component registries alone', function () {
    // Decision B, deferred: <x-ichava::icon> is the ecosystem's documented
    // public API across ~109 references. It is a different registry from the
    // view hints and must not move with them.
    expect(array_keys(app('blade.compiler')->getClassComponentAliases()))
        ->toContain('ichava::layouts.app');
});
