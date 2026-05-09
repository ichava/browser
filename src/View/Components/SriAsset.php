<?php

declare(strict_types=1);

namespace Simtabi\Laranail\Ichava\Browser\View\Components;

use Illuminate\Contracts\Filesystem\FileNotFoundException;
use Illuminate\Support\Facades\File;
use Illuminate\View\Component;
use Illuminate\View\View;
use Throwable;
use Illuminate\Support\Str;

/**
 * Emit a `<script>` or `<link>` tag with a Subresource Integrity hash so the
 * browser will refuse to execute / apply the asset if the bytes ever change
 * out of band.
 *
 * Usage:
 *   <x-ichava::sri-asset src="vendor/ichava/spa.js" />
 *   <x-ichava::sri-asset href="vendor/ichava/spa.css" rel="stylesheet" />
 *
 * If `ichava-browser.security.sri.manifest` points at a JSON map of
 * `{ "vendor/ichava/spa.js": "sha384-..." }` the hash is read from there.
 * Otherwise the hash is computed at render time from the file on disk.
 */
final class SriAsset extends Component
{
    public string $integrity = '';
    public string $crossorigin = 'anonymous';
    public string $tag;
    public string $url;

    public function __construct(
        public ?string $src = null,
        public ?string $href = null,
        public string $rel = 'stylesheet',
        public string $type = '',
        public bool $defer = false,
        public bool $async = false,
    ) {
        $path = $src ?? $href;
        if ($path === null || $path === '') {
            throw new \InvalidArgumentException('SriAsset requires either src or href.');
        }

        $this->tag = $src !== null ? 'script' : 'link';
        $this->url = $this->resolveUrl($path);

        if ((bool) config('ichava-browser.security.sri.enabled', true)) {
            $this->integrity = $this->computeIntegrity($path);
        }
    }

    public function render(): View
    {
        return view('ichava::components.sri-asset');
    }

    private function resolveUrl(string $path): string
    {
        if (Str::startsWith($path, 'http://') || Str::startsWith($path, 'https://') || Str::startsWith($path, '//')) {
            return $path;
        }
        if (Str::startsWith($path, '/')) {
            return $path;
        }

        return asset($path);
    }

    private function computeIntegrity(string $path): string
    {
        $algo = (string) config('ichava-browser.security.sri.algorithm', 'sha384');

        if ($manifestPath = config('ichava-browser.security.sri.manifest')) {
            $hash = $this->lookupManifest((string) $manifestPath, $path);
            if ($hash !== null) {
                return $hash;
            }
        }

        return $this->computeFromDisk($algo, $path);
    }

    private function lookupManifest(string $manifestPath, string $path): ?string
    {
        if (! File::isFile($manifestPath) || ! File::isReadable($manifestPath)) {
            return null;
        }

        try {
            $contents = File::get($manifestPath);
        } catch (Throwable) {
            return null;
        }

        $data = json_decode($contents, true);
        if (! is_array($data)) {
            return null;
        }

        $hash = $data[$path] ?? $data[ltrim($path, '/')] ?? null;

        return is_string($hash) && $hash !== '' ? $hash : null;
    }

    private function computeFromDisk(string $algo, string $path): string
    {
        $publicRoot = realpath(public_path()) ?: public_path();
        $candidate  = public_path(ltrim($path, '/'));
        $resolved   = realpath($candidate);

        // Containment: refuse anything that escapes public/ via .. segments
        // or symlinks. This stops SRI from doubling as an existence/contents
        // oracle for arbitrary filesystem paths.
        if ($resolved === false
            || ! Str::startsWith($resolved, $publicRoot . DIRECTORY_SEPARATOR)
            || is_link($candidate)
        ) {
            throw new FileNotFoundException("SRI asset is outside the public/ root: {$path}");
        }

        if (! File::isFile($resolved) || ! File::isReadable($resolved)) {
            throw new FileNotFoundException("SRI asset not found at {$resolved}");
        }

        // hash_file with binary: true is used here because base64-encoding
        // requires raw bytes; File::hash() only exposes hex output.
        $digest = hash_file($algo, $resolved, binary: true);
        if ($digest === false) {
            throw new \RuntimeException("Unable to hash SRI asset {$resolved} with algorithm {$algo}.");
        }

        return $algo . '-' . base64_encode($digest);
    }
}
