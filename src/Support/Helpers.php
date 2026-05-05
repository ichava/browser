<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Support;

/**
 * Browser-only HTTP helper utilities.
 *
 * Anything that reads from `config('ichava-browser.*')` lives here so core
 * stays free of HTTP-config knowledge. Cross-package use case: routes/api.php
 * and middleware that need rate-limit middleware strings.
 */
final class Helpers
{
    /**
     * Build a Laravel throttle-middleware string from the per-route rate limit.
     *
     * Reads `ichava-browser.rate_limiting.enabled` and
     * `ichava-browser.rate_limiting.{type}`. When rate limiting is disabled,
     * returns an empty array (caller spreads it into ->middleware([...])).
     *
     * @param  string  $type     Rate limit bucket (e.g. 'browser', 'api').
     * @param  int     $default  Fallback per-minute limit if not configured.
     * @return array<int, string>  Array containing one `throttle:N,1` entry or empty.
     */
    public static function getRateLimit(string $type, int $default): array
    {
        if (! config('ichava-browser.rate_limiting.enabled', false)) {
            return [];
        }

        $limit = config("ichava-browser.rate_limiting.{$type}", $default);

        return ["throttle:{$limit},1"];
    }
}
