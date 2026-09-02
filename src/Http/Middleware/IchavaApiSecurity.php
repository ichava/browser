<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Simtabi\Laranail\Ichava\Support\AuditLogger;
use Simtabi\Laranail\Ichava\Support\SecurityNonce;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Hardens Ichava API responses: CORS, request-size limits, SQL/XSS/path-traversal
 * pattern detection, and the standard security headers (CSP, X-Frame-Options,
 * HSTS, Permissions-Policy, …).
 */
final class IchavaApiSecurity
{
    /**
     * Headers a route is allowed to own, overriding this middleware's default.
     *
     * Everything not listed here applies unconditionally: `X-Frame-Options`,
     * `Referrer-Policy`, `Permissions-Policy`, CORS, CSP-report-only, HSTS and
     * `nosniff` are site-wide policy and a route does not get to weaken them.
     * These five are the ones a single response legitimately knows better
     * about than the middleware does -- an immutable, content-addressed asset
     * being the motivating case.
     *
     * Lower-case: header names are case-insensitive and this list is compared
     * against `strtolower()`.
     *
     * @var list<string>
     */
    public const OVERRIDABLE_HEADERS = [
        'cache-control',
        'pragma',
        'content-security-policy',
        'etag',
        'expires',
    ];

    /**
     * Marker carrying the header names a route has claimed.
     *
     * A response header rather than a request attribute only because the
     * controller actions that need it are not all handed the Request. It is
     * removed unconditionally at the top of `addSecurityHeaders()`, so it never
     * reaches a client through a route this middleware is applied to -- which
     * is asserted by a test rather than assumed.
     */
    private const OWNERSHIP_HEADER = 'X-Ichava-Own-Headers';

    /**
     * Suspicious SQL patterns to block
     */
    private const SQL_PATTERNS = [
        '/(\bUNION\b.*\bSELECT\b)/i',
        '/(\bSELECT\b.*\bFROM\b)/i',
        '/(\bINSERT\b.*\bINTO\b)/i',
        '/(\bUPDATE\b.*\bSET\b)/i',
        '/(\bDELETE\b.*\bFROM\b)/i',
        '/(\bDROP\b.*\b(TABLE|DATABASE)\b)/i',
        '/(\bEXEC\b|\bEXECUTE\b)/i',
        '/(--|\#|\/\*)/i',
        '/(\bOR\b\s+\d+\s*=\s*\d+)/i',
        '/(\bAND\b\s+\d+\s*=\s*\d+)/i',
    ];

    /**
     * Suspicious XSS patterns to block
     */
    private const XSS_PATTERNS = [
        '/<script\b[^>]*>/i',
        '/javascript:/i',
        '/on\w+\s*=/i',
        '/<iframe\b/i',
        '/<object\b/i',
        '/<embed\b/i',
        '/<form\b/i',
        '/data:text\/html/i',
        '/expression\s*\(/i',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Validate Content-Type for POST/PUT/PATCH
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH'], true)) {
            if (! $this->isValidContentType($request)) {
                $this->audit('http.invalid_content_type', AuditLogger::SEVERITY_WARNING, [
                    'content_type' => $request->header('Content-Type'),
                    'path' => $request->path(),
                ]);

                return $this->errorResponse(
                    'Invalid Content-Type. Expected application/json.',
                    Response::HTTP_UNSUPPORTED_MEDIA_TYPE
                );
            }
        }

        // 2. Check request size
        $maxSize = (int) config('ichava.browser.max_request_size', 1048576); // 1MB default
        if ($request->header('Content-Length') && (int) $request->header('Content-Length') > $maxSize) {
            $this->audit('http.request_too_large', AuditLogger::SEVERITY_WARNING, [
                'content_length' => (int) $request->header('Content-Length'),
                'max_size' => $maxSize,
            ]);

            return $this->errorResponse(
                'Request body too large.',
                Response::HTTP_REQUEST_ENTITY_TOO_LARGE
            );
        }

        // 3. Detect SQL injection attempts
        if ($this->detectSqlInjection($request)) {
            $this->audit('http.sql_injection_attempt', AuditLogger::SEVERITY_ERROR, [
                'path' => $request->path(),
            ]);

            return $this->errorResponse(
                'Potentially malicious request detected.',
                Response::HTTP_BAD_REQUEST
            );
        }

