<?php

declare(strict_types=1);

/**
 * The shipped config must merge at `vendor.package`, and nothing else asserts it.
 *
 * `HasConfigNamespace` appends the config *filename* whenever it differs from
 * the package short name, so `config/browser.php` under a package named
 * `ichava/icon-browser` would merge at `ichava.icon-browser.browser.*` while
 * every read site used `ichava.icon-browser.*`. Every one of them would return
 * null and fall through to a plausible-looking default -- which is V39, the
 * defect that made core's entire shipped config inert for months, and which
 * neither the tests nor CI noticed because both ran against the same defaults
 * the production code fell through to.
 *
 * A test that calls `config()->set()` cannot catch this: it writes the key it
 * then reads. Only the *shipped file* resolving proves the merge.
 */
it('merges the shipped config file at ichava.icon-browser', function (): void {
    expect(config('ichava.icon-browser'))->toBeArray()->not->toBeEmpty();

    // A value that exists only in the shipped file -- no test sets it.
    expect(config('ichava.icon-browser.rate_limiting'))->toBeArray();

    // The doubled key is what the defect produces. It must not exist.
    expect(config('ichava.icon-browser.icon-browser'))->toBeNull();

    // And the pre-rename key must be gone rather than shadowing.
    expect(config('ichava.browser'))->toBeNull();
});
