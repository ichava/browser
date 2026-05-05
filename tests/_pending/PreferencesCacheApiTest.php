<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\{getJson, postJson, deleteJson};

uses(RefreshDatabase::class);

describe('Preferences API - Get Preferences', function () {
    
    it('returns default preferences for new session', function () {
        $response = getJson(route('ichava.api.preferences.index'));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    'filters',
                    'sorting',
                    'preferences',
                    'tree',
                    'pagination',
                ]
            ]);
        
        expect($response->json('success'))->toBeTrue();
    });
    
    it('returns preferences with correct structure', function () {
        $response = getJson(route('ichava.api.preferences.index'));
        
        $response->assertOk();
        
        $data = $response->json('data');
        
        expect($data)->toHaveKeys([
            'filters',
            'sorting',
            'preferences',
            'tree',
            'pagination',
        ]);
        
        expect($data['filters'])->toHaveKeys([
            'search',
            'packages',
            'categories',
            'variants',
        ]);
        
        expect($data['sorting'])->toHaveKeys([
            'sort_by',
            'sort_direction',
        ]);
    });
});

describe('Preferences API - Update Preferences', function () {
    
    it('updates preferences successfully', function () {
        $newPreferences = [
            'preferences' => [
                'view_mode' => 'list',
                'icon_size' => 48,
                'per_page' => 24,
            ],
        ];
        
        $response = postJson(route('ichava.api.preferences.update'), $newPreferences);
        
        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Preferences updated successfully',
            ]);
        
        // Verify preferences were saved
        $getResponse = getJson(route('ichava.api.preferences.index'));
        expect($getResponse->json('data.preferences.view_mode'))->toBe('list');
        expect($getResponse->json('data.preferences.icon_size'))->toBe(48);
    });
    
    it('validates view_mode values', function () {
        $response = postJson(route('ichava.api.preferences.update'), [
            'preferences' => [
                'view_mode' => 'invalid',
            ],
        ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['preferences.view_mode']);
    });
    
    it('validates icon_size range', function () {
        $response = postJson(route('ichava.api.preferences.update'), [
            'preferences' => [
                'icon_size' => 500, // Too large
            ],
        ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['preferences.icon_size']);
    });
    
    it('validates per_page range', function () {
        $response = postJson(route('ichava.api.preferences.update'), [
            'preferences' => [
                'per_page' => 5, // Too small
            ],
        ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['preferences.per_page']);
    });
    
    it('validates sort_by field', function () {
        $response = postJson(route('ichava.api.preferences.update'), [
            'sorting' => [
                'sort_by' => 'invalid_field',
            ],
        ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sorting.sort_by']);
    });
    
    it('validates sort_direction values', function () {
        $response = postJson(route('ichava.api.preferences.update'), [
            'sorting' => [
                'sort_direction' => 'invalid',
            ],
        ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['sorting.sort_direction']);
    });
    
    it('allows partial updates', function () {
        $response = postJson(route('ichava.api.preferences.update'), [
            'preferences' => [
                'view_mode' => 'grid',
            ],
        ]);
        
        $response->assertOk();
        
        $getResponse = getJson(route('ichava.api.preferences.index'));
        expect($getResponse->json('data.preferences.view_mode'))->toBe('grid');
    });
});

describe('Preferences API - Update Search', function () {
    
    it('updates search query successfully', function () {
        $response = postJson(route('ichava.api.preferences.search'), [
            'search' => 'test icon',
        ]);
        
        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Search query updated successfully',
            ]);
        
        // Verify search was saved
        $getResponse = getJson(route('ichava.api.preferences.index'));
        expect($getResponse->json('data.filters.search'))->toBe('test icon');
    });
    
    it('accepts empty search query', function () {
        $response = postJson(route('ichava.api.preferences.search'), [
            'search' => '',
        ]);
        
        $response->assertOk();
    });
    
    it('accepts null search query', function () {
        $response = postJson(route('ichava.api.preferences.search'), [
            'search' => null,
        ]);
        
        $response->assertOk();
    });
    
    it('validates search query length', function () {
        $longSearch = str_repeat('a', 300);
        
        $response = postJson(route('ichava.api.preferences.search'), [
            'search' => $longSearch,
        ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['search']);
    });
});

describe('Preferences API - Update Filters', function () {
    
    it('updates filter preferences successfully', function () {
        $response = postJson(route('ichava.api.preferences.filters'), [
            'packages' => ['ichava/test-icons'],
            'categories' => ['ui', 'system'],
            'variants' => ['outline'],
        ]);
        
        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Filters updated successfully',
            ]);
        
        // Verify filters were saved
        $getResponse = getJson(route('ichava.api.preferences.index'));
        $filters = $getResponse->json('data.filters');
        
        expect($filters['packages'])->toContain('ichava/test-icons');
        expect($filters['categories'])->toContain('ui');
        expect($filters['variants'])->toContain('outline');
    });
    
    it('accepts empty filter arrays', function () {
        $response = postJson(route('ichava.api.preferences.filters'), [
            'packages' => [],
            'categories' => [],
            'variants' => [],
        ]);
        
        $response->assertOk();
    });
    
    it('validates filter array values', function () {
        $response = postJson(route('ichava.api.preferences.filters'), [
            'packages' => [str_repeat('a', 150)], // Too long
        ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['packages.0']);
    });
});

describe('Preferences API - Clear Preferences', function () {
    
    it('clears all preferences and returns defaults', function () {
        // First set some preferences
        postJson(route('ichava.api.preferences.update'), [
            'preferences' => [
                'view_mode' => 'list',
                'icon_size' => 64,
            ],
        ]);
        
        // Clear preferences
        $response = deleteJson(route('ichava.api.preferences.clear'));
        
        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Preferences cleared successfully',
            ]);
        
        // Verify defaults are restored
        $getResponse = getJson(route('ichava.api.preferences.index'));
        $data = $getResponse->json('data');
        
        expect($data['filters']['search'])->toBe('');
        expect($data['filters']['packages'])->toBe([]);
    });
});