        // 4. Detect XSS attempts
        if ($this->detectXss($request)) {
            $this->audit('http.xss_attempt', AuditLogger::SEVERITY_ERROR, [
                'path' => $request->path(),
            ]);

            return $this->errorResponse(
                'Potentially malicious content detected.',
                Response::HTTP_BAD_REQUEST
            );
        }

        // 5. Detect path traversal
        if ($this->detectPathTraversal($request)) {
            $this->audit('http.path_traversal_attempt', AuditLogger::SEVERITY_ERROR, [
                'path' => $request->path(),
            ]);

            return $this->errorResponse(
                'Invalid path detected.',
                Response::HTTP_BAD_REQUEST
            );
        }

        // Process the request
        $response = $next($request);

        // 6. Add security headers
        $response = $this->addSecurityHeaders($response);

        // 7. Pretty print JSON for browser requests
        if ($response instanceof JsonResponse && $this->shouldPrettyPrint($request)) {
            $response->setEncodingOptions(
                $response->getEncodingOptions() | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
            );
        }

        return $response;
    }

    /**
     * Check if Content-Type is valid for JSON API
     */
    private function isValidContentType(Request $request): bool
    {
        $contentType = $request->header('Content-Type', '');

        // Allow empty body requests
        if (empty($request->getContent())) {
            return true;
        }

        return Str::contains($contentType, 'application/json')
            || Str::contains($contentType, 'application/x-www-form-urlencoded')
            || Str::contains($contentType, 'multipart/form-data');
    }

    /**
     * Detect potential SQL injection patterns
     */
    private function detectSqlInjection(Request $request): bool
    {
        $inputs = $this->getAllInputs($request);

        foreach ($inputs as $value) {
            if (! is_string($value)) {
                continue;
            }

            foreach (self::SQL_PATTERNS as $pattern) {
                if (preg_match($pattern, $value)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Detect potential XSS patterns
     */
    private function detectXss(Request $request): bool
    {
        $inputs = $this->getAllInputs($request);

        foreach ($inputs as $value) {
            if (! is_string($value)) {
                continue;
            }

            foreach (self::XSS_PATTERNS as $pattern) {
                if (preg_match($pattern, $value)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Detect path traversal attempts
     */
    private function detectPathTraversal(Request $request): bool
    {
        $inputs = $this->getAllInputs($request);
        $path = $request->path();

        // Check URL path
        if (Str::contains($path, '..') || Str::contains($path, '%2e%2e')) {
            return true;
        }

        // Check inputs
        foreach ($inputs as $value) {
            if (! is_string($value)) {
                continue;
            }

            if (Str::contains($value, '../') ||
                Str::contains($value, '..\\') ||
                Str::contains($value, '%2e%2e') ||
                Str::contains($value, '....')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all input values (query, body, headers)
     */
    private function getAllInputs(Request $request): array
    {
        return array_merge(
            $request->query(),
            $request->post(),
            $request->input() ?? []
        );
    }

    /**
     * Add security headers to response.
     *
     * Header values come from `config('ichava.browser.security.*')` so the
     * host application can tighten or relax them per environment without
     * forking the middleware. CSP mode supports `strict`, `nonce`, and
     * `hash`.
     */
    private function addSecurityHeaders(Response $response): Response
    {
        // X-XSS-Protection is deliberately omitted: the header is deprecated
        // (removed from Chrome 78+, never implemented in Firefox), and the
        // legacy `1; mode=block` value can introduce side-channel XSS in
        // some configurations. CSP supersedes it; see security-model.md.
        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => (string) config('ichava.browser.security.frame_options', 'DENY'),
            'Referrer-Policy' => (string) config(
                'ichava.browser.security.referrer_policy',
                'strict-origin-when-cross-origin'
            ),
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'X-Ichava-API-Version' => '1.0',
            'Permissions-Policy' => (string) config(
                'ichava.browser.security.permissions_policy',
                'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
            ),
        ];

        $cspHeader = $this->buildCspHeader();
        if ($cspHeader !== null) {
            [$cspName, $cspValue] = $cspHeader;
            $headers[$cspName] = $cspValue;
        }

        $hsts = $this->buildHstsHeader();
        if ($hsts !== null) {
            $headers['Strict-Transport-Security'] = $hsts;
        }

        if (config('ichava.browser.api.cors.enabled', true)) {
            $headers = array_merge($headers, $this->getCorsHeaders());
        }

        /*
         * Apply, but do not clobber a header the route deliberately set.
         *
         * This loop used to be an unconditional `set()` over every key, and it
         * ran *after* the controller. The SVG endpoint's own
         * `Cache-Control: public, max-age=31536000, immutable` and its tight
         * `sandbox` CSP were both overwritten before the response left the
         * application, so every one of 128,918 icons was served `no-store` and
         * nothing cached -- not the browser, not a CDN. The endpoint's headers
         * were correct all along and never reached a client. (`B4`, W1-7a.)
         *
         * A plain `has()` check is NOT sufficient here, and getting this wrong
         * fails silently in the opposite direction. Symfony's ResponseHeaderBag
         * synthesises `Cache-Control: no-cache, private` on construction, so
         * `has('Cache-Control')` is true on *every* response and a `has()`-gated
         * middleware would stop sending `no-store` on the JSON API entirely.
         * Ownership therefore has to be declared, not inferred.
         */
        $owned = $this->claimedHeaders($response);

        foreach ($headers as $key => $value) {
            if (in_array(mb_strtolower($key), $owned, true)) {
                continue;
            }

            $response->headers->set($key, $value);
        }

        return $response;
    }

    /**
     * Read and consume the ownership marker.
     *
     * Removed unconditionally, so the marker never survives into a response
     * even when the route claimed nothing.
     *
     * @return list<string> lower-cased header names the route owns
     */
    private function claimedHeaders(Response $response): array
    {
        $raw = $response->headers->get(self::OWNERSHIP_HEADER);
        $response->headers->remove(self::OWNERSHIP_HEADER);

        if ($raw === null || $raw === '') {
            return [];
        }

        return array_values(array_intersect(
            array_map(
                static fn (string $name): string => mb_strtolower(trim($name)),
                explode(',', $raw)
            ),
            self::OVERRIDABLE_HEADERS
        ));
    }

    /**
     * Declare that this response owns the given headers.
     *
     * Call it from a controller alongside the headers themselves. Anything not
     * in `OVERRIDABLE_HEADERS` is ignored rather than rejected: a route cannot
     * opt out of `nosniff` or `X-Frame-Options` by asking to.
     *
     * Claiming a header the response does not set means the header is simply
     * absent -- which is the point for `Pragma` on a cacheable asset, where the
     * middleware's `no-cache` would otherwise fight an `immutable`
     * `Cache-Control` in older intermediaries.
     */
    public static function claimHeaders(Response $response, string ...$names): Response
    {
        $claimed = array_values(array_intersect(
            array_map(
                static fn (string $name): string => mb_strtolower(trim($name)),
                $names
            ),
            self::OVERRIDABLE_HEADERS
        ));

        if ($claimed === []) {
            return $response;
        }

        $existing = $response->headers->get(self::OWNERSHIP_HEADER);
        if ($existing !== null && $existing !== '') {
            $claimed = array_values(array_unique(array_merge(
                explode(',', $existing),
                $claimed
            )));
        }

        $response->headers->set(self::OWNERSHIP_HEADER, implode(',', $claimed));

        return $response;
    }

    /**
     * Build the CSP header value for the configured mode.
     *
     * @return array{0:string,1:string}|null [header-name, header-value]
     */
    private function buildCspHeader(): ?array
    {
        $mode = (string) config('ichava.browser.security.csp.mode', 'strict');
        $extra = (array) config('ichava.browser.security.csp.extra_directives', []);

        $directives = match ($mode) {
            'nonce' => $this->cspNonceDirectives(),
            'hash' => $this->cspHashDirectives(),
            default => [
                'default-src' => "'none'",
                'frame-ancestors' => "'none'",
            ],
        };

        foreach ($extra as $name => $value) {
            $directives[$name] = $value;
        }

        if ($report = config('ichava.browser.security.csp.report_uri')) {
            $directives['report-uri'] = $report;
        }

        $value = '';
        foreach ($directives as $name => $directive) {
            $value .= $name.' '.$directive.'; ';
        }
        $value = rtrim($value, '; ');

        $name = (bool) config('ichava.browser.security.csp.report_only', false)
            ? 'Content-Security-Policy-Report-Only'
            : 'Content-Security-Policy';

        return [$name, $value];
    }

    /**
     * @return array<string,string>
     */
    private function cspNonceDirectives(): array
    {
        $nonce = $this->resolveNonce();
        $token = $nonce !== null ? "'nonce-{$nonce}'" : "'self'";

        return [
            'default-src' => "'self'",
            'script-src' => "'self' {$token}",
            'style-src' => "'self' {$token}",
            'img-src' => "'self' data:",
            'font-src' => "'self' data:",
            'connect-src' => "'self'",
            'frame-ancestors' => "'none'",
            'base-uri' => "'self'",
            'form-action' => "'self'",
            'object-src' => "'none'",
        ];
    }

    /**
     * @return array<string,string>
     */
    private function cspHashDirectives(): array
    {
        $hashes = (array) config('ichava.browser.security.csp.hashes', []);
        $script = isset($hashes['script-src']) ? implode(' ', (array) $hashes['script-src']) : '';
        $style = isset($hashes['style-src']) ? implode(' ', (array) $hashes['style-src']) : '';

        return [
            'default-src' => "'self'",
            'script-src' => trim("'self' {$script}"),
            'style-src' => trim("'self' {$style}"),
            'img-src' => "'self' data:",
            'connect-src' => "'self'",
            'frame-ancestors' => "'none'",
            'base-uri' => "'self'",
            'form-action' => "'self'",
            'object-src' => "'none'",
        ];
    }

    private function resolveNonce(): ?string
    {
        try {
            $nonce = app(SecurityNonce::class);
        } catch (Throwable) {
            return null;
        }

        return $nonce instanceof SecurityNonce ? $nonce->value() : null;
    }

    private function buildHstsHeader(): ?string
    {
        if (! (bool) config('ichava.browser.security.hsts.enabled', true)) {
            return null;
        }

        $maxAge = (int) config('ichava.browser.security.hsts.max_age', 31536000);
        $value = "max-age={$maxAge}";

        if ((bool) config('ichava.browser.security.hsts.include_subdomains', true)) {
            $value .= '; includeSubDomains';
        }
        if ((bool) config('ichava.browser.security.hsts.preload', false)) {
            $value .= '; preload';
        }

        return $value;
    }

    private function audit(string $event, int $severity, array $context = []): void
    {
        try {
            $logger = app(AuditLogger::class);
        } catch (Throwable) {
            return;
        }

        $logger->record($event, $severity, $context);
    }

    /**
     * Get CORS headers
     */
    private function getCorsHeaders(): array
    {
        $allowedOrigins = config('ichava.browser.api.cors.allowed_origins');
        $allowedMethods = config('ichava.browser.api.cors.allowed_methods', 'GET, POST, PUT, DELETE, OPTIONS');
        $allowedHeaders = config('ichava.browser.api.cors.allowed_headers', 'Content-Type, Authorization, X-Requested-With, Accept');

        return [
            'Access-Control-Allow-Origin' => is_array($allowedOrigins) ? implode(', ', $allowedOrigins) : $allowedOrigins,
            'Access-Control-Allow-Methods' => $allowedMethods,
            'Access-Control-Allow-Headers' => $allowedHeaders,
            'Access-Control-Max-Age' => '86400',
        ];
    }

    /**
     * Determine if response should be pretty printed
     *
     * Pretty print is ENABLED BY DEFAULT for better developer experience.
     * Can be disabled with ?pretty=0 or ?pretty=false if needed.
     */
    private function shouldPrettyPrint(Request $request): bool
    {
        // Check for explicit disable: ?pretty=0 or ?pretty=false
        if ($request->has('pretty')) {
            $pretty = $request->query('pretty');

            // Only disable if explicitly set to 0 or false
            if ($pretty === '0' || $pretty === 'false') {
                return false;
            }
        }

        // Pretty print is enabled by default (configurable)
        return config('ichava.browser.api.pretty_print', true);
    }

    /**
     * Create error JSON response
     */
    private function errorResponse(string $message, int $status): JsonResponse
    {
        return new JsonResponse([
            'success' => false,
            'error' => [
                'message' => $message,
                'code' => $status,
            ],
        ], $status, [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
        ]);
    }
}
