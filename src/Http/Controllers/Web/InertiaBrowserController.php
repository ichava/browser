<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web;

use Exception;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Models\IconTerm;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconRegistry;
use Simtabi\Laranail\Ichava\Services\IconCacheService;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;
use Simtabi\Laranail\Ichava\Services\IconPackUpdateChecker;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Requests\IconFilterRequest;

final class InertiaBrowserController extends BaseInertiaController
{
    public function __construct(
        protected IconBrowserService $browserService,
        protected IconCacheService $cacheService,
        protected IconPreferenceService $preferenceService,
        protected IconRegistry $registry,
        protected IconPackUpdateChecker $updateChecker,
        IchavaLogger $logger,
    ) {
        parent::__construct($logger);
    }

    public function index(IconFilterRequest $request): Response
    {
        $this->logger->debug('Inertia browser page accessed', [
            'ip' => $request->ip(),
        ]);

        try {
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
                sortDirection: $request->getSortDirection(),
            );

            $icons = $paginator->getCollection()
                ->map(fn (Icon $icon) => $this->browserService->transformIcon($icon))
                ->values()
                ->toArray();

            $props = [
                'icons'      => $icons,
                'pagination' => [
                    'total'        => $paginator->total(),
                    'per_page'     => $paginator->perPage(),
                    'current_page' => $paginator->currentPage(),
                    'last_page'    => $paginator->lastPage(),
                    'from'         => $paginator->firstItem(),
                    'to'           => $paginator->lastItem(),
                ],
                'appliedFilters' => [
                    'search'         => $request->getSearch(),
                    'packages'       => $request->getPackages(),
                    'categories'     => $request->getCategories(),
                    'variants'       => $request->getVariants(),
                    'sort_by'        => $request->getSortBy(),
                    'sort_direction' => $request->getSortDirection(),
                    'page'           => $request->getPage(),
                    'per_page'       => $request->getPerPage(),
                ],
                'filterOptions'  => $this->browserService->getFilters(),
                'statistics'     => $this->browserService->getStatistics(),
                'tree'           => $this->browserService->buildIconTree(),
                'packages'       => $this->browserService->getFilters()['packages'] ?? [],
                'favorites'      => $this->preferenceService->getFavorites(),
                'collections'    => $this->preferenceService->getCollections(),
                'history'        => $this->preferenceService->getHistory(),
                'commandHistory' => $this->preferenceService->getCommandHistory(),
            ];
        } catch (Exception $e) {
            $this->logger->error('Failed to load Inertia browser data', [
                'exception' => $e,
            ]);

            $props = [
                'icons'      => [],
                'pagination' => [
                    'total'        => 0,
                    'per_page'     => $request->getPerPage(),
                    'current_page' => 1,
                    'last_page'    => 1,
                    'from'         => null,
                    'to'           => null,
                ],
                'appliedFilters' => [],
                'filterOptions'  => ['packages' => [], 'categories' => [], 'variants' => []],
                'statistics'     => null,
                'tree'           => [],
                'packages'       => [],
                'favorites'      => [],
                'collections'    => [],
                'history'        => [],
                'commandHistory' => [],
            ];
        }

        return Inertia::render('Browser/Index', $props);
    }

    public function show(int $id): Response|RedirectResponse
    {
        $this->logger->debug('Inertia icon detail accessed', [
            'icon_id' => $id,
        ]);

        $icon = Icon::with([
            'terms' => function ($q) {
                $q->select('ichava_icon_terms.id', 'type', 'slug', 'name', 'package', 'parent_id');
            },
            'categories',
            'variants',
        ])->find($id);

        if (! $icon) {
            return redirect()
                ->route('ichava.inertia.browser')
                ->with('error', 'Icon not found.');
        }

        $related = [];
        $categorySlug = $icon->primary_category?->slug;

        if ($categorySlug) {
            $related = Icon::where('id', '!=', $icon->id)
                ->whereHas('terms', function ($q) use ($categorySlug) {
                    $q->where('type', 'category')->where('slug', $categorySlug);
                })
                ->limit(12)
                ->get()
                ->map(fn (Icon $relatedIcon) => $this->browserService->transformIcon($relatedIcon))
                ->values()
                ->toArray();
        }

        return Inertia::render('Browser/Show', [
            'icon'    => $this->browserService->transformIcon($icon),
            'related' => $related,
        ]);
    }

    public function stats(): Response
    {
        $this->logger->debug('Inertia statistics page accessed', [
            'ip' => request()->ip(),
        ]);

        try {
            $statistics = $this->browserService->getStatistics();

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
                    'name'           => $packageKey,
                    'label'          => $packageData['name'] ?? $packageKey,
                    'description'    => $packageData['description'] ?? '',
                    'vendor'         => $packageData['vendor'] ?? '',
                    'icon_count'     => (int) ($iconCounts[$packageKey] ?? 0),
                    'category_count' => (int) ($terms->firstWhere('type', 'category')->count ?? 0),
                    'variant_count'  => (int) ($terms->firstWhere('type', 'variant')->count ?? 0),
                ];
            }

            $iconMorphAlias = (new Icon)->getMorphClass();
            $topCategories = DB::table('ichava_icon_termables')
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

            $props = [
                'statistics'    => $statistics,
                'packageStats'  => $packageStats,
                'topCategories' => $topCategories,
                'cacheStats'    => $this->cacheService->getStats(),
                'cacheHealthy'  => $this->cacheService->isHealthy(),
                'updateStatus'  => $this->updateChecker->checkAll(),
            ];
        } catch (Exception $e) {
            $this->logger->error('Failed to load Inertia statistics', [
                'exception' => $e,
            ]);

            $props = [
                'statistics' => [
                    'total_icons'      => 0,
                    'total_packages'   => 0,
                    'total_categories' => 0,
                    'total_variants'   => 0,
                    'empty'            => true,
                ],
                'packageStats'  => [],
                'topCategories' => [],
                'cacheStats'    => [],
                'cacheHealthy'  => false,
                'updateStatus'  => [],
            ];
        }

        return Inertia::render('Stats/Index', $props);
    }
}
