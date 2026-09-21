<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api\IconBrowserApiController;

/*
|--------------------------------------------------------------------------
| What a package's registry metadata may become in an HTTP response
|--------------------------------------------------------------------------
|
| Seven call sites here read `$packageData['browser_metadata'][...]`.
| `IconRegistry` has never written that key -- 16 reads across core and this
| package, zero writes -- so every one fell through its `??` default. The SPA
| received the package slug where a title belonged and an empty string where a
| description belonged, and nothing failed, because each fallback looked
| plausible.
|
| Fixing the reads has a second-order risk worth pinning: one of those sites
| passed the whole array through as `'metadata' => ... ?? []`. That returned an
| empty array for its entire life. Pointing it at the real metadata without
| filtering would have started publishing `base_path` and `provider_class` --
| absolute filesystem paths and internal class names -- from an endpoint
| anyone who can reach the browser can call. A dormant bug becoming a
| disclosure is a bad way to fix a bug.
|
*/

/** The shape IconRegistry actually produces, including the keys that must not escape. */
function registry_metadata_sample(): array
{
    return [
        'package_name' => 'ichava/tabler-icons',
        'name'         => 'Tabler Icons',
        'description'  => 'Over 5,200 pixel-perfect icons',
        'vendor'       => 'ichava',
        'version'      => '0.2.5',
        'license'      => 'MIT',
        'homepage'     => 'https://tabler-icons.io/',
        'repository'   => 'https://github.com/tabler/tabler-icons',
        'keywords'     => ['icons'],
        'total'        => 6184,
        'prefix'       => 'ti',
        'labels'       => ['variants' => ['outline' => 'Outline', 'filled' => 'Filled']],

        // Must never leave the server.
        'base_path'      => '/var/www/vendor/ichava/tabler-icons/resources/assets/svg',
        'provider_class' => 'Simtabi\\Laranail\\Ichava\\TablerIcons\\Providers\\IconsServiceProvider',
        'icon_set_name'  => 'ichava/tabler-icons',
    ];
}

function public_metadata(array $metadata): array
{
    $method = new ReflectionMethod(IconBrowserApiController::class, 'publicMetadata');

    return $method->invoke(
        (new ReflectionClass(IconBrowserApiController::class))->newInstanceWithoutConstructor(),
        $metadata,
    );
}

it('never publishes the filesystem path or the provider class', function () {
    $exposed = public_metadata(registry_metadata_sample());

    expect($exposed)->not->toHaveKey('base_path')
        ->and($exposed)->not->toHaveKey('provider_class');
});

it('is an allow-list, so a new registry key is withheld until chosen', function () {
    // A blocklist would leak whatever the registry grows next. Prove the
    // direction by adding a key that did not exist when this was written.
    $exposed = public_metadata(
        registry_metadata_sample() + ['some_future_internal_key' => 'secret'],
    );

    expect($exposed)->not->toHaveKey('some_future_internal_key');
});

it('still publishes what the SPA needs, including localised labels', function () {
    $exposed = public_metadata(registry_metadata_sample());

    expect($exposed['name'])->toBe('Tabler Icons')
        ->and($exposed['description'])->toBe('Over 5,200 pixel-perfect icons')
        ->and($exposed['labels'])->toBe(['variants' => ['outline' => 'Outline', 'filled' => 'Filled']]);
});

it('degrades to an empty label set on a core that does not supply one', function () {
    // `labels` arrives from ichava/core. Against an older core the key is
    // absent, and the response must simply omit it rather than error.
    $withoutLabels = registry_metadata_sample();
    unset($withoutLabels['labels']);

    expect(public_metadata($withoutLabels))->not->toHaveKey('labels');
});

it('reads no browser_metadata key anywhere in this package', function () {
    // The key the registry never wrote. Assert on the source here rather than
    // on behaviour: a re-introduced read would silently return a fallback,
    // which is exactly how this survived in the first place.
    $offenders = [];

    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(dirname(__DIR__, 2) . '/src'),
    );

    foreach ($files as $file) {
        if ($file->getExtension() !== 'php') {
            continue;
        }

        if (str_contains((string) file_get_contents($file->getPathname()), 'browser_metadata')) {
            $offenders[] = $file->getPathname();
        }
    }

    expect($offenders)->toBe([]);
});
