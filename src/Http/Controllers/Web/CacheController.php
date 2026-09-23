<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web;

use Illuminate\Http\RedirectResponse;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconCacheService;
use Simtabi\Laranail\Ichava\Exceptions\IchavaException;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

final class CacheController extends BaseInertiaController
{
    public function __construct(
        protected IconBrowserService $browserService,
        protected IconCacheService $cacheService,
        protected IconPreferenceService $preferenceService,
        IchavaLogger $logger,
    ) {
        parent::__construct($logger);
    }

    public function clear(): RedirectResponse
    {
        try {
            $this->logger->info('Cache clear initiated from Inertia page');

            $stats = $this->cacheService->clearAll();
            $this->browserService->clearCache();

            $this->logger->info('Cache cleared successfully from Inertia page', $stats);

            return redirect()
                ->back()
                ->with('success', 'Ichava icon cache cleared successfully.');
        } catch (IchavaException $e) {
            $this->logger->error('Failed to clear cache from Inertia page', [
                'exception' => $e,
            ]);

            return redirect()
                ->back()
                ->with('error', 'Cache clear failed. See application logs for details.');
        }
    }

    public function rebuild(): RedirectResponse
    {
        try {
            $this->logger->info('Cache rebuild initiated from Inertia page');

            $stats = $this->cacheService->rebuild();
            $this->browserService->clearCache();
            $this->preferenceService->clear();

            $this->logger->info('Cache rebuilt successfully from Inertia page', $stats);

            return redirect()
                ->back()
                ->with('success', 'Icon cache rebuilt successfully. Preferences have been reset.');
        } catch (IchavaException $e) {
            $this->logger->error('Failed to rebuild cache from Inertia page', [
                'exception' => $e,
            ]);

            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }
}
