<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Web;

use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
use Illuminate\Contracts\View\View;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Models\IconTerm;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;
use Simtabi\Laranail\Ichava\Services\IconCacheService;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\Services\IconRegistry;
use Simtabi\Laranail\Ichava\Exceptions\IchavaException;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;

/**
 * IconBrowserController - Web Controller for Icon Browser UI
 *
 * Handles only web-specific operations:
 * - Rendering views
 * - Web-triggered cache operations (with redirects)
 *
 * Design: Thin controller, delegates to services, with structured logging
 */
final class IconBrowserController extends Controller
{
    public function __construct(
        protected IconBrowserService $browserService,
        protected IconCacheService $cacheService,
        protected IconPreferenceService $preferenceService,
        protected IconRegistry $registry,
        protected IchavaLogger $logger
    ) {}

    /**
     * Display the icon browser interface
     * 
     * Passes initial data to Vue for server-side rendering optimization.
     * This follows the botble pattern where initial data is passed from controller.
     */
    public function index(): View
    {
        $this->logger->info('🎨 Icon browser page accessed', [
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        try {
            // Get preferences from session
            $preferences = $this->preferenceService->getAll();
            
            // Get filter options (packages, categories, variants)
            $filters = $this->browserService->getFilters();
            
            // Get statistics
            $statistics = $this->browserService->getStatistics();
            
            return view('ichava::browser.index', [
                'packages' => $filters['packages'] ?? [],
                'categories' => $filters['categories'] ?? [],
                'preferences' => $preferences,
                'statistics' => $statistics,
            ]);
        } catch (\Exception $e) {
            $this->logger->error('❌ Failed to load browser data', [
                'error' => $e->getMessage(),
            ]);
            
            // Return view with empty data on error
            return view('ichava::browser.index', [
                'packages' => [],
                'categories' => [],
                'preferences' => $this->preferenceService->getAll(),
                'statistics' => null,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Display statistics dashboard
     */
    public function stats(): View
    {
        $this->logger->info('📊 Statistics page accessed', [
            'ip' => request()->ip(),
        ]);

        try {
            // Get statistics
            $statistics = $this->browserService->getStatistics();
            
            // Get package details
            $packages = $this->registry->all();
            $packageStats = [];
            
            foreach ($packages as $packageKey => $packageData) {
                $iconCount = Icon::where('package', $packageKey)->count();
                $categoryCount = IconTerm::where('type', 'category')
                    ->where('package', $packageKey)
                    ->count();
                $variantCount = IconTerm::where('type', 'variant')
                    ->where('package', $packageKey)
                    ->count();
                
                $packageStats[] = [
                    'name' => $packageKey,
                    'label' => $packageData['browser_metadata']['name'] ?? $packageKey,
                    'description' => $packageData['browser_metadata']['description'] ?? '',
                    'vendor' => $packageData['browser_metadata']['vendor'] ?? '',
                    'icon_count' => $iconCount,
                    'category_count' => $categoryCount,
                    'variant_count' => $variantCount,
                ];
            }
            
            // Get top categories - use morph alias (registered as 'icon' in morphMap)
            $iconMorphAlias = (new Icon())->getMorphClass();
            $topCategories = \DB::table('ichava_icon_termables')
                ->join('ichava_icon_terms', 'ichava_icon_termables.term_id', '=', 'ichava_icon_terms.id')
                ->join('ichava_icons', function ($join) use ($iconMorphAlias) {
                    $join->on('ichava_icon_termables.termable_id', '=', 'ichava_icons.id')
                         ->where('ichava_icon_termables.termable_type', '=', $iconMorphAlias);
                })
                ->where('ichava_icon_terms.type', 'category')
                ->select('ichava_icon_terms.name', 'ichava_icon_terms.slug', 'ichava_icons.package')
                ->selectRaw('COUNT(*) as icon_count')
                ->groupBy('ichava_icon_terms.id', 'ichava_icon_terms.name', 'ichava_icon_terms.slug', 'ichava_icons.package')
                ->orderByDesc('icon_count')
                ->limit(10)
                ->get();
            
            // Get cache stats
            $cacheStats = $this->cacheService->getStats();
            $cacheHealthy = $this->cacheService->isHealthy();
            
            return view('ichava::stats.index', [
                'statistics' => $statistics,
                'packageStats' => $packageStats,
                'topCategories' => $topCategories,
                'cacheStats' => $cacheStats,
                'cacheHealthy' => $cacheHealthy,
            ]);
        } catch (\Exception $e) {
            $this->logger->error('❌ Failed to load statistics', [
                'error' => $e->getMessage(),
            ]);
            
            return view('ichava::stats.index', [
                'statistics' => [
                    'total_icons' => 0,
                    'total_packages' => 0,
                    'total_categories' => 0,
                    'total_variants' => 0,
                    'empty' => true,
                ],
                'packageStats' => [],
                'topCategories' => [],
                'cacheStats' => [],
                'cacheHealthy' => false,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Clear all cache (web route - returns redirect)
     */
    public function clearCache(): RedirectResponse
    {
        try {
            $this->logger->info('🧹 Cache clear initiated from web', [
                'ip' => request()->ip(),
            ]);

            $stats = $this->cacheService->clearAll();
            $this->browserService->clearCache();

            $this->logger->info('✅ Cache cleared successfully from web', $stats);

            return redirect()
                ->back()
                ->with('success', 'Ichava icon cache cleared successfully');
        } catch (IchavaException $e) {
            $this->logger->error('❌ Failed to clear cache from web', [
                'error' => $e->getMessage(),
            ]);

            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Rebuild cache (web route - returns redirect)
     */
    public function rebuildCache(): RedirectResponse
    {
        try {
            $this->logger->info('💾 Cache rebuild initiated from web', [
                'ip' => request()->ip(),
            ]);

            $stats = $this->cacheService->rebuild();
            $this->browserService->clearCache();
            $this->preferenceService->clear();

            $this->logger->info('✅ Cache rebuilt successfully from web', $stats);

            return redirect()
                ->back()
                ->with('success', 'Icon cache rebuilt successfully. Preferences have been reset.');
        } catch (IchavaException $e) {
            $this->logger->error('❌ Failed to rebuild cache from web', [
                'error' => $e->getMessage(),
            ]);

            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }
}
