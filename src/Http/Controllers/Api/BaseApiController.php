<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Controllers\Api;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Simtabi\Laranail\Ichava\Browser\Http\Traits\ApiResponseTrait;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;

/**
 * BaseApiController - Base class for all Ichava API controllers
 *
 * Provides shared functionality including:
 * - Standardized API responses via ApiResponseTrait
 * - Logger injection
 * - Common helper methods
 * - Consistent error handling
 */
abstract class BaseApiController extends Controller
{
    use ApiResponseTrait;

    /**
     * Logger instance for all controllers
     */
    protected IchavaLogger $logger;

    /**
     * Constructor - Inject shared dependencies
     */
    public function __construct(IchavaLogger $logger)
    {
        $this->logger = $logger;
    }

    /**
     * Format timestamp as human-readable "time ago"
     *
     * Shared helper method used by multiple controllers
     */
    protected function formatTimeAgo(string $timestamp): string
    {
        try {
            $date = new \DateTime($timestamp);
            $now = new \DateTime;
            $diff = $now->diff($date);

            if ($diff->y > 0) {
                return $diff->y.'y ago';
            }
            if ($diff->m > 0) {
                return $diff->m.'mo ago';
            }
            if ($diff->d > 0) {
                return $diff->d.'d ago';
            }
            if ($diff->h > 0) {
                return $diff->h.'h ago';
            }
            if ($diff->i > 0) {
                return $diff->i.'m ago';
            }

            return 'Just now';
        } catch (\Exception $e) {
            return $timestamp;
        }
    }

    /**
     * Verify icon exists
     *
     * Common validation used across controllers
     */
    protected function iconExists(int $iconId): bool
    {
        return Icon::where('id', $iconId)->exists();
    }

    /**
     * Get icon or fail with standardized response
     */
    protected function findIconOrFail(int $iconId): Icon
    {
        return Icon::findOrFail($iconId);
    }

    /**
     * Log debug message with context
     */
    protected function logDebug(string $message, array $context = []): void
    {
        $this->logger->debug($message, $context);
    }

    /**
     * Log info message with context
     */
    protected function logInfo(string $message, array $context = []): void
    {
        $this->logger->info($message, $context);
    }

    /**
     * Log error with exception
     */
    protected function logError(string $message, \Throwable $exception, array $context = []): void
    {
        $this->logger->error($message, $exception, $context);
    }

    /**
     * Log warning message
     */
    protected function logWarning(string $message, array $context = []): void
    {
        $this->logger->warning($message, $context);
    }

    /**
     * Handle common validation exceptions
     *
     * Wraps validation errors in standardized response
     */
    protected function handleValidationException(ValidationException $e): JsonResponse
    {
        return $this->validationErrorResponse($e->errors(), 'Validation failed');
    }

    /**
     * Handle common not found exceptions
     */
    protected function handleNotFoundException(ModelNotFoundException $e, string $resource = 'Resource'): JsonResponse
    {
        $this->logWarning("$resource not found", ['exception' => $e->getMessage()]);

        return $this->notFoundResponse($resource);
    }

    /**
     * Handle generic exceptions
     */
    protected function handleException(\Exception $e, string $message = 'An error occurred'): JsonResponse
    {
        $this->logError($message, $e);

        return $this->errorResponse($message);
    }
}
