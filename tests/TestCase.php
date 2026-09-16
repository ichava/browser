<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\Tests;

use Illuminate\Foundation\Application;
use Orchestra\Testbench\TestCase as Orchestra;
use Simtabi\Laranail\Ichava\Providers\IchavaServiceProvider;
use Simtabi\Laranail\Ichava\Browser\Providers\IchavaBrowserServiceProvider;

abstract class TestCase extends Orchestra
{
    /**
     * @param Application $app
     *
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
     * @param Application $app
     */
    protected function defineEnvironment($app): void
    {
        // Web routes that use sessions/cookies require an encryption key in
        // Testbench; without it any web-route GET trips MissingAppKeyException.
        $app['config']->set('app.key', 'base64:' . base64_encode(random_bytes(32)));

        $this->configureDatabase($app);
        $this->configureCache($app);
    }

    /**
     * Point the suite at whichever database `DB_CONNECTION` names.
     *
     * The API tests run against real tables -- `PackageApiTest` refreshes the database and
     * queries through `ichava/core`'s models -- so they exercise the engine's schema and its
     * driver-specific query paths. Running only on SQLite hid that icon search was broken on
     * PostgreSQL for the whole life of the package. Mirrors `ichava/core`'s harness so both
     * suites answer to the same environment variables.
     *
     * @param Application $app
     */
    protected function configureDatabase($app): void
    {
        $driver = env('DB_CONNECTION', 'sqlite');

        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', match ($driver) {
            'pgsql' => [
                'driver'      => 'pgsql',
                'host'        => env('DB_HOST', '127.0.0.1'),
                'port'        => env('DB_PORT', '5432'),
                'database'    => env('DB_DATABASE', 'ichava_test'),
                'username'    => env('DB_USERNAME', 'ichava'),
                'password'    => env('DB_PASSWORD', 'secret'),
                'charset'     => 'utf8',
                'prefix'      => '',
                'search_path' => 'public',
                'sslmode'     => 'prefer',
            ],
            'mysql', 'mariadb' => [
                'driver'    => $driver,
                'host'      => env('DB_HOST', '127.0.0.1'),
                'port'      => env('DB_PORT', '3306'),
                'database'  => env('DB_DATABASE', 'ichava_test'),
                'username'  => env('DB_USERNAME', 'ichava'),
                'password'  => env('DB_PASSWORD', 'secret'),
                'charset'   => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix'    => '',
                'strict'    => true,
                'engine'    => 'InnoDB',
            ],
            default => [
                'driver'   => 'sqlite',
                'database' => env('DB_DATABASE', ':memory:'),
                'prefix'   => '',

                // Off by default on SQLite, and Laravel only turns it on when the key is
                // present. Without it the engine's cascading deletes are never enforced on
                // the one driver the fast lane runs.
                'foreign_key_constraints' => true,
            ],
        });
    }

    /**
     * @param Application $app
     */
    protected function configureCache($app): void
    {
        // The array store hands back the object it was given, so nothing here crosses
        // serialize()/unserialize(). A test that depends on that boundary has to switch to a
        // serialising store itself.
        $app['config']->set('cache.default', 'array');
        $app['config']->set('cache.stores.array', [
            'driver'    => 'array',
            'serialize' => false,
        ]);
    }
}
