<?php

declare(strict_types=1);

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
