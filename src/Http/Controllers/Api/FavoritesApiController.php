<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Models\Icon;

/**
 * FavoritesApiController - RESTful API for User Favorites
 *
 * Handles favorites management using session-based storage.
 */
final class FavoritesApiController extends BaseApiController
{
    public function __construct(
        IchavaLogger $logger,
        protected IconPreferenceService $preferenceService
    ) {
        parent::__construct($logger);
    }

    /**
     * Get user's favorite icon IDs
     */
    public function index(): JsonResponse
    {
        try {
            $this->logDebug('Fetching favorites');
            
            $favoriteIds = $this->preferenceService->getFavorites();
            
            $icons = Icon::whereIn('id', $favoriteIds)
                ->select(['id', 'name', 'package', 'path'])
                ->get()
                ->map(fn($icon) => [
                    'id' => $icon->id,
                    'name' => $icon->name,
                    'package' => $icon->package,
                    'svg_url' => route('ichava.api.icons.svg', ['id' => $icon->id], false),
                ]);

            return $this->successResponse([
                'ids' => $favoriteIds,
                'icons' => $icons,
                'count' => count($favoriteIds),
            ], 'Favorites retrieved successfully');
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to fetch favorites');
        }
    }

    /**
     * Add icon to favorites
     */
    public function store(int $iconId): JsonResponse
    {
        try {
            if (!$this->iconExists($iconId)) {
                return $this->notFoundResponse('Icon', $iconId);
            }

            $this->preferenceService->addFavorite($iconId);
            $this->logDebug('Icon added to favorites', ['icon_id' => $iconId]);

            return $this->createdResponse([
                'icon_id' => $iconId,
                'is_favorite' => true,
            ], 'Icon added to favorites');
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to add favorite');
        }
    }

    /**
     * Remove icon from favorites
     */
    public function destroy(int $iconId): JsonResponse
    {
        try {
            $this->preferenceService->removeFavorite($iconId);
            $this->logDebug('Icon removed from favorites', ['icon_id' => $iconId]);

            return $this->deletedResponse('Icon removed from favorites');
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to remove favorite');
        }
    }

    /**
     * Toggle icon favorite status
     */
    public function toggle(int $iconId): JsonResponse
    {
        try {
            if (!$this->iconExists($iconId)) {
                return $this->notFoundResponse('Icon', $iconId);
            }

            $isFavorite = $this->preferenceService->toggleFavorite($iconId);
            
            $this->logDebug('Favorite toggled', [
                'icon_id' => $iconId,
                'is_favorite' => $isFavorite,
            ]);

            return $this->successResponse([
                'icon_id' => $iconId,
                'is_favorite' => $isFavorite,
            ], $isFavorite ? 'Icon added to favorites' : 'Icon removed from favorites');
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to toggle favorite');
        }
    }
}
