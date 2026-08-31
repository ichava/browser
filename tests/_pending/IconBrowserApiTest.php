<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Models\IconTerm;

use function Pest\Laravel\get;
use function Pest\Laravel\getJson;

uses(RefreshDatabase::class);

describe('Icon Management API - List Icons', function () {

    beforeEach(function () {
        // Create test icons with relationships
        $this->package = 'ichava/test-icons';

        $category = IconTerm::create([
            'type' => 'category',
            'slug' => 'ui',
            'name' => 'UI Icons',
            'package' => $this->package,
        ]);

        $variant = IconTerm::create([
            'type' => 'variant',
            'slug' => 'outline',
            'name' => 'Outline',
            'package' => $this->package,
        ]);

        for ($i = 1; $i <= 25; $i++) {
            $icon = Icon::create([
                'package' => $this->package,
                'name' => "icon-{$i}",
                'path' => "/fake/path/icon-{$i}.svg",
                'file_hash' => md5("icon-{$i}"),
                'tags' => ['test', 'icon'],
                'keywords' => ['search', 'test'],
            ]);

            $icon->terms()->attach([$category->id, $variant->id]);
        }
    });

    it('returns paginated icons list', function () {
        $response = getJson(route('ichava.api.icons.index'));

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'package',
                        'name',
                        'category',
                        'variant',
                        'path',
                        'svg_url',
                        'viewbox',
                        'blade_clean',
                        'blade_generic',
                        'helper',
                    ],
                ],
                'meta' => [
                    'total',
                    'per_page',
                    'current_page',
                    'last_page',
                    'from',
                    'to',
                ],
            ]);

        expect($response->json('meta.total'))->toBe(25);
    });

    it('filters icons by package', function () {
        $response = getJson(route('ichava.api.icons.index', [
            'packages' => [$this->package],
        ]));

        $response->assertOk();

        $icons = $response->json('data');
        expect($icons)->not->toBeEmpty();

        foreach ($icons as $icon) {
            expect($icon['package'])->toBe($this->package);
        }
    });

    it('filters icons by category', function () {
        $response = getJson(route('ichava.api.icons.index', [
            'categories' => ['ui'],
        ]));

        $response->assertOk();

        $icons = $response->json('data');
        expect($icons)->not->toBeEmpty();

        foreach ($icons as $icon) {
            expect($icon['category'])->toBe('ui');
        }
    });

    it('filters icons by variant', function () {
        $response = getJson(route('ichava.api.icons.index', [
            'variants' => ['outline'],
        ]));

        $response->assertOk();

        $icons = $response->json('data');
        expect($icons)->not->toBeEmpty();

        foreach ($icons as $icon) {
            expect($icon['variant'])->toBe('outline');
        }
    });

    it('searches icons by name', function () {
        $response = getJson(route('ichava.api.icons.index', [
            'search' => 'icon-1',
        ]));

        $response->assertOk();

        $icons = $response->json('data');
        expect($icons)->not->toBeEmpty();

        foreach ($icons as $icon) {
            expect($icon['name'])->toContain('icon-1');
        }
    });

    it('supports pagination parameters', function () {
        $response = getJson(route('ichava.api.icons.index', [
            'page' => 2,
            'per_page' => 10,
        ]));

        $response->assertOk()
            ->assertJson([
                'meta' => [
                    'current_page' => 2,
                    'per_page' => 10,
                ],
            ]);

        $icons = $response->json('data');
        expect(count($icons))->toBeLessThanOrEqual(10);
    });

    it('supports sorting by name', function () {
        $response = getJson(route('ichava.api.icons.index', [
            'sort_by' => 'name',
            'sort_direction' => 'asc',
        ]));

        $response->assertOk();

        $icons = $response->json('data');
        $names = array_column($icons, 'name');

        $sortedNames = $names;
        sort($sortedNames);

        expect($names)->toBe($sortedNames);
    });

    it('validates per_page maximum', function () {
        $response = getJson(route('ichava.api.icons.index', [
            'per_page' => 150,
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['per_page']);
    });

    it('validates sort_by field', function () {
        $response = getJson(route('ichava.api.icons.index', [
            'sort_by' => 'invalid_field',
        ]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sort_by']);
    });

    it('handles empty database gracefully', function () {
        Icon::query()->delete();

        $response = getJson(route('ichava.api.icons.index'));

        $response->assertOk()
            ->assertJson([
                'data' => [],
                'meta' => [
                    'total' => 0,
                ],
            ]);
    });
});

describe('Icon Management API - Filters Endpoint', function () {

    beforeEach(function () {
        $this->package = 'ichava/test-icons';

        $category = IconTerm::create([
            'type' => 'category',
            'slug' => 'ui',
            'name' => 'UI Icons',
            'package' => $this->package,
        ]);

        $variant = IconTerm::create([
            'type' => 'variant',
            'slug' => 'solid',
            'name' => 'Solid',
            'package' => $this->package,
        ]);

        $icon = Icon::create([
            'package' => $this->package,
            'name' => 'test-icon',
            'path' => '/fake/path/test.svg',
        ]);

        $icon->terms()->attach([$category->id, $variant->id]);
    });

    it('returns available filter options', function () {
        $response = getJson(route('ichava.api.icons.filters'));

        $response->assertOk()
            ->assertJsonStructure([
                'packages' => [
                    '*' => [
                        'name',
                        'label',
                        'count',
                    ],
                ],
                'categories' => [
                    '*' => [
                        'name',
                        'label',
                        'count',
                    ],
                ],
                'variants' => [
                    '*' => [
                        'name',
                        'label',
                        'count',
                    ],
                ],
            ]);
    });

    it('includes icon counts in filters', function () {
        $response = getJson(route('ichava.api.icons.filters'));

        $response->assertOk();

        $categories = $response->json('categories');
        expect($categories)->not->toBeEmpty();

        foreach ($categories as $category) {
            expect($category)->toHaveKey('count');
            expect($category['count'])->toBeInt();
        }
    });
});

describe('Icon Management API - Statistics', function () {

    beforeEach(function () {
        Icon::create([
            'package' => 'ichava/test',
            'name' => 'icon-1',
            'path' => '/fake/path/icon-1.svg',
        ]);

        Icon::create([
            'package' => 'ichava/test-2',
            'name' => 'icon-2',
            'path' => '/fake/path/icon-2.svg',
        ]);
    });

    it('returns icon statistics', function () {
        $response = getJson(route('ichava.api.icons.statistics'));

        $response->assertOk()
            ->assertJsonStructure([
                'total_icons',
                'total_packages',
                'total_categories',
                'total_variants',
            ]);

        expect($response->json('total_icons'))->toBe(2);
        expect($response->json('total_packages'))->toBe(2);
    });

    it('handles empty database in statistics', function () {
        Icon::query()->delete();

        $response = getJson(route('ichava.api.icons.statistics'));

        $response->assertOk()
            ->assertJson([
                'total_icons' => 0,
                'total_packages' => 0,
                'total_categories' => 0,
                'total_variants' => 0,
            ]);
    });
});

describe('Icon Management API - Tree Structure', function () {

    it('returns hierarchical icon tree', function () {
        Icon::create([
            'package' => 'ichava/test',
            'name' => 'icon-1',
            'path' => '/fake/path/icon-1.svg',
        ]);

        $response = getJson(route('ichava.api.icons.tree'));

        $response->assertOk()
            ->assertJsonIsArray();

        // Tree can be empty if no filesystem structure exists
        expect($response->json())->toBeArray();
    });
});

describe('Icon Management API - Single Icon', function () {

    beforeEach(function () {
        $category = IconTerm::create([
            'type' => 'category',
            'slug' => 'ui',
            'name' => 'UI',
            'package' => 'ichava/test',
        ]);

        $this->icon = Icon::create([
            'package' => 'ichava/test',
            'name' => 'test-icon',
            'path' => '/fake/path/test.svg',
        ]);

        $this->icon->terms()->attach($category->id);
    });

    it('returns single icon details', function () {
        $response = getJson(route('ichava.api.icons.show', ['id' => $this->icon->id]));

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'data' => [
                    'id',
                    'package',
                    'name',
                    'category',
                    'path',
                    'svg_url',
                    'blade_clean',
                    'blade_generic',
                    'helper',
                ],
            ]);

        expect($response->json('data.id'))->toBe($this->icon->id);
        expect($response->json('data.name'))->toBe('test-icon');
    });

    it('returns 404 for non-existent icon', function () {
        $response = getJson(route('ichava.api.icons.show', ['id' => 99999]));

        $response->assertNotFound()
            ->assertJson([
                'success' => false,
                'error' => 'Icon not found',
            ]);
    });

    it('validates icon ID is numeric', function () {
        $response = get(route('ichava.api.icons.show', ['id' => 'abc']));

        $response->assertNotFound(); // Route constraint should fail
    });
});

