<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Validate Ichava Routes Middleware
 *
 * Ensures that only valid Ichava-prefixed routes are accessed.
 * Prevents unauthorized access to Ichava internals.
 */
final class ValidateIchavaRoute
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $prefix = config('ichava.prefix', 'ichava');
        $path = $request->path();

        // Ensure request is for an Ichava route
        if (! Str::startsWith($path, $prefix)) {
            abort(404, 'Not an Ichava route');
        }

        return $next($request);
    }
}
