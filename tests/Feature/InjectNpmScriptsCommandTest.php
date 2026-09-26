<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\IconBrowser\Commands\InjectNpmScriptsCommand;

/*
 * What inject-scripts does to a host package.json, and that everything it says
 * comes from resources/lang rather than English literals.
 */

function injectScriptsFixture(array $data): string
{
    $path = sys_get_temp_dir() . '/ichava-inject-' . bin2hex(random_bytes(6)) . '.json';
    file_put_contents($path, json_encode($data));

    return $path;
}

it('injects the scripts once and says so', function (): void {
    $path = injectScriptsFixture(['name' => 'host', 'scripts' => ['dev' => 'vite']]);

    $this->artisan('ichava::icon-browser.inject-scripts', ['--path' => $path])
        ->expectsOutputToContain('Ichava npm scripts injected into package.json:')
        ->expectsOutputToContain('ichava:build')
        ->assertExitCode(0);

    $scripts = json_decode((string) file_get_contents($path), true)['scripts'];
    $this->assertSame('vite', $scripts['dev']);
    $this->assertArrayHasKey('ichava:build:prod', $scripts);

    $this->artisan('ichava::icon-browser.inject-scripts', ['--path' => $path])
        ->expectsOutputToContain('already present')
        ->assertExitCode(0);

    unlink($path);
});

it('fails clearly when package.json is missing', function (): void {
    $this->artisan('ichava::icon-browser.inject-scripts', ['--path' => '/nowhere/package.json'])
        ->expectsOutputToContain('package.json not found at: /nowhere/package.json')
        ->assertExitCode(1);
});

it('says nothing in English that is not in resources/lang', function (): void {
    $source = (string) file_get_contents((new ReflectionClass(InjectNpmScriptsCommand::class))->getFileName());

    // Output calls whose first argument is a literal with words in it.
    preg_match_all('/->(?:line|info|error|warn|comment)\(\s*([\'"])([^\'"]*)\1/', $source, $m);
    $english = array_filter($m[2], static fn (string $t): bool => preg_match('/[A-Za-z]{2}/', (string) preg_replace('#</?[a-z]*(=[a-z;,=]+)?>#i', '', $t)) === 1);
    $this->assertSame([], array_values($english));

    preg_match_all("/'ichava\\/icon-browser::(commands\\.[a-z_.]+)'/", $source, $keys);
    $this->assertNotEmpty($keys[1], 'the command references no translation keys');

    foreach ($keys[1] as $key) {
        $this->assertNotSame("ichava/icon-browser::{$key}", __("ichava/icon-browser::{$key}"), "unresolved: {$key}");
    }
});
