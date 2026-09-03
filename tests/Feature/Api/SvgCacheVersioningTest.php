<?php

declare(strict_types=1);

use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Services\SvgProcessingService;

/**
 * W1-7b / `B0-b`. `immutable, max-age=31536000` is a promise that a URL's bytes
 * never change. The endpoint made that promise on a URL keyed by icon id, so a
 * file changed under the same id served stale for up to a year.
 *
 * It was masked until 2026-09-02: `IchavaApiSecurity` overwrote the header with
 * `no-store` before the response left the app, so nothing cached at all. Fixing
 * that (W1-7a) unmasked this, which is why the two land together.
 *
 * `render_version` comes from `ichava/core`, which this package now requires at
 * `^0.1.1` precisely so these tests cannot skip. A conditional skip here would
 * hide the one failure mode that matters: on a core without the accessor,
 * `$icon->render_version` is null and the controller's
 * `$request->query('v') === $icon->render_version` becomes null === null, so the
 * versioned case would pass while testing nothing.
 */
function makeIconWithFile(string $body = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24"/></svg>'): array
{
    $file = tempnam(sys_get_temp_dir(), 'ichava-ver').'.svg';
    file_put_contents($file, $body);

    $icon = Icon::create([
        'package' => 'ichava/version-test',
        'name' => 'square',
        'path' => $file,
        'file_hash' => md5($body),
    ]);

    return [$icon, $file];
}

describe('SVG cache versioning', function () {
    it('serves immutable only when the request carries the current render version', function () {
        [$icon, $file] = makeIconWithFile();

        try {
            $response = test()->get(route('ichava.api.icons.svg', [
                'id' => $icon->id,
                'v' => $icon->render_version,
            ]));

            $response->assertOk();
            expect($response->headers->get('Cache-Control'))->toContain('immutable')
                ->and($response->headers->get('Cache-Control'))->toContain('max-age=31536000');
        } finally {
            @unlink($file);
        }
    });

    it('refuses immutable when the version is absent', function () {
        [$icon, $file] = makeIconWithFile();

        try {
            $response = test()->get(route('ichava.api.icons.svg', ['id' => $icon->id]));

            $response->assertOk();
            expect($response->headers->get('Cache-Control'))->not->toContain('immutable')
                ->and($response->headers->get('Cache-Control'))->toContain('must-revalidate');
        } finally {
            @unlink($file);
        }
    });

    it('refuses immutable when the version is stale', function () {
        [$icon, $file] = makeIconWithFile();

        try {
            $response = test()->get(route('ichava.api.icons.svg', [
                'id' => $icon->id,
                'v' => 'deadbeefdeadbeef',
            ]));

            // Still the current bytes, never a 404 and never a redirect: the id
            // URL is a published contract. What it loses is the immutability.
            $response->assertOk();
            expect($response->getContent())->toContain('<svg')
                ->and($response->headers->get('Cache-Control'))->not->toContain('immutable');
        } finally {
            @unlink($file);
        }
    });

    it('always sends a strong validator, so the revalidating path costs a 304', function () {
        [$icon, $file] = makeIconWithFile();

        try {
            $response = test()->get(route('ichava.api.icons.svg', ['id' => $icon->id]));

            expect($response->headers->get('ETag'))->not->toBeNull();
        } finally {
            @unlink($file);
        }
    });

    it('publishes a versioned svg_url so clients do not have to build one', function () {
        [$icon, $file] = makeIconWithFile();

        try {
            $response = test()->getJson(route('ichava.api.icons.show', ['id' => $icon->id]));

            $response->assertOk();
            $url = $response->json('data.svg_url');

            expect($url)->toContain('v='.$icon->render_version);

            // And that published URL must be the one that earns immutable.
            $followed = test()->get($url);
            expect($followed->headers->get('Cache-Control'))->toContain('immutable');
        } finally {
            @unlink($file);
        }
    });

    /*
     * The token must cover the render policy, not just the file. Widening the
     * allow-list changes every icon's bytes while leaving every file hash
     * untouched; a file-hash-only token would keep a year of stale responses
     * cached under a URL whose content had changed.
     */
    it('changes the version when the policy changes, with the file untouched', function () {
        [$icon, $file] = makeIconWithFile();

        try {
            $before = $icon->render_version;

            $svc = app(SvgProcessingService::class);
            $svc->setAllowedTags([...$svc->getAllowedTags(), 'pattern']);

            expect($icon->fresh()->render_version)->not->toBe($before);
        } finally {
            @unlink($file);
        }
    });
});
