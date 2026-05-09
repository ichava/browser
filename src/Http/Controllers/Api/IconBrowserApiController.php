<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;
use Simtabi\Laranail\Ichava\Services\IconCacheService;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Browser\Http\Requests\IconFilterRequest;
use Simtabi\Laranail\Ichava\Browser\Http\Requests\PreferenceUpdateRequest;
use Simtabi\Laranail\Ichava\Browser\Http\Requests\PreferenceSearchRequest;
use Simtabi\Laranail\Ichava\Browser\Http\Requests\PreferenceFilterRequest;
use Simtabi\Laranail\Ichava\Browser\Http\Resources\IconResource;
use Simtabi\Laranail\Ichava\Browser\Http\Resources\IconCollection;
use Simtabi\Laranail\Ichava\Exceptions\IchavaException;

/**
 * IconBrowserApiController - RESTful API for Icon Browser
 *
 * Handles all JSON API endpoints for icon browsing, filtering, and preferences.
 * Uses standardized API response format via BaseApiController.
 */
final class IconBrowserApiController extends BaseApiController
{
    public function __construct(
        IchavaLogger $logger,
        protected IconBrowserService $browserService,
        protected IconCacheService $cacheService,
        protected IconPreferenceService $preferenceService
    ) {
        parent::__construct($logger);
    }

    /**
     * Get icons with filters and pagination
     */
    public function index(IconFilterRequest $request): JsonResponse
    {
        try {
            $this->logInfo('Icon API request', [
                'filters' => $request->validated(),
                'ip' => $request->ip(),
            ]);

            $paginator = $this->browserService->getIcons(
                filters: [
                    'search'     => $request->getSearch(),
                    'packages'   => $request->getPackages(),
                    'categories' => $request->getCategories(),
                    'variants'   => $request->getVariants(),
                ],
                page: $request->getPage(),
                perPage: $request->getPerPage(),
                sortBy: $request->getSortBy(),
                sortDirection: $request->getSortDirection()
            );

            $this->logDebug('Icon API response', [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
            ]);

            // Transform using IconCollection with grouping support
            $groupBy = $request->getSortBy();
            $collection = new IconCollection($paginator);
            
            if ($groupBy) {
                $collection->groupBy($groupBy);
            }

            return $collection->additional([
                'meta' => [
                    'total'        => $paginator->total(),
                    'per_page'     => $paginator->perPage(),
                    'current_page' => $paginator->currentPage(),
                    'last_page'    => $paginator->lastPage(),
                    'from'         => $paginator->firstItem(),
                    'to'           => $paginator->lastItem(),
                    'group_by'     => $groupBy,
                ],
            ])->response();
        } catch (IchavaException $e) {
            $this->logError('Icon API request failed', $e, [
                'filters' => $request->validated(),
            ]);

            return $this->handleException($e, 'Failed to retrieve icons');
        }
    }

    /**
     * Get filter options
     */
    public function filters(): JsonResponse
    {
        try {
            $this->logDebug('Fetching filter options');

            $filters = $this->browserService->getFilters();

            $this->logDebug('Filter options retrieved', [
                'packages_count' => count($filters['packages'] ?? []),
                'categories_count' => count($filters['categories'] ?? []),
                'variants_count' => count($filters['variants'] ?? []),
            ]);

            return response()->json($filters);
        } catch (IchavaException $e) {
            $this->logError('Failed to fetch filters', $e);

            return $this->handleException($e, 'Failed to fetch filters');
        }
    }

    /**
     * Get statistics
     */
    public function statistics(): JsonResponse
    {
        try {
            $this->logDebug('Fetching statistics');

            $stats = $this->browserService->getStatistics();

            $this->logDebug('Statistics retrieved', $stats);

            return $this->successResponse($stats, 'Statistics retrieved successfully');
        } catch (IchavaException $e) {
            $this->logError('Failed to fetch statistics', $e);

            return $this->handleException($e, 'Failed to fetch statistics');
        }
    }

    /**
     * Get hierarchical icon tree
     */
    public function tree(): JsonResponse
    {
        try {
            $this->logDebug('Building icon tree');

            $tree = $this->browserService->buildIconTree();

            $this->logDebug('Icon tree built', [
                'tree_size' => count($tree),
            ]);

            return $this->successResponse($tree, 'Icon tree retrieved successfully');
        } catch (IchavaException $e) {
            $this->logError('Failed to build icon tree', $e);

            return $this->handleException($e, 'Failed to build icon tree');
        }
    }

