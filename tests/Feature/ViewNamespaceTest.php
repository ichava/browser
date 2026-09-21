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

it('aliases the tag-safe hyphen form over the same paths', function () {
    // Taking the default creates a *second* hint as a side effect, not by an
    // explicit call: componentPrefix() now differs from viewNamespace(), so
    // package-tools aliases `ichava-browser` over the paths loadViewsFrom()
    // resolved -- Blade's component-tag pattern admits no forward slash, so
    // `ichava/browser` is unusable as a tag prefix. Pinned because nothing in
    // this package asks for it, and an upstream change could drop it silently.
    $hints = View::getFinder()->getHints();

    expect(array_keys($hints))->toContain('ichava-browser');
    expect($hints['ichava-browser'])->toBe($hints['ichava/browser']);
});

it('ships exactly the views the resolution test enumerates', function () {
    // Guards the list above against going stale. A template added later without
    // a matching entry would be resolved by nothing, and the suite would stay
    // green -- a gate that cannot fail.
    $shipped = (new Symfony\Component\Finder\Finder)
        ->files()
        ->in(dirname(__DIR__, 2) . '/resources/views')
        ->name('*.blade.php');

    expect(iterator_count($shipped))->toBe(5);
});

it('leaves the anonymous-component prefix and class-component namespace alone', function () {
    // The other two of the four flat maps keyed `ichava`, both Decision B's.
    //
    // The anonymous one is worth knowing precisely: Laravel implements
    // anonymousComponentPath() as addNamespace(hash('xxh128', $prefix), $path),
    // so the bare slug still determines a key in *the view-hint map this test
    // file is about* -- just a hashed one. xxh128('ichava') is
    // 5b1e20c654d21c0fe003862e38b6a4f3, and it is in getHints() right now.
    //
    // So scoping the view namespace reduces the collision hazard rather than
    // removing it: another package calling anonymousComponentPath($other,
    // 'ichava') computes the same key and replaces this package's entry with
    // no error. That residue is Decision B's to resolve.
    $blade = app('blade.compiler');

    expect(array_column($blade->getAnonymousComponentPaths(), 'prefix'))
        ->toContain('ichava');

    expect(array_keys($blade->getClassComponentNamespaces()))
        ->toContain('ichava');
});
