<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Models\Icon;

/**
 * CollectionsApiController - RESTful API for Icon Collections
 */
final class CollectionsApiController extends BaseApiController
{
    public function __construct(
        IchavaLogger $logger,
        protected IconPreferenceService $preferenceService
    ) {
        parent::__construct($logger);
    }

    /**
     * Get user's collections
     */
    public function index(): JsonResponse
    {
        try {
            $this->logDebug('Fetching collections');
            
            $collections = $this->preferenceService->getCollections();
            
            foreach ($collections as &$collection) {
                $collection['icons'] = Icon::whereIn('id', $collection['icon_ids'] ?? [])
                    ->select(['id', 'name', 'package', 'path'])
                    ->get()
                    ->map(fn($icon) => [
                        'id' => $icon->id,
                        'name' => $icon->name,
                        'package' => $icon->package,
                        'svg_url' => route('ichava.api.icons.svg', ['id' => $icon->id], false),
                    ])
                    ->toArray();
            }

            return $this->successResponse(
                $collections,
                'Collections retrieved successfully',
                200,
                ['count' => count($collections)]
            );
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to fetch collections');
        }
    }

    /**
     * Get single collection
     */
    public function show(string $id): JsonResponse
    {
        try {
            $collection = $this->preferenceService->getCollection($id);
            
            if (!$collection) {
                return $this->notFoundResponse('Collection', $id);
            }

            $collection['icons'] = Icon::whereIn('id', $collection['icon_ids'] ?? [])
                ->select(['id', 'name', 'package', 'path'])
                ->get()
                ->map(fn($icon) => [
                    'id' => $icon->id,
                    'name' => $icon->name,
                    'package' => $icon->package,
                    'svg_url' => route('ichava.api.icons.svg', ['id' => $icon->id], false),
                ])
                ->toArray();

            return $this->successResponse($collection, 'Collection retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to fetch collection');
        }
    }

    /**
     * Create new collection
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            ]);

            $collection = $this->preferenceService->createCollection(
                $validated['name'],
                $validated['color'] ?? null
            );
            
            $this->logDebug('Collection created', ['collection_id' => $collection['id']]);

            return $this->createdResponse($collection, 'Collection created successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->handleValidationException($e);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to create collection');
        }
    }

    /**
     * Update collection
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $collection = $this->preferenceService->getCollection($id);
            
            if (!$collection) {
                return $this->notFoundResponse('Collection', $id);
            }

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:100',
                'color' => 'nullable|string|regex:/^#[a-fA-F0-9]{6}$/',
            ]);

            $updated = $this->preferenceService->updateCollection($id, $validated);
            
            $this->logDebug('Collection updated', ['collection_id' => $id]);

            return $this->updatedResponse($updated, 'Collection updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->handleValidationException($e);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to update collection');
        }
    }

    /**
     * Delete collection
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $collection = $this->preferenceService->getCollection($id);
            
            if (!$collection) {
                return $this->notFoundResponse('Collection', $id);
            }

            $this->preferenceService->deleteCollection($id);
            
            $this->logDebug('Collection deleted', ['collection_id' => $id]);

            return $this->deletedResponse('Collection deleted successfully');
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to delete collection');
        }
    }

    /**
     * Add icon to collection
     */
    public function addIcon(string $id, int $iconId): JsonResponse
    {
        try {
            $collection = $this->preferenceService->getCollection($id);
            
            if (!$collection) {
                return $this->notFoundResponse('Collection', $id);
            }

            if (!$this->iconExists($iconId)) {
                return $this->notFoundResponse('Icon', $iconId);
            }

            $this->preferenceService->addIconToCollection($id, $iconId);
            
            $this->logDebug('Icon added to collection', [
                'collection_id' => $id,
                'icon_id' => $iconId,
            ]);

            return $this->successResponse(
                ['collection_id' => $id, 'icon_id' => $iconId],
                'Icon added to collection'
            );
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to add icon to collection');
        }
    }

    /**
     * Remove icon from collection
     */
    public function removeIcon(string $id, int $iconId): JsonResponse
    {
        try {
            $collection = $this->preferenceService->getCollection($id);
            
            if (!$collection) {
                return $this->notFoundResponse('Collection', $id);
            }

            $this->preferenceService->removeIconFromCollection($id, $iconId);
            
            $this->logDebug('Icon removed from collection', [
                'collection_id' => $id,
                'icon_id' => $iconId,
            ]);

            return $this->successResponse(
                ['collection_id' => $id, 'icon_id' => $iconId],
                'Icon removed from collection'
            );
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to remove icon from collection');
        }
    }
}
