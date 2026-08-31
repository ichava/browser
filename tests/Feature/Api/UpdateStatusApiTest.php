<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Services\IconPackUpdateChecker;

/**
 * Feature tests for the GET /{prefix}/api/icons/update-status endpoint.
 *
 * The underlying IconPackUpdateChecker is unit-tested in core; here we
 * pin (a) the JSON envelope shape, (b) the summary tallies, and (c)
 * that the ?package= query forwards correctly.
 */
beforeEach(function () {
    // Swap the real checker with a tiny stub. The endpoint should never
    // hit the network during tests.
    $this->app->singleton(IconPackUpdateChecker::class, function () {
        return new class extends IconPackUpdateChecker
        {
            public function __construct() {}

            public function checkAll(?string $packageFilter = null): array
            {
                $base = [
                    [
                        'package' => 'ichava/twemoji-icons',
                        'source' => 'primary',
                        'status' => 'update-available',
                        'current' => '17.0.0',
                        'latest' => '17.1.0',
                        'release_url' => 'https://www.npmjs.com/package/@twemoji/svg/v/17.1.0',
                        'reason' => null,
                    ],
                    [
                        'package' => 'ichava/flag-icons',
                        'source' => 'primary',
                        'status' => 'up-to-date',
                        'current' => '7.5.0',
                        'latest' => '7.5.0',
                        'release_url' => 'https://www.npmjs.com/package/flag-icons/v/7.5.0',
                        'reason' => null,
                    ],
                    [
                        'package' => 'ichava/metronic-icons',
                        'source' => 'primary',
                        'status' => 'no-upstream',
                        'current' => null,
                        'latest' => null,
                        'release_url' => null,
                        'reason' => 'Pack does not declare an upstream block in config.json',
                    ],
                ];
                if ($packageFilter !== null) {
                    return array_values(array_filter(
                        $base,
                        static fn (array $r): bool => $r['package'] === $packageFilter
                    ));
                }

                return $base;
            }
        };
    });
});

it('returns rows + summary tallies for every registered pack', function () {
    $response = test()->getJson(route('ichava.api.icons.update-status'));

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                'rows' => [
                    '*' => ['package', 'source', 'status', 'current', 'latest', 'release_url', 'reason'],
                ],
                'summary' => ['total', 'up_to_date', 'update_available', 'unreachable'],
            ],
        ])
        ->assertJsonPath('data.summary.total', 3)
        ->assertJsonPath('data.summary.up_to_date', 1)
        ->assertJsonPath('data.summary.update_available', 1)
        ->assertJsonPath('data.summary.unreachable', 0);
});

it('forwards the ?package= filter into the checker', function () {
    $response = test()->getJson(route('ichava.api.icons.update-status', ['package' => 'ichava/flag-icons']));

    $response->assertOk()
        ->assertJsonPath('data.summary.total', 1)
        ->assertJsonPath('data.rows.0.package', 'ichava/flag-icons')
        ->assertJsonPath('data.rows.0.status', 'up-to-date');
});
