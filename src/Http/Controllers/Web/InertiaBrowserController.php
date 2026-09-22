<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Web;

use Exception;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Routing\Controller;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconBrowserService;

final class InertiaBrowserController extends Controller
{
    public function __construct(
        protected IconBrowserService $browserService,
        protected IchavaLogger $logger,
    ) {}

    public function index(): Response
    {
        $this->logger->debug('Inertia browser page accessed', [
            'ip' => request()->ip(),
        ]);

        try {
            $statistics = $this->browserService->getStatistics();
        } catch (Exception $e) {
            $this->logger->error('Failed to load Inertia browser data', [
                'exception' => $e,
            ]);

            $statistics = null;
        }

        return Inertia::render('Browser/Index', [
            'statistics' => $statistics,
        ]);
    }
}
