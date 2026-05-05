# Contributing to Ichava Browser

This package is the Vue/Vite SPA + Blade UI layer of the Ichava ecosystem. Contribution process, coding standards, branch conventions, and review workflow are shared with the core package.

→ See **[ichava/core CONTRIBUTING.md](https://github.com/ichava/core/blob/main/CONTRIBUTING.md)** for the full guide.

## Package-specific notes

- PHP tests run with `vendor/bin/pest`.
- Frontend dev: `npm install`, then `npm run dev` (Vite dev server, port 5174).
- Production build: `npm run build:prod`. Output goes to `public/assets/` and is published via `vendor:publish --tag=ichava-assets`.
- The SPA reads from core's REST API (`/{prefix}/api/...`). Run a host app with both `ichava/core` and `ichava/browser` installed for end-to-end testing.
- Class short names use the constant convention: `IchavaBrowserServiceProvider`, `IchavaTestIconComponent`, etc. Browser-only classes live under the `Simtabi\Laranail\Ichava\Browser\` namespace.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `perf:`, `test:`).

## Reporting issues

Use the [issue tracker](https://github.com/ichava/browser/issues). Security issues go to **security@simtabi.com** privately.
