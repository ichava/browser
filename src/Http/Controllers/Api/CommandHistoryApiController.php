<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconPreferenceService;

/**
 * CommandHistoryApiController - RESTful API for Command Palette History
 */
final class CommandHistoryApiController extends BaseApiController
{
    public function __construct(
        IchavaLogger $logger,
        protected IconPreferenceService $preferenceService
    ) {
        parent::__construct($logger);
    }

    /**
     * Get recent command history
     */
    public function index(): JsonResponse
    {
        try {
            $this->logDebug('Fetching command history');

            $history = $this->preferenceService->getCommandHistory();

            foreach ($history as &$entry) {
                if (isset($entry['timestamp'])) {
                    $entry['formatted_time'] = $this->formatTimeAgo($entry['timestamp']);
                }
            }

            return $this->successResponse(
                $history,
                'Command history retrieved successfully',
                200,
                ['count' => count($history)]
            );
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to fetch command history');
        }
    }

    /**
     * Log command execution
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'command' => 'required|string|max:255',
                'type' => 'required|string|in:action,search,navigation',
                'metadata' => 'sometimes|array',
            ]);

            $this->preferenceService->addCommandHistory(
                $validated['command'],
                $validated['type'],
                $validated['metadata'] ?? []
            );

            $this->logDebug('Command history entry added', [
                'command' => $validated['command'],
                'type' => $validated['type'],
            ]);

            return $this->createdResponse(
                ['command' => $validated['command'], 'type' => $validated['type']],
                'Command logged successfully'
            );
        } catch (ValidationException $e) {
            return $this->handleValidationException($e);
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to log command');
        }
    }

    /**
     * Clear command history
     */
    public function clear(): JsonResponse
    {
        try {
            $this->preferenceService->clearCommandHistory();

            $this->logDebug('Command history cleared');

            return $this->deletedResponse('Command history cleared successfully');
        } catch (\Exception $e) {
            return $this->handleException($e, 'Failed to clear command history');
        }
    }
}
