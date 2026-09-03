<?php

declare(strict_types=1);

/**
 * R-P16. The React mount is gated on BOTH the config flag and the query
 * string, and neither alone is enough -- see the comment on `$useReact` in
 * `app.blade.php`. These assert the four combinations directly against the
 * rendered HTML, not against the computed boolean, since the boolean living
 * only inside the Blade template is exactly the kind of thing that silently
 * stops matching the markup after a refactor.
 */
describe('React UI kill switch', function () {
    it('mounts Vue by default: flag off, no query param', function () {
        config(['ichava.browser.react_ui_enabled' => false]);

        $html = test()->get(route('ichava.browser'))->getContent();

        expect($html)->toContain('id="ichava-app"')
            ->not->toContain('id="ichava-app-react"')
            ->toContain('vendor/ichava/assets/js/ichava.js')
            ->not->toContain('ichava-react.js');
    });

    it('stays on Vue when only the query param is present: flag off', function () {
        config(['ichava.browser.react_ui_enabled' => false]);

        $html = test()->get(route('ichava.browser', ['ui' => 'react']))->getContent();

        expect($html)->toContain('id="ichava-app"')
            ->not->toContain('id="ichava-app-react"');
    });

    it('stays on Vue when only the flag is on: no query param', function () {
        config(['ichava.browser.react_ui_enabled' => true]);

        $html = test()->get(route('ichava.browser'))->getContent();

        expect($html)->toContain('id="ichava-app"')
            ->not->toContain('id="ichava-app-react"');
    });

    it('mounts React only when BOTH the flag is on and ?ui=react is present', function () {
        config(['ichava.browser.react_ui_enabled' => true]);

        $html = test()->get(route('ichava.browser', ['ui' => 'react']))->getContent();

        expect($html)->toContain('id="ichava-app-react"')
            ->not->toContain('id="ichava-app"')
            ->toContain('vendor/ichava/assets/js/ichava-react.js')
            ->not->toContain('vendor/ichava/assets/js/ichava.js');
    });

    it('the kill switch overrides the query param with no deploy: flip the flag back off', function () {
        config(['ichava.browser.react_ui_enabled' => true]);
        expect(test()->get(route('ichava.browser', ['ui' => 'react']))->getContent())->toContain('id="ichava-app-react"');

        config(['ichava.browser.react_ui_enabled' => false]);
        expect(test()->get(route('ichava.browser', ['ui' => 'react']))->getContent())
            ->toContain('id="ichava-app"')
            ->not->toContain('id="ichava-app-react"');
    });

    it('publishes window.ichavaConfig alongside the existing window.ichavaRoutes', function () {
        $html = test()->get(route('ichava.browser'))->getContent();

        expect($html)->toContain('window.ichavaRoutes')
            ->toContain('window.ichavaConfig');
    });
});
