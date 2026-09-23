<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Http\Controllers\Web;

use Exception;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

final class CommandHistoryController extends BaseInertiaController
{
    public function __construct(
        protected IconPreferenceService $preferenceService,
        IchavaLogger $logger,
    ) {
        parent::__construct($logger);
    }

    public function index(): Response
    {
        $this->logger->debug('Inertia command history page accessed');

        try {
            $history = $this->preferenceService->getCommandHistory();

            foreach ($history as &$entry) {
                if (isset($entry['timestamp'])) {
                    $entry['formatted_time'] = $this->formatTimeAgo($entry['timestamp']);
                }
            }

            $props = ['commands' => $history, 'count' => count($history)];
        } catch (Exception $e) {
            $this->logger->error('Failed to load Inertia command history', $e);

            $props = ['commands' => [], 'count' => 0];
        }

        return Inertia::render('CommandHistory/Index', $props);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'command'  => 'required|string|max:255',
            'type'     => 'required|string|in:action,search,navigation',
            'metadata' => 'sometimes|array',
        ]);

        $this->preferenceService->addCommandHistory(
            $validated['command'],
            $validated['type'],
            $validated['metadata'] ?? [],
        );

        return redirect()->back();
    }

    public function clear(): RedirectResponse
    {
        $this->preferenceService->clearCommandHistory();
        $this->logger->debug('Command history cleared from web');

        return redirect()->back()->with('success', 'Command history cleared successfully.');
    }
}
