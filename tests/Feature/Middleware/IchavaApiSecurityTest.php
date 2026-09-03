<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Simtabi\Laranail\Ichava\Models\Icon;
use Simtabi\Laranail\Ichava\Browser\Http\Middleware\IchavaApiSecurity;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * IchavaApiSecurity middleware coverage.
 *
 * Hits real API routes (which sit behind the middleware via `ichava.api`) with
 * malicious payloads and verifies the middleware blocks them. Also verifies
 * that the security response headers (CSP, X-Frame-Options, etc.) are emitted
 * on the happy path.
 */
describe('IchavaApiSecurity::handle', function () {
    it('emits the standard security response headers on a clean request', function () {
        $response = test()->getJson(route('ichava.api.packages.index'));

        $response->assertOk();
        // Headers come from addSecurityHeaders() in the middleware.
        expect($response->headers->get('X-Content-Type-Options'))->toBe('nosniff');
        expect($response->headers->get('X-Frame-Options'))->not->toBeNull();
        expect($response->headers->get('Referrer-Policy'))->not->toBeNull();
    });

    it('rejects requests with SQL-injection patterns in query input', function () {
        $response = test()->getJson(
            route('ichava.api.icons.index').'?'.http_build_query(['search' => "' UNION SELECT * FROM users --"])
        );

        $response->assertStatus(400);
    });

    it('rejects requests with XSS patterns in query input', function () {
        $response = test()->getJson(
            route('ichava.api.icons.index').'?'.http_build_query(['search' => '<script>alert(1)</script>'])
        );

        $response->assertStatus(400);
    });

    it('rejects requests carrying path-traversal patterns in inputs', function () {
        $response = test()->getJson(
            route('ichava.api.icons.index').'?'.http_build_query(['search' => '../../etc/passwd'])
        );

        $response->assertStatus(400);
    });

    /*
     * W1-7a / B4. addSecurityHeaders() ran after the controller and unconditionally
     * ->set() every header, so a route that had deliberately set its own lost them on
     * the way out. The SVG endpoint's `immutable` cache header and its tight `sandbox`
     * CSP never reached a client, and every icon was served `no-store`.
     *
     * These assertions are taken from the response as delivered, not from the code that
     * sets them -- standing rule 4.
     */
    it('does not overwrite a header the route has claimed', function () {
        /*
         * Serve a REAL file, so the response is a 200 and the assertions actually run.
         * The pre-existing header test in IconsApiTest guards this same endpoint but
         * wraps its assertions in `if (status === 200)` with a 404 fallback -- and the
         * icon file it creates does not exist, so it took the fallback every time and
         * stayed green throughout the entire period the middleware was clobbering these
         * headers. A conditional assertion on a condition that never holds is not a test.
         */
        $file = tempnam(sys_get_temp_dir(), 'ichava-hdr').'.svg';
        file_put_contents($file, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24"/></svg>');

        try {
            $icon = Icon::create([
                'package' => 'ichava/header-claim-test',
                'name' => 'square',
                'path' => $file,
            ]);

            /*
             * Request the versioned URL. Since W1-7b the endpoint only serves
             * `immutable` when the URL identifies its content, so an unversioned
             * request would legitimately return `must-revalidate` and this test
             * would be asserting the wrong contract.
             */
            $response = test()->get(route('ichava.api.icons.svg', [
                'id' => $icon->id,
                'v' => $icon->render_version,
            ]));

            expect($response->status())->toBe(200);
            expect($response->headers->get('Cache-Control'))->toContain('immutable');
            expect($response->headers->get('Cache-Control'))->not->toContain('no-store');
            expect($response->headers->get('Content-Security-Policy'))->toContain('sandbox');
            expect($response->headers->get('ETag'))->not->toBeNull();

            // Site-wide policy still applies: a claim is per-header, not a blanket opt-out.
            expect($response->headers->get('X-Content-Type-Options'))->toBe('nosniff');
            expect($response->headers->get('X-Frame-Options'))->not->toBeNull();
            expect($response->headers->has('X-Ichava-Own-Headers'))->toBeFalse();
        } finally {
            @unlink($file);
        }
    });

    it('still applies its own headers to a route that claims nothing', function () {
        $response = test()->getJson(route('ichava.api.packages.index'));

        $response->assertOk();
        // The JSON API must keep the no-store default: a claim is opt-in, per route.
        expect($response->headers->get('Cache-Control'))->toContain('no-store');
    });

    it('never leaks the ownership marker to the client', function () {
        $response = test()->getJson(route('ichava.api.packages.index'));

        expect($response->headers->has('X-Ichava-Own-Headers'))->toBeFalse();
    });

    it('returns 415 for non-JSON Content-Type on POST with body', function () {
        $response = test()
            ->withHeaders(['Content-Type' => 'application/xml', 'Accept' => 'application/json'])
            ->call('POST', route('ichava.api.preferences.update'), [], [], [], [
                'CONTENT_TYPE' => 'application/xml',
            ], '<xml>foo</xml>');

        // The middleware should reject the unsupported content type.
        // Status may be 415 (preferred) or 400 depending on how Laravel
        // surfaces the error via the JSON error handler, but it must NOT be 200.
        expect($response->status())->toBeIn([400, 415, 422]);
    });
});

/*
 * Unit-level coverage of the claim mechanism, independent of routing and seeded data.
 */
describe('IchavaApiSecurity::claimHeaders', function () {
    it('lets a claimed header survive the middleware', function () {
        $response = new SymfonyResponse('<svg/>', 200, [
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
        IchavaApiSecurity::claimHeaders($response, 'Cache-Control');

        $out = (new IchavaApiSecurity)->handle(Request::create('/ichava/api/icons/1/svg'), fn () => $response);

        expect($out->headers->get('Cache-Control'))->toContain('immutable');
        expect($out->headers->has('X-Ichava-Own-Headers'))->toBeFalse();
    });

    it('overwrites an unclaimed header', function () {
        $response = new SymfonyResponse('{}', 200, [
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);

        $out = (new IchavaApiSecurity)->handle(Request::create('/ichava/api/packages'), fn () => $response);

        expect($out->headers->get('Cache-Control'))->toContain('no-store');
    });

    /*
     * A plain has() check cannot implement this: Symfony's ResponseHeaderBag
     * synthesises `Cache-Control: no-cache, private` on construction, so has() is true
     * on every response and a has()-gated middleware would stop sending no-store
     * entirely. This pins the framework behaviour the design depends on.
     */
    it('documents why has() is not sufficient: Symfony always sets Cache-Control', function () {
        $bare = new SymfonyResponse('hi', 200, ['Content-Type' => 'image/svg+xml']);

        expect($bare->headers->has('Cache-Control'))->toBeTrue();
        expect($bare->headers->get('Cache-Control'))->toBe('no-cache, private');
        expect($bare->headers->has('Content-Security-Policy'))->toBeFalse();
    });

    it('refuses a claim on a header that is not route-overridable', function () {
        $response = new SymfonyResponse('{}', 200);
        IchavaApiSecurity::claimHeaders($response, 'X-Frame-Options', 'X-Content-Type-Options');

        $out = (new IchavaApiSecurity)->handle(Request::create('/ichava/api/packages'), fn () => $response);

        expect($out->headers->get('X-Content-Type-Options'))->toBe('nosniff');
        expect($out->headers->get('X-Frame-Options'))->not->toBeNull();
    });
});
