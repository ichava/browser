<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web;

use Exception;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconRegistry;
use Simtabi\Laranail\Ichava\Exceptions\IchavaException;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;

final class PackageController extends BaseInertiaController
{
    public function __construct(
        protected IconBrowserService $browserService,
        protected IconRegistry $registry,
        IchavaLogger $logger,
    ) {
        parent::__construct($logger);
    }

    public function index(): Response
    {
        $this->logger->debug('Inertia packages page accessed');

        try {
            $packages = $this->browserService->getFilters()['packages'] ?? [];
        } catch (Exception $e) {
            $this->logger->error('Failed to load Inertia packages', $e);

            $packages = [];
        }

        return Inertia::render('Packages/Index', [
            'packages' => $packages,
        ]);
    }

    public function show(string $package): Response|RedirectResponse
    {
        $this->logger->debug('Inertia package detail accessed', [
            'package' => $package,
        ]);

        if (! preg_match('/^[a-z0-9\-]+\/[a-z0-9\-]+$/i', $package)) {
            return redirect()
                ->route('ichava.inertia.packages.index')
                ->with('error', 'Invalid package name format. Expected: vendor/package-name.');
        }

        try {
            $packageData = $this->registry->get($package);
        } catch (IchavaException $e) {
            $this->logger->warning('Package not found', ['package' => $package]);

            return redirect()
                ->route('ichava.inertia.packages.index')
                ->with('error', "Package [{$package}] not found.");
        }

        if (! $packageData) {
            return redirect()
                ->route('ichava.inertia.packages.index')
                ->with('error', "Package [{$package}] not found.");
        }

        $iconCount = Icon::where('package', $package)->count();

        $iconMorphAlias = (new Icon)->getMorphClass();

        $termIconCounts = DB::table('ichava_icon_termables')
            ->join('ichava_icons', function ($join) use ($package, $iconMorphAlias) {
                $join->on('ichava_icon_termables.termable_id', '=', 'ichava_icons.id')
                    ->where('ichava_icon_termables.termable_type', '=', $iconMorphAlias)
                    ->where('ichava_icons.package', '=', $package);
            })
            ->select('ichava_icon_termables.term_id')
            ->selectRaw('COUNT(DISTINCT ichava_icons.id) as icon_count')
            ->groupBy('ichava_icon_termables.term_id')
            ->pluck('icon_count', 'term_id');

        $categories = DB::table('ichava_icon_terms')
            ->where('type', 'category')
            ->where('package', $package)
            ->select('id', 'name', 'slug', 'parent_id')
            ->orderBy('name')
            ->get()
            ->map(function ($term) use ($termIconCounts) {
                return [
                    'id'         => $term->id,
                    'name'       => $term->name,
                    'slug'       => $term->slug,
                    'parent_id'  => $term->parent_id,
                    'icon_count' => $termIconCounts[$term->id] ?? 0,
                ];
            });

        $variants = DB::table('ichava_icon_terms')
            ->where('type', 'variant')
            ->where('package', $package)
            ->select('id', 'name', 'slug')
            ->orderBy('name')
            ->get()
            ->map(function ($term) use ($termIconCounts) {
                return [
                    'id'         => $term->id,
                    'name'       => $term->name,
                    'slug'       => $term->slug,
                    'icon_count' => $termIconCounts[$term->id] ?? 0,
                ];
            });

        return Inertia::render('Packages/Show', [
            'package' => [
                'name'        => $package,
                'label'       => $packageData['name'] ?? $package,
                'description' => $packageData['description'] ?? '',
                'vendor'      => $packageData['vendor'] ?? '',
                'icon_count'  => $iconCount,
                'categories'  => $categories,
                'variants'    => $variants,
                'labels'      => $packageData['labels'] ?? [],
            ],
        ]);
    }
}
