[← Docs index](../README.md#documentation)

# Architecture

*Explanation.* What `ichava/browser` ships, how it attaches to `ichava/core`, and how its middleware stack adapts to whatever the host application provides.

## What browser provides

Relocated from the README, which is now a slim pointer.

| Concern | What browser ships |
|---|---|
| Visual SPA | Vue 3 + Vite + Tailwind icon browser at `/{prefix}/icons`. Search, filter by pack/variant/category, copy-to-clipboard, theme toggle. |
| REST API | Endpoints for icons, packages, terms, preferences, command history, cache and statistics. |
| Middleware | The `ichava.api` and `ichava.web` groups, plus per-middleware aliases: `ichava.guard`, `ichava.security`, `ichava.json`, `ichava.log`, `ichava.session`, `ichava.validate`. |
| Hybrid auth | `HostCapabilities` detects Sanctum and sessions, then adapts the stack. |
| Blade views | `<x-ichava::layouts.app>` and `<x-ichava::layouts.browser>`, plus the `<x-ichava::ichava-test-icons>` and `<x-ichava::ichava-ui-icons>` demo components. |
| `ui-icons` pack | The bundled icon set the SPA itself uses. |
| Asset publish | `vendor:publish --tag=ichava-assets` copies the pre-built Vite output into `public/vendor/ichava/`. |
| `inject-npm-scripts` | Adds the `ichava:dev`, `ichava:build` and watch scripts to the host application's `package.json`. |

## The whole HTTP layer lives here, and that is the point

`ichava/core` ships **zero** HTTP surface — no routes, no middleware, no controllers. Everything that speaks HTTP is in this package.

That split is deliberate rather than tidy: it means `composer require ichava/core` alone gives a fully functional headless icon engine, usable from Blade and the CLI in an application that exposes no icon endpoints at all. Adding browser is the decision to expose them.

## Boot order

Browser boots in `bootingPackage()`, after core's services are bound. Core's provider registers its singletons and log channels in `register()`, and a child package reaching for `IconRegistry` or `IchavaLogger` before that has run gets an unbound container or a `Log [ichava] not defined`.

The practical rule for anything added here: **icon registration and logging go in `bootingPackage()`, never `registeringPackage()`.**

## Hybrid middleware, which adapts rather than assumes

`HostCapabilities` inspects what the host application actually exposes and picks a stack to match. There are three cases, and hard-coding any one of them breaks the other two:

| Host provides | Stack applied |
|---|---|
| Sanctum + sessions | the full `web` stack, with CSRF |
| Sessions only | `StartSession` plus the `ichava.*` middleware, no CSRF |
| Neither (stateless) | `ichava.*` only — treat as a public JSON API |

The third case is the one worth stating plainly: in a stateless host the API is public unless the host guards it, so an application exposing browser on the open internet needs its own authentication in front.

## The prefix is core's, not browser's

The `/{prefix}/icons` path comes from `ICHAVA_BROWSER_PREFIX` in **core's** configuration, and it is shared between core's API and this SPA. Changing it in one place moves both, which is why it lives upstream of the package that serves the routes.

## See also

- [Installation](installation.md)
- [Configuration](configuration.md)
- [API endpoints](tools/api-endpoints.md)
- [Core architecture](https://opensource.simtabi.com/documentation/ichava/core/architecture)

---

[← Docs index](../README.md#documentation)
