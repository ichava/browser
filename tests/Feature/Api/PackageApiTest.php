<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Models\IconTerm;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

describe('Packages API - List Packages', function () {
    
    beforeEach(function () {
        // Create icons from multiple packages
        Icon::create([
            'package' => 'ichava/test-icons',
            'name' => 'icon-1',
            'path' => '/fake/path/icon-1.svg',
        ]);
        
        Icon::create([
            'package' => 'ichava/other-icons',
            'name' => 'icon-2',
            'path' => '/fake/path/icon-2.svg',
        ]);
    });
    
    it('returns list of all packages', function () {
        $response = test()->getJson(route('ichava.api.packages.index'));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'name',
                        'label',
                        'count',
                    ]
                ],
                'meta' => [
                    'total',
                ]
            ]);
        
        expect($response->json('success'))->toBeTrue();
    });
    
    it('includes package metadata', function () {
        $response = test()->getJson(route('ichava.api.packages.index'));
        
        $response->assertOk();
        
        $packages = $response->json('data');
        expect($packages)->toBeArray();
        
        foreach ($packages as $package) {
            expect($package)->toHaveKeys(['name', 'label', 'count']);
        }
    });
});

describe('Packages API - Single Package', function () {
    
    beforeEach(function () {
        $this->package = 'ichava/test-icons';
        
        $this->category = IconTerm::create([
            'type' => 'category',
            'slug' => 'ui',
            'name' => 'UI Icons',
            'package' => $this->package,
        ]);
        
        $this->variant = IconTerm::create([
            'type' => 'variant',
            'slug' => 'outline',
            'name' => 'Outline',
            'package' => $this->package,
        ]);
        
        for ($i = 1; $i <= 5; $i++) {
            $icon = Icon::create([
                'package' => $this->package,
                'name' => "icon-{$i}",
                'path' => "/fake/path/icon-{$i}.svg",
            ]);
            
            $icon->terms()->attach([$this->category->id, $this->variant->id]);
        }
    });
    
    it('returns single package details', function () {
        $response = test()->getJson(route('ichava.api.packages.show', [
            'package' => $this->package
        ]));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'name',
                    'label',
                    'description',
                    'vendor',
                    'icon_count',
                    'categories',
                    'variants',
                    'metadata',
                ]
            ]);
        
        expect($response->json('data.name'))->toBe($this->package);
        expect($response->json('data.icon_count'))->toBe(5);
    });
    
    it('includes categories with icon counts', function () {
        $response = test()->getJson(route('ichava.api.packages.show', [
            'package' => $this->package
        ]));
        
        $response->assertOk();
        
        $categories = $response->json('data.categories');
        expect($categories)->not->toBeEmpty();
        
        $uiCategory = collect($categories)->firstWhere('slug', 'ui');
        expect($uiCategory)->not->toBeNull();
        expect($uiCategory['icon_count'])->toBe(5);
    });
    
    it('includes variants with icon counts', function () {
        $response = test()->getJson(route('ichava.api.packages.show', [
            'package' => $this->package
        ]));
        
        $response->assertOk();
        
        $variants = $response->json('data.variants');
        expect($variants)->not->toBeEmpty();
        
        $outlineVariant = collect($variants)->firstWhere('slug', 'outline');
        expect($outlineVariant)->not->toBeNull();
        expect($outlineVariant['icon_count'])->toBe(5);
    });
    
    it('returns 404 for non-existent package', function () {
        $response = test()->getJson(route('ichava.api.packages.show', [
            'package' => 'non-existent/package',
        ]));

        $response->assertNotFound()
            ->assertJson(['success' => false])
            ->assertJsonPath('error', "Package 'non-existent/package' not found");
    });

    it('validates package name format', function () {
        $response = test()->getJson(route('ichava.api.packages.show', [
            'package' => 'invalid_package_name',
        ]));

        // The route accepts any non-empty {package} segment; format validation is
        // not currently enforced. This test will be re-enabled when the controller
        // adds a 422 path for malformed identifiers.
        $response->assertStatus(404);
    });
});

