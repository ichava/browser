<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Web;

use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
use Simtabi\Laranail\Ichava\Exceptions\IchavaException;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Models\IconTerm;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;
use Simtabi\Laranail\Ichava\Services\IconCacheService;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\Services\IconRegistry;

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
        // PII (IP + user-agent) intentionally at debug level so production logs
        // don't carry per-request identifiers; promote to audit channel if you
        // need traceability.
        $this->logger->debug('Icon browser page accessed', [
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
            // Log full exception (with trace) but return a generic message to
            // the view so internal details aren't leaked to end users.
            $this->logger->error('Failed to load browser data', [
                'exception' => $e,
            ]);

            return view('ichava::browser.index', [
                'packages' => [],
                'categories' => [],
                'preferences' => $this->preferenceService->getAll(),
                'statistics' => null,
                'error' => 'Unable to load icon browser. Please try again later.',
            ]);
        }
    }

    /**
     * Display statistics dashboard
     */
    public function stats(): View
    {
        $this->logger->debug('Statistics page accessed', [
            'ip' => request()->ip(),
        ]);

        try {
            // Get statistics
            $statistics = $this->browserService->getStatistics();

            // Get package details. Batch the icon and term counts via two GROUP BY
            // queries instead of 3 queries per package (N+1 to N+2 total).
            $packages = $this->registry->all();

            $iconCounts = Icon::selectRaw('package, COUNT(*) as count')
                ->groupBy('package')
                ->pluck('count', 'package');

            $termCounts = IconTerm::selectRaw('package, type, COUNT(*) as count')
                ->whereIn('type', ['category', 'variant'])
                ->groupBy('package', 'type')
                ->get()
                ->groupBy('package');

            $packageStats = [];
            foreach ($packages as $packageKey => $packageData) {
                $terms = $termCounts->get($packageKey, collect());
                $packageStats[] = [
                    'name' => $packageKey,
                    'label' => $packageData['browser_metadata']['name'] ?? $packageKey,
                    'description' => $packageData['browser_metadata']['description'] ?? '',
                    'vendor' => $packageData['browser_metadata']['vendor'] ?? '',
                    'icon_count' => (int) ($iconCounts[$packageKey] ?? 0),
                    'category_count' => (int) ($terms->firstWhere('type', 'category')->count ?? 0),
                    'variant_count' => (int) ($terms->firstWhere('type', 'variant')->count ?? 0),
                ];
            }

            // Get top categories - use morph alias (registered as 'icon' in morphMap)
            $iconMorphAlias = (new Icon)->getMorphClass();
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
            $this->logger->error('Failed to load statistics', [
                'exception' => $e,
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
                'error' => 'Unable to load statistics. Please try again later.',
            ]);
        }
    }

    /**
     * Clear all cache (web route - returns redirect)
     */
    public function clearCache(): RedirectResponse
    {
        try {
            // Cache mutation is auditable; keep at info but drop the IP from
            // structured context (audit channel is the right place for that).
            $this->logger->info('Cache clear initiated from web');

            $stats = $this->cacheService->clearAll();
            $this->browserService->clearCache();

            $this->logger->info('✅ Cache cleared successfully from web', $stats);

            return redirect()
                ->back()
                ->with('success', 'Ichava icon cache cleared successfully');
        } catch (IchavaException $e) {
            $this->logger->error('Failed to clear cache from web', [
                'exception' => $e,
            ]);

            return redirect()
                ->back()
                ->with('error', 'Cache clear failed. See application logs for details.');
        }
    }

    /**
     * Rebuild cache (web route - returns redirect)
     */
    public function rebuildCache(): RedirectResponse
    {
        try {
            $this->logger->info('Cache rebuild initiated from web');

            $stats = $this->cacheService->rebuild();
            $this->browserService->clearCache();
            $this->preferenceService->clear();

            $this->logger->info('✅ Cache rebuilt successfully from web', $stats);

            return redirect()
                ->back()
                ->with('success', 'Icon cache rebuilt successfully. Preferences have been reset.');
        } catch (IchavaException $e) {
            $this->logger->error('Failed to rebuild cache from web', [
                'exception' => $e,
            ]);

            return redirect()
                ->back()
                ->with('error', $e->getMessage());
        }
    }
}
