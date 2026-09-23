<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\IconBrowser\Tests;

/**
 * Harness for the REST API's default-off state.
 *
 * Withholds the suite-wide `api.enabled` opt-in, so the app boots exactly
 * as a host that never set ICHAVA_API_ENABLED does: JSON routes unmounted,
 * Inertia unaffected.
 */
class ApiDisabledTestCase extends TestCase
{
    protected function apiRoutesEnabled(): bool
    {
        return false;
    }
}
