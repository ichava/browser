<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web;

use Exception;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web\Concerns\ResolvesIconsForPages;

final class FavoriteController extends BaseInertiaController
{
    use ResolvesIconsForPages;

    public function __construct(
        protected IconBrowserService $browserService,
        protected IconPreferenceService $preferenceService,
        IchavaLogger $logger,
    ) {
        parent::__construct($logger);
    }

    public function index(): Response
    {
        $this->logger->debug('Inertia favorites page accessed');

        try {
            $favoriteIds = $this->preferenceService->getFavorites();

            $props = [
                'ids'   => $favoriteIds,
                'icons' => $this->pageIcons($favoriteIds),
                'count' => count($favoriteIds),
            ];
        } catch (Exception $e) {
            $this->logger->error('Failed to load Inertia favorites', [
                'exception' => $e,
            ]);

            $props = ['ids' => [], 'icons' => [], 'count' => 0];
        }

        return Inertia::render('Favorites/Index', $props);
    }

    public function store(int $iconId): RedirectResponse
    {
        if (! Icon::where('id', $iconId)->exists()) {
            return redirect()->back()->with('error', "Icon [{$iconId}] not found.");
        }

        $this->preferenceService->addFavorite($iconId);
        $this->logger->debug('Icon added to favorites from web', ['icon_id' => $iconId]);

        return redirect()->back()->with('success', 'Icon added to favorites.');
    }

    public function destroy(int $iconId): RedirectResponse
    {
        $this->preferenceService->removeFavorite($iconId);
        $this->logger->debug('Icon removed from favorites from web', ['icon_id' => $iconId]);

        return redirect()->back()->with('success', 'Icon removed from favorites.');
    }

    public function toggle(int $iconId): RedirectResponse
    {
        if (! Icon::where('id', $iconId)->exists()) {
            return redirect()->back()->with('error', "Icon [{$iconId}] not found.");
        }

        $isFavorite = $this->preferenceService->toggleFavorite($iconId);

        $this->logger->debug('Favorite toggled from web', [
            'icon_id'     => $iconId,
            'is_favorite' => $isFavorite,
        ]);

        return redirect()->back()->with(
            'success',
            $isFavorite ? 'Icon added to favorites.' : 'Icon removed from favorites.',
        );
    }
}
