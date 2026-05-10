<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Support\HostCapabilities;
use Symfony\Component\HttpFoundation\Response;

/**
 * Three-tier guard: browser localStorage (always available) -> Laravel session
 * (when started) -> host authentication (when present). Each tier is best-
 * effort; the middleware never aborts when a tier is unavailable.
 */
final class IchavaStatefulGuard
{
    private HostCapabilities $capabilities;

    public function __construct(private readonly IchavaLogger $logger)
    {
        $this->capabilities = HostCapabilities::getInstance();
    }

    /**
     * Handle an incoming request
     *
     * Detects available features and adds context, but NEVER blocks requests.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Add storage tier information to request
        $request->attributes->set('ichava_tier', $this->capabilities->getTier());

        // Try to detect authentication (but don't require it)
        $this->addAuthContext($request);

        // Try to detect session (but don't require it)
        $this->addSessionContext($request);

        // Debug logging if enabled
        if (config('app.debug') && config('ichava.logging.auth_debug', false)) {
            $this->logger->debug('Request context', [
                'tier' => $request->attributes->get('ichava_tier'),
                'authenticated' => $request->attributes->get('ichava_authenticated', false),
                'session' => $request->attributes->get('ichava_session_available', false),
                'route' => $request->route()?->getName(),
                'browser_id' => $request->header('X-Browser-Id'),
            ]);
        }

        return $next($request);
    }

    /**
     * Try to add authentication context (optional)
     */
    private function addAuthContext(Request $request): void
    {
        // Default: not authenticated
        $request->attributes->set('ichava_authenticated', false);
        $request->attributes->set('ichava_user_id', null);
        $request->attributes->set('ichava_user', null);

        // Check if host has authentication
        if (! $this->capabilities->hasAuth()) {
            return;
        }

        try {
            // Try to get authenticated user
            $user = $request->user();

            if ($user) {
                // Success: User is authenticated
                $request->attributes->set('ichava_authenticated', true);
                $request->attributes->set('ichava_user_id', $user->id ?? $user->getAuthIdentifier());
                $request->attributes->set('ichava_user', $user);

                if (config('app.debug') && config('ichava.logging.auth_debug', false)) {
                    $this->logger->debug('Authenticated user detected', [
                        'user_id' => $user->id ?? null,
                        'email' => $user->email ?? null,
                    ]);
                }
            }
        } catch (\Exception $e) {
            // Auth check failed - that's okay, work without it
            $this->logger->debug('Auth check failed (working without auth)', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Try to add session context (optional)
     */
    private function addSessionContext(Request $request): void
    {
        // Default: session not available
        $request->attributes->set('ichava_session_available', false);
        $request->attributes->set('ichava_session_id', null);

        // Check if host has session
        if (! $this->capabilities->hasSession()) {
            return;
        }

        try {
            // Try to get session ID
            $sessionId = $request->session()?->getId();

            if ($sessionId) {
                // Success: Session is available
                $request->attributes->set('ichava_session_available', true);
                $request->attributes->set('ichava_session_id', $sessionId);
            }
        } catch (\Exception $e) {
            // Session check failed - that's okay, work without it
            $this->logger->debug('Session check failed (using browser storage)', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Check if the current request is from an authenticated user
     */
    public static function isAuthenticated(Request $request): bool
    {
        return $request->attributes->get('ichava_authenticated', false);
    }

    /**
     * Get the authenticated user ID if available
     */
    public static function getUserId(Request $request): ?int
    {
        return $request->attributes->get('ichava_user_id');
    }

    /**
     * Get the authenticated user object if available
     */
    public static function getUser(Request $request): ?object
    {
        return $request->attributes->get('ichava_user');
    }

    /**
     * Check if session storage is available
     */
    public static function hasSession(Request $request): bool
    {
        return $request->attributes->get('ichava_session_available', false);
    }

    /**
     * Get storage tier for current request
     *
     * @return string 'basic'|'enhanced'|'premium'
     */
    public static function getTier(Request $request): string
    {
        return $request->attributes->get('ichava_tier', 'basic');
    }
}
