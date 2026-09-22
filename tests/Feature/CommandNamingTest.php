<?php

declare(strict_types=1);

use Illuminate\Contracts\Console\Kernel;

/**
 * Command naming, asserted against the registry Artisan actually holds.
 *
 * Artisan's command table is a flat map keyed by name, so a bare slug is a key
 * any sibling package could also claim -- and the second claimant replaces the
 * first silently. This package's command carries its vendor and slug.
 */
function browserCommands(): array
{
    $owned = [];

    foreach (app(Kernel::class)->all() as $name => $command) {
        if (str_contains($command::class, 'Ichava\\IconBrowser')) {
            $owned[$name] = $command;
        }
    }

    return $owned;
}

it('registers the command under the vendor and slug', function (): void {
    $found = browserCommands();

    expect($found)->toHaveKey('ichava::icon-browser.inject-scripts');
    expect($found['ichava::icon-browser.inject-scripts']->getName())
        ->toBe('ichava::icon-browser.inject-scripts');
});

it('registers no bare name at all, not even as an alias', function (): void {
    // The global standard is explicit: "No convenience alias may reintroduce the
    // bare name ... and makes the convention decorative." `ichava:inject-scripts`
    // is still a generic key in Artisan's flat command map, so retaining it would
    // hand back the very collision the namespaced name prevents.
    foreach (browserCommands() as $key => $command) {
        expect($key)->toMatch(
            '/^ichava::[a-z0-9-]+\./',
            sprintf('%s answers to the bare name %s', $command::class, $key),
        );
    }
});
