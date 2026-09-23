<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;
use Simtabi\Laranail\Ichava\IconBrowser\Tests\TestCase;
use Simtabi\Laranail\Ichava\IconBrowser\Tests\ApiDisabledTestCase;

pest()
    ->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

pest()
    ->extend(ApiDisabledTestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Gated');
