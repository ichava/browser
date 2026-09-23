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
    expect(array_keys(View::getFinder()->getHints()))->toContain('ichava/icon-browser');
});

it('does not claim the bare ecosystem slug as a view namespace', function () {
    expect(array_keys(View::getFinder()->getHints()))->not->toContain('ichava');
});

it('resolves every view this package renders', function () {
    foreach ([
        'ichava/icon-browser::app',
        'ichava/icon-browser::components.sri-asset',
    ] as $view) {
        expect(View::exists($view))->toBeTrue("view [{$view}] does not resolve");
    }
});

it('leaves the Blade component registries alone', function () {
    // Decision B, deferred: <x-ichava::icon> is the ecosystem's documented
    // public API across ~109 references. It is a different registry from the
    // view hints and must not move with them.
    //
    // All three this package registers, not a representative one: a guard
    // naming a single alias passes while the other two are renamed, which is
    // most of what it exists to prevent. The Vue-era layout aliases are gone
    // with the layouts themselves.
    //
    // `ichava::icon` is core's registration, so it is not listed here. Core
    // covers it by rendering the tag -- Blade::render('<x-ichava::icon ... />')
    // in IconComponentAttributesTest -- rather than by asserting the alias key.
    expect(array_keys(app('blade.compiler')->getClassComponentAliases()))
        ->toContain(
            'ichava::ichava-test-icons',
            'ichava::ichava-ui-icons',
            'ichava::sri-asset',
        );
});

it('aliases the tag-safe hyphen form over the same paths', function () {
    // Taking the default creates a *second* hint as a side effect, not by an
    // explicit call: componentPrefix() now differs from viewNamespace(), so
    // package-tools aliases `ichava-icon-browser` over the paths loadViewsFrom()
    // resolved -- Blade's component-tag pattern admits no forward slash, so
    // `ichava/icon-browser` is unusable as a tag prefix. Pinned because nothing in
    // this package asks for it, and an upstream change could drop it silently.
    $hints = View::getFinder()->getHints();

    expect(array_keys($hints))->toContain('ichava-icon-browser');
    expect($hints['ichava-icon-browser'])->toBe($hints['ichava/icon-browser']);
});

it('ships exactly the views the resolution test enumerates', function () {
    // Guards the list above against going stale. A template added later without
    // a matching entry would be resolved by nothing, and the suite would stay
    // green -- a gate that cannot fail.
    $shipped = (new Symfony\Component\Finder\Finder)
        ->files()
        ->in(dirname(__DIR__, 2) . '/resources/views')
        ->name('*.blade.php');

    expect(iterator_count($shipped))->toBe(2);
});

it('leaves the class-component namespace alone', function () {
    // One of the flat maps keyed `ichava`, Decision B's: `<x-ichava::...>` tags
    // are the ecosystem's documented public API, so the namespace stays while
    // the view hints moved on. The anonymous-component path went with the Vue
    // layouts it served -- nothing anonymous remains to resolve.
    $blade = app('blade.compiler');

    expect(array_column($blade->getAnonymousComponentPaths(), 'prefix'))
        ->not->toContain('ichava');

    expect(array_keys($blade->getClassComponentNamespaces()))
        ->toContain('ichava');
});
