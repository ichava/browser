# React 19 parallel-run entry (`ichava-react`)

This directory is the **React frontend** for `ichava/browser`, run **in parallel**
with the existing Vue SPA behind an opt-in flag. Vue stays the default and is
untouched; React mounts only for `?ui=react` when a server kill-switch allows it.

The UI itself is **not** duplicated here: it comes from the shared component
library **`@ichava/react-browser`** (the standalone repo one level up). This entry
only wires the Laravel bootstrap (`window.ichavaConfig`, CSRF, `X-Browser-Id`) into
that library.

```
react/
├─ main.tsx        mounts #ichava-app-react (inert on the Vue route), primes CSRF + fingerprint
├─ app/App.tsx     STEP-1 bootstrap: reads window.ichavaConfig; swapped for <IchavaBrowser> at the P1 data hook
└─ tsconfig.json   strict, jsx react-jsx, resolves @ichava/react-browser → ../react-browser/src
../../../../vite.react.config.ts   self-contained build → public/assets/js/ichava-react.js (+ css); never empties public/
```

## One-time wiring (small, additive: apply these)

### 1. Dependency on the shared library + React
From the package root:
```bash
npm i react@^19 react-dom@^19
npm i file:../react-browser        # links @ichava/react-browser (the sibling repo)
```

### 2. Config kill-switch: `config/ichava/browser.php`
Add under the `browser` block (env-overridable, default OFF):
```php
'react_ui_enabled' => env('ICHAVA_REACT_UI', false),
```

### 3. Blade branch: `resources/views/components/layouts/app.blade.php`
The Vue mount (`<div id="ichava-app">`, ~line 114) and the bundle `<script>`
(`asset('vendor/ichava/assets/js/ichava.js')`, ~line 188) become flag-guarded.
Compute the flag once near the top of the layout:
```blade
@php
    $useReact = config('ichava.browser.react_ui_enabled', false)
        && request()->query('ui') === 'react';
@endphp
```
Mount node:
```blade
@if ($useReact)
    <div id="ichava-app-react"></div>
@else
    <div id="ichava-app"></div>
@endif
```
Bundle load (mirror the existing `assetVersion()` cache-bust, single CSS + JS):
```blade
@if ($useReact)
    <link rel="stylesheet" href="{{ asset('vendor/ichava/assets/css/ichava-react.css') }}?v={{ \Simtabi\Laranail\Ichava\Support\Helpers::assetVersion('vendor/ichava/assets/css/ichava-react.css') }}">
    <script type="module" src="{{ asset('vendor/ichava/assets/js/ichava-react.js') }}?v={{ \Simtabi\Laranail\Ichava\Support\Helpers::assetVersion('vendor/ichava/assets/js/ichava-react.js') }}"></script>
@else
    {{-- ...existing Vue ichava.css / ichava.js load, unchanged... --}}
@endif
```
`window.ichavaConfig`, `window.ichavaRoutes`, and the `<meta name="csrf-token">`
are already injected for both mounts: no change needed there. Emit the browser
route as `Cache-Control: no-store` so an edge cache can't serve the wrong shell.

## Build & verify
```bash
npx vite build --config vite.react.config.ts        # → public/assets/js/ichava-react.js (+ css)
php artisan vendor:publish --tag=ichava-assets --force
```
- `/ichava/icons` → Vue, unchanged.
- `/ichava/icons?ui=react` (with `ICHAVA_REACT_UI=true`) → React mount; the screen
  reports the package/category counts from `window.ichavaConfig` and the
  `X-Browser-Id`.
- **Parity gate:** capture `X-Browser-Id` from a real API request in both apps in
  the same browser: they MUST be byte-identical (existing users' favorites/
  collections/history key on it).
- Kill switch: `ICHAVA_REACT_UI=false` → `?ui=react` falls back to Vue, no deploy.

## Status
STEP-1 (parallel-run mount + bootstrap flow) is wired. The full grid renders here
once the **REST data hook** is added to the library (`RestCatalog(/ichava/api)` fed
into `<IchavaBrowser>` with server pagination): plan phase P1. Until then this
entry proves the boundary without shipping a fake grid.
