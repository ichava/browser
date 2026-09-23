<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Ichava') }}</title>

    @php
        use Simtabi\Laranail\Ichava\Support\Helpers;
        $viteDev = config('ichava.icon-browser.vite_dev_mode', true) && config('app.debug');
        $viteHost = config('ichava.icon-browser.vite.host', 'localhost');
        $vitePort = config('ichava.icon-browser.vite.port', 5174);
        $viteBase = "http://{$viteHost}:{$vitePort}";
        $viteClient = "{$viteBase}/@vite/client";
    @endphp

    @if($viteDev)
        <script type="module">
            import RefreshRuntime from '{{ $viteBase }}/@react-refresh';
            RefreshRuntime.injectIntoGlobalHook(window);
            window.$RefreshReg$ = () => {};
            window.$RefreshSig$ = () => (type) => type;
            window.__vite_plugin_react_preamble_installed__ = true;
        </script>
        <script type="module" src="{{ $viteClient }}"></script>
        <script type="module" src="{{ $viteBase }}/resources/js/app.tsx"></script>
    @else
        <link rel="stylesheet" href="{{ asset('vendor/ichava/assets/css/inertia-app.css') }}?v={{ Helpers::assetVersion('vendor/ichava/assets/css/inertia-app.css') }}">
    @endif

    @inertiaHead

    <style>
        #app { display: flex; flex-direction: column; flex: 1 0 auto; min-height: 100dvh; }
    </style>
</head>
<body class="antialiased h-full bg-white text-gray-900 dark:bg-[#0a0d1a] dark:text-gray-100">
    <div class="flex min-h-dvh flex-col">
        @inertia
    </div>

    @if(! $viteDev)
        <script src="{{ asset('vendor/ichava/assets/js/inertia-app.js') }}?v={{ Helpers::assetVersion('vendor/ichava/assets/js/inertia-app.js') }}" type="module"></script>
    @endif
</body>
</html>
