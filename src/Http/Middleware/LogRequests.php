<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Symfony\Component\HttpFoundation\Response;

/**
 * Log Ichava Requests Middleware
 *
 * Logs API requests for debugging and monitoring.
 * Only active when debug mode is enabled.
 */
final class LogRequests
{
    public function __construct(private readonly IchavaLogger $logger) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only log if debug mode is enabled and logging is configured
        $shouldLog = config('app.debug') && config('ichava.logging.requests', false);

        if ($shouldLog) {
            $startTime = microtime(true);
        }

        $response = $next($request);

        if ($shouldLog) {
            $duration = round((microtime(true) - $startTime) * 1000, 2);

            $this->logger->debug('API request', [
                'method' => $request->method(),
                'uri' => $request->path(),
                'status' => $response->getStatusCode(),
                'duration_ms' => $duration,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'session_id' => $request->session()?->getId(),
            ]);
        }

        return $response;
    }
}
