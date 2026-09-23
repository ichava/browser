<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Providers;

use Illuminate\Support\Facades\Blade;
use Simtabi\Laranail\Package\Tools\Package;
use Illuminate\Session\Middleware\StartSession;
use Simtabi\Laranail\Ichava\Services\IchavaLogger;
use Simtabi\Laranail\Ichava\Services\IconRegistry;
use Simtabi\Laranail\Ichava\Support\HostCapabilities;
use Simtabi\Laranail\Ichava\IconBrowser\View\Components\SriAsset;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware\LogRequests;
use Simtabi\Laranail\Package\Tools\Providers\PackageServiceProvider;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware\EnsureSession;
use Simtabi\Laranail\Ichava\IconBrowser\Commands\InjectNpmScriptsCommand;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware\ForceJsonResponse;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware\IchavaApiSecurity;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware\AuthorizeCacheAdmin;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware\IchavaStatefulGuard;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware\ValidateIchavaRoute;
use Simtabi\Laranail\Ichava\IconBrowser\Http\Middleware\HandleInertiaRequests;
use Simtabi\Laranail\Ichava\IconBrowser\View\Components\IchavaUiIconComponent;
use Simtabi\Laranail\Ichava\IconBrowser\View\Components\IchavaTestIconComponent;

/**
 * Visual icon browser for the Ichava ecosystem.
 *
 * Adds the Vue/Vite SPA + Blade views for browsing, searching, and
 * copying icons from installed icon packs. Optional package, install
 * only when you want the visual UI; the rest of the ecosystem (core,
 * icon packs) functions headlessly without it.
 *
 * Boot order: this provider's `bootingPackage()` runs after core's
 * `IchavaServiceProvider` has registered all singletons (composer
 * dependency order guarantees `ichava/core` boots first), so by the
 * time we register icon directories or read from `IconRegistry`, the
 * services are bound.
 *
 * @api
 */
class IconBrowserServiceProvider extends PackageServiceProvider
{
    /**
     * Declare the browser package metadata, assets, and commands.
     */
    public function configurePackage(Package $packager): void
    {
        $packager
            ->setPathFrom(source: $this, levelsUp: 2)
            ->setName('ichava/icon-browser')
            ->hasConfigFile('icon-browser')
            // No argument: package-tools resolves the vendor-scoped default,
            // `ichava/icon-browser`. A bare slug like `ichava` is a flat-map key any
            // sibling package or the host application could also claim, and the
            // loser is replaced silently.
            ->hasViews()
            ->hasTranslations()
            ->hasRoutes(['web'])
            ->hasRoutesWhen('ichava.icon-browser.inertia.enabled', 'inertia', true)
            ->hasRoutesWhen('ichava.icon-browser.api.enabled', 'api', false)
            ->hasCommands([
                InjectNpmScriptsCommand::class,
            ]);
    }

    /**
     * Boot-time registrations (called after all providers register).
     *
     * Registers browser-only Blade components, layouts, anonymous component
     * paths, public asset publishing (Vite dist), and the bundled `ui-icons`
     * icon set with core's `IconRegistry`.
     */
    public function bootingPackage(): void
    {
        // Register HTTP middleware aliases + the ichava.api / ichava.web groups.
        // This is the entire HTTP layer for the Ichava ecosystem, core ships
        // none of it.
        $this->registerMiddleware();

        // Domain-scoped routing (config('ichava.icon-browser.domains')). When empty
        // (default), routes work on every domain; otherwise restrict to listed
        // domains. Auto-skips when no domains are configured.
        $this->registerRoutesOnConfiguredDomains();

        // Browser-only shorthand Blade components for the bundled demo icons.
        Blade::component('ichava::ichava-test-icons', IchavaTestIconComponent::class);
        Blade::component('ichava::ichava-ui-icons', IchavaUiIconComponent::class);

        // SRI-aware <script>/<link> emitter; reads the manifest configured at
        // `ichava-browser.security.sri.manifest` or computes the digest from
        // the public-path file at render time.
        Blade::component(
            'ichava::sri-asset',
            SriAsset::class,
        );

        // Publish the Vite-built browser SPA dist (CSS/JS) into the host's
        // public/vendor/ichava/ namespace. The asset HTTP path stays under
        // `vendor/ichava/...` regardless of the package name so existing
        // views and bookmarks keep working.
        if ($this->app->runningInConsole()) {
            $this->publishes([
                $this->package->basePath('public') => public_path('vendor/ichava'),
            ], ['ichava-assets', 'laravel-assets']);
        }

        // Register the browser's bundled `ui-icons` set with the core registry.
        // Core has bound IconRegistry by now (composer dependency ordering).
        $registry = $this->app->make(IconRegistry::class);
        $registry->fromDirectory(
            $this->package->basePath('resources/assets/svg/ui-icons'),
            self::class,
        );
    }