describe('Icon Management API - SVG Content', function () {

    beforeEach(function () {
        // Create a temporary SVG file for testing
        $this->testPath = sys_get_temp_dir().'/test-icon.svg';
        file_put_contents($this->testPath, '<svg><circle r="10"/></svg>');

        $this->icon = Icon::create([
            'package' => 'ichava/test',
            'name' => 'test-icon',
            'path' => $this->testPath,
            'file_hash' => md5_file($this->testPath),
        ]);
    });

    afterEach(function () {
        if (file_exists($this->testPath)) {
            unlink($this->testPath);
        }
    });

    it('serves SVG content with correct headers', function () {
        $response = get(route('ichava.api.icons.svg', ['id' => $this->icon->id]));

        $response->assertOk()
            ->assertHeader('Content-Type', 'image/svg+xml')
            ->assertHeader('Cache-Control', 'public, max-age=31536000, immutable');

        expect($response->content())->toContain('<svg>');
    });

    it('returns 404 for non-existent icon SVG', function () {
        $response = get(route('ichava.api.icons.svg', ['id' => 99999]));

        $response->assertNotFound();
    });

    it('returns 404 when SVG file does not exist', function () {
        $icon = Icon::create([
            'package' => 'ichava/test',
            'name' => 'missing-icon',
            'path' => '/non/existent/path.svg',
        ]);

        $response = get(route('ichava.api.icons.svg', ['id' => $icon->id]));

        $response->assertNotFound();
    });
});