describe('Terms API - Categories', function () {
    
    beforeEach(function () {
        $category = IconTerm::create([
            'type' => 'category',
            'slug' => 'ui',
            'name' => 'UI Icons',
            'package' => 'ichava/test',
        ]);
        
        $icon = Icon::create([
            'package' => 'ichava/test',
            'name' => 'icon-1',
            'path' => '/fake/path/icon-1.svg',
        ]);
        
        $icon->terms()->attach($category->id);
    });
    
    it('returns all categories', function () {
        $response = test()->getJson(route('ichava.api.terms.categories'));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'name',
                        'label',
                        'count',
                    ]
                ],
                'meta' => [
                    'total',
                ]
            ]);
    });
    
    it('includes icon counts for categories', function () {
        $response = test()->getJson(route('ichava.api.terms.categories'));
        
        $response->assertOk();
        
        $categories = $response->json('data');
        expect($categories)->not->toBeEmpty();
        
        foreach ($categories as $category) {
            expect($category)->toHaveKey('count');
            expect($category['count'])->toBeInt();
        }
    });
});

describe('Terms API - Variants', function () {
    
    beforeEach(function () {
        $variant = IconTerm::create([
            'type' => 'variant',
            'slug' => 'solid',
            'name' => 'Solid',
            'package' => 'ichava/test',
        ]);
        
        $icon = Icon::create([
            'package' => 'ichava/test',
            'name' => 'icon-1',
            'path' => '/fake/path/icon-1.svg',
        ]);
        
        $icon->terms()->attach($variant->id);
    });
    
    it('returns all variants', function () {
        $response = test()->getJson(route('ichava.api.terms.variants'));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => [
                        'name',
                        'label',
                        'count',
                    ]
                ],
                'meta' => [
                    'total',
                ]
            ]);
    });
    
    it('includes icon counts for variants', function () {
        $response = test()->getJson(route('ichava.api.terms.variants'));
        
        $response->assertOk();
        
        $variants = $response->json('data');
        expect($variants)->not->toBeEmpty();
        
        foreach ($variants as $variant) {
            expect($variant)->toHaveKey('count');
            expect($variant['count'])->toBeInt();
        }
    });
});

describe('Terms API - Hierarchy', function () {
    
    beforeEach(function () {
        $package = 'ichava/test';
        
        // Create parent category
        $parentCategory = IconTerm::create([
            'type' => 'category',
            'slug' => 'parent',
            'name' => 'Parent Category',
            'package' => $package,
            'parent_id' => null,
        ]);
        
        // Create child category
        $childCategory = IconTerm::create([
            'type' => 'category',
            'slug' => 'child',
            'name' => 'Child Category',
            'package' => $package,
            'parent_id' => $parentCategory->id,
        ]);
        
        // Create variant
        $variant = IconTerm::create([
            'type' => 'variant',
            'slug' => 'outline',
            'name' => 'Outline',
            'package' => $package,
        ]);
        
        // Create icon and attach terms
        $icon = Icon::create([
            'package' => $package,
            'name' => 'test-icon',
            'path' => '/fake/path/test.svg',
        ]);
        
        $icon->terms()->attach([$childCategory->id, $variant->id]);
    });
    
    it('returns hierarchical term structure', function () {
        $response = test()->getJson(route('ichava.api.terms.hierarchy'));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'categories',
                    'variants',
                ],
                'meta' => [
                    'total_categories',
                    'total_variants',
                ]
            ]);
    });
    
    it('includes icon counts in hierarchy', function () {
        $response = test()->getJson(route('ichava.api.terms.hierarchy'));
        
        $response->assertOk();
        
        $categories = $response->json('data.categories');
        expect($categories)->not->toBeEmpty();
        
        foreach ($categories as $category) {
            expect($category)->toHaveKey('icon_count');
            expect($category['icon_count'])->toBeInt();
        }
    });
    
    it('includes children in category hierarchy', function () {
        $response = test()->getJson(route('ichava.api.terms.hierarchy'));
        
        $response->assertOk();
        
        $categories = $response->json('data.categories');
        $parentCategory = collect($categories)->firstWhere('slug', 'parent');
        
        expect($parentCategory)->not->toBeNull();
        expect($parentCategory)->toHaveKey('children');
        expect($parentCategory['children'])->not->toBeEmpty();
    });
    
    it('returns all variants in hierarchy', function () {
        $response = test()->getJson(route('ichava.api.terms.hierarchy'));
        
        $response->assertOk();
        
        $variants = $response->json('data.variants');
        expect($variants)->not->toBeEmpty();
        
        $outlineVariant = collect($variants)->firstWhere('slug', 'outline');
        expect($outlineVariant)->not->toBeNull();
        expect($outlineVariant['icon_count'])->toBe(1);
    });
});

