<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconPackUpdateChecker;

/**
 * Surfaces the upstream-tracking checker over HTTP for host apps that
 * want to display pack health on a dashboard / admin panel.
 *
 * Wraps `IconPackUpdateChecker` (lives in `ichava/core`); response shape
 * mirrors the Artisan command `ichava:icons:check-updates --format=json`
 * so any consumer of one trivially consumes the other.
 *
 * Endpoint:
 *
 *   GET /{prefix}/api/icons/update-status              -- all packs
 *   GET /{prefix}/api/icons/update-status?package=...  -- single pack
 *
 * Cached per-pack for 12 hours by the underlying service; this endpoint
 * adds no caching of its own.
 */
final class UpdateStatusApiController extends BaseApiController
{
    public function __construct(
        IchavaLogger $logger,
        protected IconPackUpdateChecker $checker,
    ) {
        parent::__construct($logger);
    }

    public function index(Request $request): JsonResponse
    {
        $package = $request->query('package');
        $packageFilter = is_string($package) && $package !== '' ? $package : null;

        $rows = $this->checker->checkAll($packageFilter);

        $stale = array_values(array_filter(
            $rows,
            static fn (array $r): bool => $r['status'] === 'update-available'
        ));
        $unreachable = array_values(array_filter(
            $rows,
            static fn (array $r): bool => in_array($r['status'], ['unreachable', 'error'], true)
        ));

        return $this->successResponse([
            'rows' => $rows,
            'summary' => [
                'total' => count($rows),
                'up_to_date' => count(array_filter(
                    $rows,
                    static fn (array $r): bool => $r['status'] === 'up-to-date'
                )),
                'update_available' => count($stale),
                'unreachable' => count($unreachable),
            ],
        ]);
    }
}
