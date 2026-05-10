<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * JSON Response Middleware
 *
 * Ensures all Ichava API responses are JSON formatted with consistent structure.
 * Handles content negotiation and sets appropriate headers.
 */
final class ForceJsonResponse
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Force Accept header to JSON if not specified
        if (! $request->headers->has('Accept') || $request->headers->get('Accept') === '*/*') {
            $request->headers->set('Accept', 'application/json');
        }

        $response = $next($request);

        // Ensure response is JSON
        if (! $response->headers->has('Content-Type')) {
            $response->headers->set('Content-Type', 'application/json');
        }

        return $response;
    }
}