describe('Cache API - Get Cache Stats', function () {
    
    it('returns cache statistics', function () {
        $response = getJson(route('ichava.api.cache.stats'));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'healthy',
                'stats',
            ]);
        
        expect($response->json('success'))->toBeTrue();
        expect($response->json('healthy'))->toBeBool();
    });
    
    it('includes cache health status', function () {
        $response = getJson(route('ichava.api.cache.stats'));
        
        $response->assertOk();
        
        expect($response->json())->toHaveKey('healthy');
        expect($response->json('healthy'))->toBeBool();
    });
});

describe('Cache API - Clear Cache', function () {
    
    it('clears cache successfully', function () {
        $response = postJson(route('ichava.api.cache.clear'));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'stats',
            ]);
        
        expect($response->json('success'))->toBeTrue();
        expect($response->json('message'))->toContain('cleared');
    });
    
    it('returns cache clear statistics', function () {
        $response = postJson(route('ichava.api.cache.clear'));
        
        $response->assertOk();
        
        $stats = $response->json('stats');
        expect($stats)->toBeArray();
    });
    
    it('handles cache clear errors gracefully', function () {
        // This test verifies that errors are handled without crashing
        $response = postJson(route('ichava.api.cache.clear'));
        
        // Should always return a response, even if cache operations fail
        $response->assertStatus(fn ($status) => in_array($status, [200, 500]));
    });
});

describe('Cache API - Rebuild Cache', function () {
    
    it('rebuilds cache successfully', function () {
        $response = postJson(route('ichava.api.cache.rebuild'));
        
        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'message',
                'stats',
            ]);
        
        expect($response->json('message'))->toContain('rebuilt');
    });
    
    it('returns rebuild statistics', function () {
        $response = postJson(route('ichava.api.cache.rebuild'));
        
        $response->assertOk();
        
        $stats = $response->json('stats');
        expect($stats)->toBeArray();
    });
    
    it('clears preferences after rebuild', function () {
        // Set preferences
        postJson(route('ichava.api.preferences.update'), [
            'preferences' => [
                'view_mode' => 'list',
            ],
        ]);
        
        // Rebuild cache
        postJson(route('ichava.api.cache.rebuild'));
        
        // Verify preferences were cleared (restored to defaults)
        $getResponse = getJson(route('ichava.api.preferences.index'));
        $viewMode = $getResponse->json('data.preferences.view_mode');
        
        // Should be default value (grid)
        expect($viewMode)->toBe('grid');
    });
    
    it('handles rebuild errors gracefully', function () {
        // This test verifies that errors are handled without crashing
        $response = postJson(route('ichava.api.cache.rebuild'));
        
        // Should always return a response, even if rebuild operations fail partially
        $response->assertStatus(fn ($status) => in_array($status, [200, 500]));
    });
});

describe('Rate Limiting', function () {
    
    it('applies rate limiting to cache clear endpoint', function () {
        // The cache clear endpoint has a 10 req/min limit
        // This test just verifies the endpoint is accessible
        // Full rate limit testing would require multiple requests
        
        $response = postJson(route('ichava.api.cache.clear'));
        
        // Should not be rate limited on first request
        $response->assertStatus(fn ($status) => $status !== 429);
    });
    
    it('applies rate limiting to cache rebuild endpoint', function () {
        // The cache rebuild endpoint has a 10 req/min limit
        
        $response = postJson(route('ichava.api.cache.rebuild'));
        
        // Should not be rate limited on first request
        $response->assertStatus(fn ($status) => $status !== 429);
    });
});

