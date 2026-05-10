<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

/**
 * HistoryApiController - RESTful API for Icon Activity History
 */
final class HistoryApiController extends BaseApiController
{
    public function __construct(
        IchavaLogger $logger,
        protected IconPreferenceService $preferenceService
    ) {
        parent::__construct($logger);
    }

    /**
     * Get user's icon activity history
     */
    public function index(): JsonResponse
    {
        try {
            $this->logDebug('Fetching history');

            $history = $this->preferenceService->getHistory();

            foreach ($history as &$entry) {
                if (isset($entry['timestamp'])) {
                    $entry['formatted_time'] = $this->formatTimeAgo($entry['timestamp']);
                }
            }

            return $this->successResponse(
                $history,
                'History retrieved successfully',
                200,
                ['count' => count($history)]
            );
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to fetch history');
        }
    }

    /**
     * Log icon action (view, copy, download)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'icon_id' => 'required|integer',
                'action' => 'required|string|in:view,copy,download',
            ]);

            if (! $this->iconExists($validated['icon_id'])) {
                return $this->notFoundResponse('Icon', $validated['icon_id']);
            }

            $this->preferenceService->addHistoryEntry(
                (int) $validated['icon_id'],
                $validated['action']
            );

            $this->logDebug('History entry added', [
                'icon_id' => $validated['icon_id'],
                'action' => $validated['action'],
            ]);

            return $this->createdResponse(
                ['icon_id' => $validated['icon_id'], 'action' => $validated['action']],
                'History entry logged'
            );
        } catch (ValidationException $e) {
            return $this->handleValidationException($e);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to log history entry');
        }
    }

    /**
     * Clear history
     */
    public function clear(): JsonResponse
    {
        try {
            $this->preferenceService->clearHistory();

            $this->logDebug('History cleared');

            return $this->deletedResponse('History cleared successfully');
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to clear history');
        }
    }
}
