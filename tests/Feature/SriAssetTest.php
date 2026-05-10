<?php

declare(strict_types=1);

use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Simtabi\Laranail\Ichava\Browser\View\Components\SriAsset;

beforeEach(function (): void {
    $this->fixturesDir = sys_get_temp_dir().'/ichava-sri-'.bin2hex(random_bytes(4));
    mkdir($this->fixturesDir, 0700, true);
});

afterEach(function (): void {
    if (is_dir($this->fixturesDir)) {
        foreach (glob("{$this->fixturesDir}/*") as $file) {
            @unlink($file);
        }
        @rmdir($this->fixturesDir);
    }
});

it('rejects construction when neither src nor href is given', function (): void {
    expect(fn () => new SriAsset)->toThrow(InvalidArgumentException::class);
});

it('reads the integrity hash from a manifest when configured', function (): void {
    $manifest = "{$this->fixturesDir}/sri.json";
    file_put_contents($manifest, json_encode([
        'vendor/ichava/spa.js' => 'sha384-known-hash',
    ]));

    config(['ichava-browser.security.sri.enabled' => true]);
    config(['ichava-browser.security.sri.manifest' => $manifest]);

    $component = new SriAsset(src: 'vendor/ichava/spa.js');

    expect($component->integrity)->toBe('sha384-known-hash');
    expect($component->tag)->toBe('script');
});

it('uses the rel attribute for href-mode renders', function (): void {
    config(['ichava-browser.security.sri.enabled' => false]);

    $component = new SriAsset(href: 'vendor/ichava/spa.css', rel: 'stylesheet');

    expect($component->tag)->toBe('link');
    expect($component->rel)->toBe('stylesheet');
    expect($component->integrity)->toBe('');
});

it('rejects paths that escape public/ via .. traversal', function (): void {
    config(['ichava-browser.security.sri.enabled' => true]);
    config(['ichava-browser.security.sri.manifest' => null]); // force computeFromDisk

    expect(fn () => new SriAsset(src: '../../../etc/passwd'))
        ->toThrow(FileNotFoundException::class);
});

it('rejects absolute paths outside the public root', function (): void {
    config(['ichava-browser.security.sri.enabled' => true]);
    config(['ichava-browser.security.sri.manifest' => null]);

    expect(fn () => new SriAsset(src: '/etc/hosts'))
        ->toThrow(FileNotFoundException::class);
});