    /**
     * Get single icon details
     */
    public function show(int $id): JsonResponse
    {
        try {
            // Eager load relationships to prevent N+1 queries
            $icon = Icon::with([
                'terms' => function ($q) {
                    $q->select('ichava_icon_terms.id', 'type', 'slug', 'name', 'package', 'parent_id');
                },
                'categories',
                'variants'
            ])->findOrFail($id);

            $this->logDebug('Icon details retrieved', [
                'icon_id' => $id,
                'icon_name' => $icon->name,
                'package' => $icon->package,
            ]);

            return response()->json([
                'success' => true,
                'data' => new IconResource($icon),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            $this->logWarning('Icon not found', ['icon_id' => $id]);

            return $this->notFoundResponse('Icon', $id);
        } catch (\Exception $e) {
            $this->logError('Error retrieving icon', $e, ['icon_id' => $id]);

            return $this->handleException($e, 'An error occurred while retrieving the icon');
        }
    }

    /**
     * Serve SVG file with caching (returns JSON for API consistency)
     */
    public function svg(int $id): Response
    {
        try {
            $icon = Icon::select(['id', 'name', 'package', 'path', 'file_hash'])
                ->findOrFail($id);
            
            $this->logDebug('Serving SVG', [
                'icon_id' => $id,
                'icon_name' => $icon->name,
                'package' => $icon->package,
            ]);

            $svg = $icon->svg_content;

            if (!$svg) {
                throw IchavaException::iconNotFound($icon->name, $icon->package);
            }

            // Defense in depth: even though the content has been sanitised by
            // SvgProcessingService, browsers will execute scripts in an SVG
            // navigated to directly. Lock the response down with nosniff, a
            // restrictive CSP, and explicit non-attachment disposition.
            return response($svg)
                ->header('Content-Type', 'image/svg+xml; charset=utf-8')
                ->header('X-Content-Type-Options', 'nosniff')
                ->header('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
                ->header('Content-Disposition', "inline; filename=\"{$icon->name}.svg\"")
                ->header('Cache-Control', 'public, max-age=31536000, immutable')
                ->header('ETag', '"'.md5($svg).'"');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            $this->logWarning('Icon not found for SVG', ['icon_id' => $id]);

            return $this->notFoundResponse('Icon', $id);
        } catch (IchavaException $e) {
            $this->logWarning('SVG not accessible', ['icon_id' => $id, 'error' => $e->getMessage()]);

            return $this->notFoundResponse('SVG content');
        } catch (\Exception $e) {
            $this->logError('Error serving SVG', $e, ['icon_id' => $id]);

            return $this->errorResponse('Error retrieving SVG content');
        }
    }

    /**
     * Get all packages with icon counts
     */
    public function packages(): JsonResponse
    {
        try {
            $this->logDebug('Fetching packages list');

            $packages = $this->browserService->getFilters()['packages'] ?? [];

            return $this->successResponse(
                $packages,
                'Packages retrieved successfully',
                Response::HTTP_OK,
                ['total' => count($packages)]
            );
        } catch (IchavaException $e) {
            $this->logError('Failed to fetch packages', $e);

            return $this->handleException($e, 'Failed to fetch packages');
        }
    }

    /**
     * Get single package details with optimized queries
     */
    public function package(string $package): JsonResponse
    {
        try {
            $this->logDebug('Fetching package details', ['package' => $package]);

            // Validate package name format
            if (!preg_match('/^[a-z0-9\-]+\/[a-z0-9\-]+$/i', $package)) {
                return $this->validationErrorResponse(
                    ['package' => ['Invalid package name format. Expected: vendor/package-name']],
                    'Invalid package name format'
                );
            }

            // Get package info from registry (may throw IchavaException if not found)
            $registry = app(\Simtabi\Laranail\Ichava\Services\IconRegistry::class);
            
            try {
                $packageData = $registry->get($package);
            } catch (IchavaException $e) {
                // Package not registered
                $this->logWarning('Package not found', ['package' => $package]);
                return $this->notFoundResponse('Package', $package);
            }

            if (!$packageData) {
                return $this->notFoundResponse('Package', $package);
            }

            // OPTIMIZED: Get icon count and all term data in minimal queries
            $iconCount = Icon::where('package', $package)->count();

            // Get the morph alias for the join condition (registered as 'icon' in morphMap)
            $iconMorphAlias = (new Icon())->getMorphClass();
            
            // OPTIMIZED: Single query to get all term icon counts for this package
            $termIconCounts = \DB::table('ichava_icon_termables')
                ->join('ichava_icons', function ($join) use ($package, $iconMorphAlias) {
                    $join->on('ichava_icon_termables.termable_id', '=', 'ichava_icons.id')
                         ->where('ichava_icon_termables.termable_type', '=', $iconMorphAlias)
                         ->where('ichava_icons.package', '=', $package);
                })
                ->select('ichava_icon_termables.term_id')
                ->selectRaw('COUNT(DISTINCT ichava_icons.id) as icon_count')
                ->groupBy('ichava_icon_termables.term_id')
                ->pluck('icon_count', 'term_id');

            // Get categories for this package with counts
            $categories = \DB::table('ichava_icon_terms')
                ->where('type', 'category')
                ->where('package', $package)
                ->select('id', 'name', 'slug', 'parent_id')
                ->orderBy('name')
                ->get()
                ->map(function ($term) use ($termIconCounts) {
                    return [
                        'id' => $term->id,
                        'name' => $term->name,
                        'slug' => $term->slug,
                        'parent_id' => $term->parent_id,
                        'icon_count' => $termIconCounts[$term->id] ?? 0,
                    ];
                });

            // Get variants for this package with counts
            $variants = \DB::table('ichava_icon_terms')
                ->where('type', 'variant')
                ->where('package', $package)
                ->select('id', 'name', 'slug')
                ->orderBy('name')
                ->get()
                ->map(function ($term) use ($termIconCounts) {
                    return [
                        'id' => $term->id,
                        'name' => $term->name,
                        'slug' => $term->slug,
                        'icon_count' => $termIconCounts[$term->id] ?? 0,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'name' => $package,
                    'label' => $packageData['browser_metadata']['name'] ?? $package,
                    'description' => $packageData['browser_metadata']['description'] ?? '',
                    'vendor' => $packageData['browser_metadata']['vendor'] ?? '',
                    'icon_count' => $iconCount,
                    'categories' => $categories,
                    'variants' => $variants,
                    'metadata' => $packageData['browser_metadata'] ?? [],
                ],
            ]);
        } catch (\Exception $e) {
            $this->logError('Failed to fetch package details', $e, ['package' => $package]);

            return $this->handleException($e, 'An error occurred while retrieving package details');
        }
    }

    /**
     * Get all categories with icon counts
     * 
     * Returns ALL categories from the terms table, with icon counts from relationships.
     * Categories without icon relationships will have count = 0.
     */
    public function categories(): JsonResponse
    {
        try {
            $this->logDebug('Fetching categories');

            // Get morph alias for icon relationships
            $iconMorphAlias = (new Icon())->getMorphClass();

            // Get ALL categories from terms table with icon counts
            $iconCounts = \DB::table('ichava_icon_termables')
                ->join('ichava_icon_terms', 'ichava_icon_termables.term_id', '=', 'ichava_icon_terms.id')
                ->where('ichava_icon_terms.type', 'category')
                ->where('ichava_icon_termables.termable_type', $iconMorphAlias)
                ->selectRaw('ichava_icon_terms.id, COUNT(*) as count')
                ->groupBy('ichava_icon_terms.id')
                ->pluck('count', 'id');

            $categories = \DB::table('ichava_icon_terms')
                ->where('type', 'category')
                ->select('id', 'slug', 'name', 'package')
                ->orderBy('name')
                ->get()
                ->map(function ($category) use ($iconCounts) {
                    return [
                        'id' => $category->id,
                        'name' => $category->slug,
                        'label' => $category->name,
                        'package' => $category->package,
                        'count' => $iconCounts[$category->id] ?? 0,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $categories,
                'meta' => [
                    'total' => $categories->count(),
                ],
            ]);
        } catch (\Exception $e) {
            $this->logError('Failed to fetch categories', $e);

            return $this->handleException($e, 'Failed to fetch categories');
        }
    }

    /**
     * Get all variants with icon counts
     * 
     * Returns ALL variants from the terms table, with icon counts from relationships.
     * Variants without icon relationships will have count = 0.
     */
    public function variants(): JsonResponse
    {
        try {
            $this->logDebug('Fetching variants');

            // Get morph alias for icon relationships
            $iconMorphAlias = (new Icon())->getMorphClass();

            // Get ALL variants from terms table with icon counts
            $iconCounts = \DB::table('ichava_icon_termables')
                ->join('ichava_icon_terms', 'ichava_icon_termables.term_id', '=', 'ichava_icon_terms.id')
                ->where('ichava_icon_terms.type', 'variant')
                ->where('ichava_icon_termables.termable_type', $iconMorphAlias)
                ->selectRaw('ichava_icon_terms.id, COUNT(*) as count')
                ->groupBy('ichava_icon_terms.id')
                ->pluck('count', 'id');

            $variants = \DB::table('ichava_icon_terms')
                ->where('type', 'variant')
                ->select('id', 'slug', 'name', 'package')
                ->orderBy('name')
                ->get()
                ->map(function ($variant) use ($iconCounts) {
                    return [
                        'id' => $variant->id,
                        'name' => $variant->slug,
                        'label' => $variant->name,
                        'package' => $variant->package,
                        'count' => $iconCounts[$variant->id] ?? 0,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $variants,
                'meta' => [
                    'total' => $variants->count(),
                ],
            ]);
        } catch (\Exception $e) {
            $this->logError('Failed to fetch variants', $e);

            return $this->handleException($e, 'Failed to fetch variants');
        }
    }

    /**
     * Get hierarchical term structure with icon counts (OPTIMIZED)
     */
    public function termsHierarchy(): JsonResponse
    {
        try {
            $this->logDebug('Building terms hierarchy');

            // Get the morph type from the database or use 'icon' as default
            // The termable_type in the database is 'icon', not the full class name
            $iconMorphType = 'icon';

            // OPTIMIZED: Get all term icon counts in a single query
            $termIconCounts = \DB::table('ichava_icon_termables')
                ->join('ichava_icons', function ($join) use ($iconMorphType) {
                    $join->on('ichava_icon_termables.termable_id', '=', 'ichava_icons.id')
                         ->where('ichava_icon_termables.termable_type', '=', $iconMorphType);
                })
                ->select('ichava_icon_termables.term_id')
                ->selectRaw('COUNT(DISTINCT ichava_icons.id) as icon_count')
                ->groupBy('ichava_icon_termables.term_id')
                ->pluck('icon_count', 'term_id');

            // Get all categories with hierarchy
            $categories = \DB::table('ichava_icon_terms')
                ->where('type', 'category')
                ->select('id', 'name', 'slug', 'package', 'parent_id')
                ->orderBy('package')
                ->orderBy('name')
                ->get()
                ->map(function ($term) use ($termIconCounts) {
                    return [
                        'id' => $term->id,
                        'name' => $term->name,
                        'slug' => $term->slug,
                        'package' => $term->package,
                        'parent_id' => $term->parent_id,
                        'icon_count' => $termIconCounts[$term->id] ?? 0,
                        'type' => 'category',
                    ];
                });

            // Get all variants
            $variants = \DB::table('ichava_icon_terms')
                ->where('type', 'variant')
                ->select('id', 'name', 'slug', 'package')
                ->orderBy('package')
                ->orderBy('name')
                ->get()
                ->map(function ($term) use ($termIconCounts) {
                    return [
                        'id' => $term->id,
                        'name' => $term->name,
                        'slug' => $term->slug,
                        'package' => $term->package,
                        'icon_count' => $termIconCounts[$term->id] ?? 0,
                        'type' => 'variant',
                    ];
                });

            // Build hierarchy for categories
            $categoryTree = $this->buildTermTree($categories->toArray());

            return response()->json([
                'success' => true,
                'data' => [
                    'categories' => $categoryTree,
                    'variants' => $variants,
                ],
                'meta' => [
                    'total_categories' => $categories->count(),
                    'total_variants' => $variants->count(),
                ],
            ]);
        } catch (\Exception $e) {
            $this->logError('Failed to build terms hierarchy', $e);

            return $this->handleException($e, 'Failed to build terms hierarchy');
        }
    }

    /**
     * Get all preferences
     */
    public function preferences(): JsonResponse
    {
        try {
            $this->logDebug('Fetching preferences');

            $preferences = $this->preferenceService->getAll();
            $validated = $this->preferenceService->validate($preferences);

            if ($validated !== $preferences) {
                $this->preferenceService->update($validated);
                $this->logInfo('Preferences validated and cleaned');
            }

            return response()->json([
                'success' => true,
                'data'    => $validated,
            ]);
        } catch (IchavaException $e) {
            $this->logError('Failed to fetch preferences', $e);

            return $this->handleException($e, 'Failed to fetch preferences');
        }
    }

    /**
     * Update preferences
     */
    public function updatePreferences(PreferenceUpdateRequest $request): JsonResponse
    {
        try {
            $this->logInfo('Updating preferences', [
                'data' => $request->validated(),
            ]);

            $preferences = $this->preferenceService->update($request->validated());
            $cleaned = $this->preferenceService->validate($preferences);
            $this->preferenceService->update($cleaned);

            $this->logInfo('Preferences updated successfully');

            return $this->updatedResponse($cleaned, 'Preferences updated successfully');
        } catch (IchavaException $e) {
            $this->logError('Failed to update preferences', $e, [
                'data' => $request->validated(),
            ]);

            return $this->handleException($e, 'Failed to update preferences');
        }
    }

    /**
     * Update search query
     */
    public function updateSearch(PreferenceSearchRequest $request): JsonResponse
    {
        try {
            $search = $request->validated('search') ?? '';

            $this->logDebug('Updating search query', [
                'search' => $search,
            ]);

            $this->preferenceService->setSearch($search);

            return response()->json([
                'success' => true,
                'data'    => [
                    'search' => $this->preferenceService->getSearch(),
                ],
                'message' => 'Search query updated successfully',
            ]);
        } catch (\Exception $e) {
            $this->logError('Failed to update search', $e);

            return $this->handleException($e, 'An error occurred while updating search query');
        }
    }

    /**
     * Update filters
     */
    public function updateFilters(PreferenceFilterRequest $request): JsonResponse
    {
        try {
            $this->logInfo('Updating filters', [
                'filters' => $request->validated(),
            ]);

            $filters = $this->preferenceService->getFilters();
            $filters = array_merge($filters, $request->validated());
            $this->preferenceService->setFilters($filters);

            $this->logInfo('Filters updated successfully');

            return $this->updatedResponse(
                $this->preferenceService->getFilters(),
                'Filters updated successfully'
            );
        } catch (\Exception $e) {
            $this->logError('Failed to update filters', $e);

            return $this->handleException($e, 'An error occurred while updating filters');
        }
    }

    /**
     * Clear preferences
     */
    public function clearPreferences(): JsonResponse
    {
        try {
            $this->logInfo('Clearing preferences');

            $defaults = $this->preferenceService->clear();

            $this->logInfo('Preferences cleared successfully');

            return $this->successResponse($defaults, 'Preferences cleared successfully');
        } catch (IchavaException $e) {
            $this->logError('Failed to clear preferences', $e);

            return $this->handleException($e, 'Failed to clear preferences');
        }
    }

    /**
     * Clear all cache
     */
    public function clearCache(): JsonResponse
    {
        try {
            $this->logInfo('Clearing cache via API');

            $stats = $this->cacheService->clearAll();
            $this->browserService->clearCache();

            $this->logInfo('Cache cleared successfully', $stats);

            return response()->json([
                'success' => true,
                'message' => 'Ichava icon cache cleared successfully',
                'stats'   => $stats,
            ]);
        } catch (\Exception $e) {
            $this->logError('Failed to clear cache', $e);

            return $this->handleException($e, 'An error occurred while clearing cache');
        }
    }

    /**
     * Rebuild cache
     */
    public function rebuildCache(): JsonResponse
    {
        try {
            $this->logInfo('Rebuilding cache via API');

            $stats = $this->cacheService->rebuild();
            $this->browserService->clearCache();
            $this->preferenceService->clear();

            $this->logInfo('Cache rebuilt successfully', $stats);

            return $this->successResponse($stats, 'Icon cache rebuilt successfully. Preferences reset.');
        } catch (\Exception $e) {
            $this->logError('Failed to rebuild cache', $e);

            return $this->handleException($e, 'An error occurred while rebuilding cache');
        }
    }

    /**
     * Get cache statistics
     */
    public function cacheStats(): JsonResponse
    {
        try {
            $this->logDebug('Fetching cache stats');

            $stats = $this->cacheService->getStats();
            $healthy = $this->cacheService->isHealthy();

            return response()->json([
                'success' => true,
                'healthy' => $healthy,
                'stats'   => $stats,
            ]);
        } catch (IchavaException $e) {
            $this->logError('Failed to fetch cache stats', $e);

            return $this->handleException($e, 'Failed to fetch cache stats');
        }
    }

    /**
     * Return empty icon response
     */
    protected function emptyIconResponse(IconFilterRequest $request, string $error): array
    {
        return [
            'data'    => [],
            'grouped' => [],
            'meta'    => [
                'total'        => 0,
                'per_page'     => $request->getPerPage(),
                'current_page' => 1,
                'last_page'    => 1,
                'from'         => null,
                'to'           => null,
                'group_by'     => $request->getSortBy(),
            ],
            'error' => $error,
        ];
    }

    /**
     * Build hierarchical tree structure from flat array
     */
    protected function buildTermTree(array $terms, ?int $parentId = null): array
    {
        $tree = [];

        foreach ($terms as $term) {
            if ($term['parent_id'] === $parentId) {
                $children = $this->buildTermTree($terms, $term['id']);
                if (!empty($children)) {
                    $term['children'] = $children;
                }
                $tree[] = $term;
            }
        }

        return $tree;
    }
}

