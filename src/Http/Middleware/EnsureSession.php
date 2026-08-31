<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Support\HostCapabilities;
use Symfony\Component\HttpFoundation\Response;

/**
 * Best-effort session bootstrap that degrades to browser storage when no
 * Laravel session driver is available. Never aborts the request on absence.
 */
final class EnsureSession
{
    private HostCapabilities $capabilities;

    public function __construct(private readonly IchavaLogger $logger)
    {
        $this->capabilities = HostCapabilities::getInstance();
    }

    /**
     * Handle an incoming request
     *
     * Try to start session if available, but don't fail if not.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if host has functional session
        if (! $this->capabilities->hasSession()) {
            // Session not available - that's okay, Ichava uses browser storage
            if (config('app.debug')) {
                $this->logger->debug('ℹ️ Session not available, using browser storage fallback');
            }

            return $next($request);
        }

        try {
            // Try to start session if not already started
            if (! $request->hasSession() || ! $request->session()->isStarted()) {
                $request->session()->start();
            }

            // Verify session is working
            if ($request->session()->isStarted()) {
                if (config('app.debug')) {
                    $this->logger->debug('✅ Session started', [
                        'session_id' => $request->session()->getId(),
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Session start failed - that's okay, continue without it
            $this->logger->debug('⚠️ Failed to start session (using browser storage fallback)', [
                'error' => $e->getMessage(),
            ]);
        }

        return $next($request);
    }
}
