# React 19 parallel-run entry (`ichava-react`)

This directory is the **React frontend** for `ichava/browser`, run **in parallel**
with the existing Vue SPA behind an opt-in flag. Vue stays the default and is
untouched; React mounts only for `?ui=react` when a server kill-switch allows it.

The UI itself is **not** duplicated here: it comes from the shared component
library **`@ichava/react-browser`** (the standalone repo one level up). This entry
only wires the Laravel bootstrap (`window.ichavaConfig`, CSRF, `X-Browser-Id`) and
the REST data source into that library.

```
react/
├─ main.tsx        mounts #ichava-app-react (inert on the Vue route), primes CSRF +
│                  fingerprint, and hands the library a RestCatalog client pointed
│                  at /ichava/api
└─ tsconfig.json   strict, jsx react-jsx, resolves @ichava/react-browser → ../react-browser/src
                    (plus a matching @/* alias for the library's own internal imports)
../../../../vite.react.config.ts   self-contained build → public/assets/js/ichava-react.js (+ css); never empties public/
```

## Data source: REST, not a preloaded catalog

`ichava/bundled-icons` alone ships 121,314 icons -- there is no "load everything
into a window global" step here the way the standalone demo's fixture catalog has.
`main.tsx` mounts `<IchavaBrowser client={createCatalog('rest', {base: apiBase})}>`
instead of the static `catalog` prop; the library's `RestCatalog` drives every
listing, filter, tree, and detail view off the same `/ichava/api/icons*` endpoints
the Vue app already uses, with server-side pagination and debounced, cancellable
fetches.

## Wiring (done)

1. **Dependencies** -- `browser/package.json` carries `react`/`react-dom` pinned to
   the exact same range as `react-browser/package.json` (avoids a duplicate React
   instance), plus `@ichava/react-browser: file:../react-browser`,
   `@vitejs/plugin-react`, and `@types/react(-dom)`. `@vitejs/plugin-react` is
   pinned to a version whose peer range covers this package's existing
   `vite: ^7.2.4` (the Vue build's version) -- react-browser itself is on Vite 8,
   but that's a devDependency and doesn't need to match across sibling packages
   the way the `react`/`react-dom` runtime versions do.
2. **Config kill-switch** -- `config/browser.php` carries
   `'react_ui_enabled' => env('ICHAVA_REACT_UI', false)`.
3. **Blade branch** -- `resources/views/components/layouts/app.blade.php` computes
   `$useReact = $vueApp && config('ichava.browser.react_ui_enabled', false) &&
   request()->query('ui') === 'react'` once near the top, then branches the mount
   node (`#ichava-app-react` vs `#ichava-app`) and the bundle `<script>`/`<link>`
   tags on it. `window.ichavaRoutes` and `window.ichavaConfig` are both injected
   in the `<head>` for every mount mode.

Covered by `browser/tests/Feature/Web/ReactUiGateTest.php` (flag × query-param
combinations, kill-switch override, `window.ichavaConfig` injection).

## Build & verify
```bash
npm install                                          # resolves react/react-dom/@ichava/react-browser
npx vite build --config vite.react.config.ts          # → public/assets/js/ichava-react.js (+ css)
php artisan vendor:publish --tag=ichava-assets --force
```
- `/ichava/icons` → Vue, unchanged.
- `/ichava/icons?ui=react` (with `ICHAVA_REACT_UI=true`) → React mount, browsing
  the real corpus via `RestCatalog`.
- **Parity gate:** capture `X-Browser-Id` from a real API request in both apps in
  the same browser: they MUST be byte-identical (existing users' favorites/
  collections/history key on it).
- Kill switch: `ICHAVA_REACT_UI=false` → `?ui=react` falls back to Vue, no deploy.

## Status
Wired end-to-end: the React mount, the Laravel kill-switch, and REST-mode data
fetching across every component that reads from `useRepo` (grid, filters, tree,
command palette, detail dialog, library/collections, shared collections). Search
quality (indexed/fuzzy, server-mirrored) and the tree endpoint's own filter
support are explicitly out of scope here -- see `PLAN.md` R-P13.
