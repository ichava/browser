<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Tests;

use Orchestra\Testbench\TestCase as Orchestra;
use Simtabi\Laranail\Ichava\Browser\Providers\IchavaBrowserServiceProvider;
use Simtabi\Laranail\Ichava\Providers\IchavaServiceProvider;

abstract class TestCase extends Orchestra
{
    /**
     * @param  \Illuminate\Foundation\Application  $app
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [
            IchavaServiceProvider::class,
            IchavaBrowserServiceProvider::class,
        ];
    }
}
