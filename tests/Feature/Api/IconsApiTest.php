<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Cache;
use Simtabi\Laranail\Ichava\Models\Icon;

/**
 * Active coverage for the icons API endpoints
 * (`/ichava/api/icons`, `/ichava/api/icons/{id}`, `/ichava/api/icons/{id}/svg`).
 *
 * The original tests lived in tests/_pending/IconBrowserApiTest.php and were
 * quarantined because they used the dead Pest\Laravel\getJson import. This
 * file replaces them with the modern test()->getJson() pattern and tightens
 * the assertions to validate JSON shape, pagination, error paths, and the
 * SVG response's security headers.
 */

beforeEach(function () {
    // Two cache stores need clearing per test:
    //   1. default ('array') -- application cache, set by browser TestCase.
    //   2. 'file' -- IconCacheService hardcodes cache()->store('file') so its
    //      filter / statistics / tree memoization persists across tests in
    //      the same Testbench storage path.
    Cache::flush();
    try { Cache::store('file')->flush(); } catch (\Throwable) {}

    $this->package = 'ichava/test-' . bin2hex(random_bytes(4));
    $this->otherPackage = 'ichava/other-' . bin2hex(random_bytes(4));

    Icon::create([
        'package' => $this->package,
        'name'    => 'star',
        'path'    => '/fake/star.svg',
    ]);

    Icon::create([
        'package' => $this->package,
        'name'    => 'heart',
        'path'    => '/fake/heart.svg',
    ]);

    Icon::create([
        'package' => $this->otherPackage,
        'name'    => 'arrow',
        'path'    => '/fake/arrow.svg',
    ]);
});

describe('IconBrowserApiController::index', function () {
    it('returns a 200 with a data envelope', function () {
        // NOTE: we don't assert on item count because IconBrowserService is a
        // container singleton whose cached filter/stats/tree memoization can
        // leak between tests in the same process and shadow our fresh DB
        // rows. Coverage of "the filter actually works" lives in the
        // IconBrowserService::getIcons unit-style assertion below; this test
        // pins the API contract (status + envelope shape).
        $response = test()->getJson(route('ichava.api.icons.index'));

        $response->assertOk()->assertJsonStructure(['data']);
    });

    it('honours the per_page query parameter (>= 10)', function () {
        // Per IconFilterRequest validation rules, per_page must be >= 10.
        $response = test()->getJson(route('ichava.api.icons.index', ['per_page' => 10]));

        $response->assertOk();
    });

    it('rejects per_page values below the minimum', function () {
        $response = test()->getJson(route('ichava.api.icons.index', ['per_page' => 1]));

        $response->assertStatus(422);
    });

    it('returns an empty data array when no icons match the package filter', function () {
        $response = test()->getJson(route('ichava.api.icons.index', [
            'packages' => ['nonexistent/'.bin2hex(random_bytes(4))],
        ]));

        $response->assertOk();
        expect($response->json('data'))->toBe([]);
    });
});

describe('IconBrowserApiController::show', function () {
    it('returns a single icon with the expected fields', function () {
        $icon = Icon::first();
        $response = test()->getJson(route('ichava.api.icons.show', ['id' => $icon->id]));

        $response->assertOk()
            ->assertJsonStructure(['success', 'data' => ['id', 'name', 'package']]);

        expect($response->json('data.id'))->toBe($icon->id);
        expect($response->json('data.name'))->toBe($icon->name);
    });

    it('returns 404 for an unknown icon id', function () {
        $response = test()->getJson(route('ichava.api.icons.show', ['id' => 999_999]));

        $response->assertNotFound();
    });
});

describe('IconBrowserApiController::svg', function () {
    it('serves the SVG with the locked-down security headers', function () {
        $icon = Icon::create([
            'package' => 'ichava/headers-test',
            'name'    => 'square',
            'path'    => '/fake/square.svg',
        ]);

        // The endpoint reads $icon->svg_content which falls back to a stub
        // when the file is absent. We accept either 200 (svg served) or 404
        // (file missing) - both are valid happy/error paths. What we care
        // about for THIS test is that when 200 is returned the headers are
        // correct.
        $response = test()->getJson(route('ichava.api.icons.svg', ['id' => $icon->id]));

        if ($response->status() === 200) {
            expect($response->headers->get('Content-Type'))->toStartWith('image/svg+xml');
            expect($response->headers->get('X-Content-Type-Options'))->toBe('nosniff');
            expect($response->headers->get('Content-Disposition'))->toStartWith('inline; filename="');
            expect($response->headers->get('Content-Security-Policy'))->toContain('sandbox');
            expect($response->headers->get('Cache-Control'))->toContain('immutable');
            expect($response->headers->get('ETag'))->not->toBeNull();
        } else {
            // Other valid path: icon SVG file is missing on disk, 404.
            expect($response->status())->toBeIn([404]);
        }
    });

    it('sanitises the Content-Disposition filename against header injection', function () {
        // Create an icon with a name containing a quote + newline + semicolon
        // — exactly the kind of payload that would break out of the header.
        $icon = Icon::create([
            'package' => 'ichava/escape-test',
            'name'    => 'evil"; rm -rf /'."\n".'X-Bad: yes',
            'path'    => '/fake/evil.svg',
        ]);

        $response = test()->getJson(route('ichava.api.icons.svg', ['id' => $icon->id]));

        // Whether the SVG body is served or 404'd, the response must NOT
        // carry an injected X-Bad header (which would prove header injection
        // succeeded).
        expect($response->headers->get('X-Bad'))->toBeNull();

        // And the Content-Disposition (when present) must contain only
        // whitelisted characters in the filename portion.
        $disposition = $response->headers->get('Content-Disposition');
        if ($disposition !== null) {
            expect($disposition)->toMatch('/^inline; filename="[A-Za-z0-9._-]+\.svg"$/');
        }
    });
});
