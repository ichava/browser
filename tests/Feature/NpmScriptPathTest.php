<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\IconBrowser\Commands\InjectNpmScriptsCommand;

/**
 * The injected npm scripts, checked against the two manifests that decide them.
 *
 * `inject-scripts` writes these into the *host* application's package.json, so
 * nothing in this repository ever executes them. That is why they kept naming
 * `vendor/ichava/ichava` -- the pre-split monolith's install path -- for the
 * whole life of the split: every host that ran the command got three scripts
 * that cd into a directory Composer had never created, and nothing here noticed.
 *
 * So read both ends off disk. composer.json decides where Composer installs this
 * package; package.json decides which npm scripts exist to be run. A literal
 * that agrees with neither is exactly what shipped.
 *
 * These use PHPUnit assertions rather than `expect()` because each one carries a
 * diagnostic message. Pest's `toContain()` is variadic, so a message passed to it
 * is silently treated as another needle -- which is its own version of this bug.
 */
function browserPackageRoot(): string
{
    return dirname(__DIR__, 2);
}

function browserManifest(string $file): array
{
    return json_decode(
        (string) file_get_contents(browserPackageRoot() . '/' . $file),
        true,
        flags: JSON_THROW_ON_ERROR,
    );
}

function browserInjectedScripts(): array
{
    return array_filter(
        (array) (new ReflectionClass(InjectNpmScriptsCommand::class))->getConstant('SCRIPTS'),
        static fn (string $script): bool => $script !== '',
    );
}

it('injects at least one script', function (): void {
    // A guard that iterates an empty list passes by doing nothing.
    $this->assertNotEmpty(browserInjectedScripts());
});

it('cds into the directory Composer installs this package in', function (): void {
    $expected = 'vendor/' . browserManifest('composer.json')['name'];

    foreach (browserInjectedScripts() as $name => $script) {
        $this->assertStringStartsWith(
            "cd {$expected} && ",
            $script,
            "{$name} cds elsewhere; a rename moved the package and left this literal behind",
        );
    }
});

it('only invokes npm scripts this package actually ships', function (): void {
    $available = array_keys(browserManifest('package.json')['scripts'] ?? []);

    foreach (browserInjectedScripts() as $name => $script) {
        $this->assertSame(1, preg_match('/npm run ([\w:-]+)/', $script, $m), "{$name} runs no npm script");
        $this->assertContains(
            $m[1],
            $available,
            "{$name} runs 'npm run {$m[1]}', which this package.json does not define",
        );
    }
});
