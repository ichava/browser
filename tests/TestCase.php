<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Tests;

use Illuminate\Foundation\Application;
use Orchestra\Testbench\TestCase as Orchestra;
use Simtabi\Laranail\Ichava\Browser\Providers\IchavaBrowserServiceProvider;
use Simtabi\Laranail\Ichava\Providers\IchavaServiceProvider;

abstract class TestCase extends Orchestra
{
    /**
     * @param  Application  $app
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [
            IchavaServiceProvider::class,
            IchavaBrowserServiceProvider::class,
        ];
    }

    /**
     * @param  Application  $app
     */
    protected function defineEnvironment($app): void
    {
        // Web routes that use sessions/cookies require an encryption key in
        // Testbench; without it any web-route GET trips MissingAppKeyException.
        $app['config']->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
        ]);
        $app['config']->set('cache.default', 'array');
    }
}