    /**
     * Register Ichava HTTP middleware (aliases + groups).
     *
     * Hybrid architecture (via core's `HostCapabilities`):
     *  • Sanctum + sessions → full `web` middleware stack with CSRF.
     *  • Sessions only      → `StartSession` + ichava.* middleware, no CSRF.
     *  • Stateless host     → ichava.* only (treat as public JSON API).
     *
     * Always works, never fails, gracefully degrades to the simplest mode.
     */
    protected function registerMiddleware(): void
    {
        $router = $this->app['router'];

        // Per-middleware aliases.
        $router->aliasMiddleware('ichava.session', EnsureSession::class);
        $router->aliasMiddleware('ichava.security', IchavaApiSecurity::class);
        $router->aliasMiddleware('ichava.json', ForceJsonResponse::class);
        $router->aliasMiddleware('ichava.log', LogRequests::class);
        $router->aliasMiddleware('ichava.validate', ValidateIchavaRoute::class);
        $router->aliasMiddleware('ichava.guard', IchavaStatefulGuard::class);
        $router->aliasMiddleware('ichava.cache-admin', AuthorizeCacheAdmin::class);
        $router->aliasMiddleware('ichava.handle-inertia', HandleInertiaRequests::class);

        // Legacy alias for backward compatibility.
        $router->aliasMiddleware('ichava.api.security', IchavaApiSecurity::class);

        // Detect host capabilities (Sanctum / session availability).
        $capabilities = HostCapabilities::getInstance();
        $apiMiddleware = [];

        if ($capabilities->hasSanctum() && $capabilities->hasSession()) {
            $apiMiddleware[] = 'web';
            if (config('app.debug')) {
                $this->app->make(IchavaLogger::class)->debug('Using Sanctum stateful API mode (web middleware)');
            }
        } elseif ($capabilities->hasSession()) {
            $apiMiddleware[] = StartSession::class;
            if (config('app.debug')) {
                $this->app->make(IchavaLogger::class)->debug('Using session-only mode (no Sanctum)');
            }
        } else {
            if (config('app.debug')) {
                $this->app->make(IchavaLogger::class)->debug('Using browser-only mode (no sessions)');
            }
        }

        // Ichava-specific middleware (always included).
        $apiMiddleware = array_merge($apiMiddleware, [
            'ichava.guard',
            'ichava.session',
            'ichava.security',
            'ichava.json',
            'ichava.log',
            'throttle:' . (int) config('ichava.icon-browser.rate_limiting.api_floor', 300) . ',1',
        ]);

        $router->middlewareGroup('ichava.api', $apiMiddleware);

        // Web routes (the SPA + cache UI), standard Laravel `web` stack.
        $router->middlewareGroup('ichava.web', [
            'web',
            'ichava.validate',
        ]);

        // Inertia routes (React pages via Inertia.js). Same `web` foundation
        // plus the shared-props middleware; validation keeps the prefix check.
        $router->middlewareGroup('ichava.inertia', [
            'web',
            'ichava.handle-inertia',
            'ichava.validate',
        ]);
    }

    /**
     * Register routes on configured domains (multi-tenant support).
     *
     * Reads `config('ichava.icon-browser.domains')`:
     *  • [] (default) → routes work on every domain (handled by hasRoutes).
     *  • 'app.test,admin.test' string → split into array.
     *  • ['app.test', 'admin.test'] → register on each.
     *
     * No-op when domains is empty, laranail packager's hasRoutes() handles
     * the all-domains case natively.
     */
    protected function registerRoutesOnConfiguredDomains(): void
    {
        $domains = config('ichava.icon-browser.domains', []);

        if (is_string($domains) && $domains !== '') {
            $domains = array_map('trim', explode(',', $domains));
        }

        if (empty($domains)) {
            return;
        }

        $router = $this->app['router'];
        $webRouteFile = $this->package->basePath('routes/web.php');
        $apiRouteFile = $this->package->basePath('routes/api.php');
        $inertiaRouteFile = $this->package->basePath('routes/inertia.php');

        foreach ((array) $domains as $domain) {
            if ($domain !== '') {
                $router->domain($domain)->group($webRouteFile);
                if (config('ichava.icon-browser.api.enabled', false)) {
                    $router->domain($domain)->group($apiRouteFile);
                }
                if (config('ichava.icon-browser.inertia.enabled', true)) {
                    $router->domain($domain)->group($inertiaRouteFile);
                }
            }
        }
    }
}
