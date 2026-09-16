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
        if (str_contains($command::class, 'Ichava\\Browser')) {
            $owned[$name] = $command;
        }
    }

    return $owned;
}

it('registers the command under the vendor and slug', function (): void {
    $found = browserCommands();

    expect($found)->toHaveKey('ichava::browser.inject-scripts');
    expect($found['ichava::browser.inject-scripts']->getName())
        ->toBe('ichava::browser.inject-scripts');
});

it('keeps the previous name working as an alias', function (): void {
    // `$commandAliases` is honoured by laranail/console's command base. This
    // command extends Laravel's, so the alias has to be wired explicitly --
    // and that is precisely the kind of thing that fails silently, hence the
    // check against the live registry rather than the property.
    $found = browserCommands();

    expect($found)->toHaveKey('ichava:inject-scripts');
    expect($found['ichava:inject-scripts']->getName())
        ->toBe('ichava::browser.inject-scripts');
});
