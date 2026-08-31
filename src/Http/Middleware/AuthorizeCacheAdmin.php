<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate the destructive cache endpoints.
 *
 * `POST ichava/api/cache/clear` and `POST ichava/api/cache/rebuild` shipped with a rate
 * limit and nothing else. Anyone who could reach the API could flush the icon cache, and
 * `rebuildCache()` additionally calls `PreferenceService::clear()`, so a single
 * unauthenticated request also wiped every stored preference. On a 128,000-icon catalogue
 * a rebuild is expensive enough that repeating it is a denial-of-service in its own right,
 * which the 10/minute limit slows without preventing.
 *
 * This FAILS CLOSED. An install that has not granted the ability gets 403, including in
 * local development, because a gate that quietly allows in some environments teaches the
 * wrong thing about what is protected and is the state this package was already in.
 *
 * A host app opts in by defining the ability:
 *
 *     Gate::define('ichava.manage-cache', fn ($user) => $user->isAdmin());
 *
 * The ability name is configurable, and `security.cache_admin.allow_without_gate` exists
 * for trusted internal deployments that genuinely want the old behaviour — it has to be
 * set deliberately rather than being the default.
 *
 * BREAKING relative to 1.0.0: an install calling these endpoints without a gate now
 * receives 403 where it previously succeeded.
 */
final class AuthorizeCacheAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $config = config('ichava.browser.security.cache_admin', []);

        // The deliberate escape hatch. Off by default: the point of this middleware is
        // that reaching the endpoint is not the same as being allowed to use it.
        if (($config['allow_without_gate'] ?? false) === true) {
            return $next($request);
        }

        $ability = $config['ability'] ?? 'ichava.manage-cache';

        // `Gate::has()` first: without it an undefined ability resolves to a plain denial,
        // which is indistinguishable from a defined ability that said no. The two
        // situations need different messages, because one is a misconfiguration the
        // operator can fix and the other is a decision their own policy made.
        if (! Gate::has($ability)) {
            abort(403, sprintf(
                'Ichava cache administration is not configured. Define the "%s" ability, '
                .'or set ichava-browser.security.cache_admin.allow_without_gate to true.',
                $ability
            ));
        }

        if (Gate::denies($ability)) {
            abort(403, 'You are not authorised to administer the Ichava icon cache.');
        }

        return $next($request);
    }
}
