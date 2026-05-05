@props([
    'title' => 'Icon Browser',
    'defaultTheme' => 'dark',
    'hideHeader' => true,
    'headerTitle' => 'Browser',
    'themeToggle' => true,
    'vueApp' => true, // When true, Vue controls the entire UI. When false, renders Blade content.
])

@php
    // Get preferences from session for initial theme (prevents flash of wrong theme)
    $preferences = app(\Simtabi\Laranail\Ichava\Services\IconPreferenceService::class)->getAll();
    $isDark = $preferences['preferences']['is_dark'] ?? true;
    $themeClass = $isDark ? 'dark' : '';
@endphp
    <!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="{{ $themeClass }} h-full" data-theme="{{ $isDark ? 'dark' : 'light' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ $title }} - Ichava</title>

    {{-- Compiled Ichava Styles (includes FULL Tailwind CSS + shadcn-vue + custom SCSS) --}}
    <link rel="stylesheet" href="{{ asset('vendor/ichava/assets/css/ichava.css') }}?v={{ \Simtabi\Laranail\Ichava\Support\Helpers::assetVersion('vendor/ichava/assets/css/ichava.css') }}">

    {{-- Additional page-specific styles --}}
    {{ $styles ?? '' }}
    @stack('styles')

    {{-- Additional page-specific head scripts --}}
    @stack('head-scripts')

    {{-- Initial theme script to prevent flash --}}
    <script>
        (function() {
            const stored = localStorage.getItem('ichava_preferences');
            if (stored) {
                try {
                    const prefs = JSON.parse(stored);
                    const isDark = prefs?.preferences?.is_dark ?? {{ $isDark ? 'true' : 'false' }};
                    document.documentElement.classList.toggle('dark', isDark);
                    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                } catch (e) {}
            }
        })();
    </script>

    {{-- Laravel Routes for Vue --}}
    @php
        $ichavaRoutes = [
            // Web routes
            'ichava.browser' => route('ichava.browser'),
            'ichava.stats' => route('ichava.stats'),
            'ichava.cache.clear' => route('ichava.cache.clear'),
            'ichava.cache.rebuild' => route('ichava.cache.rebuild'),
            
            // Icons API
            'ichava.api.icons' => route('ichava.api.icons.index'),
            'ichava.api.icons.index' => route('ichava.api.icons.index'),
            'ichava.api.icons.show' => route('ichava.api.icons.show', ['id' => '__ID__']),
            'ichava.api.icons.svg' => route('ichava.api.icons.svg', ['id' => '__ID__']),
            'ichava.api.icons.filters' => route('ichava.api.icons.filters'),
            'ichava.api.icons.tree' => route('ichava.api.icons.tree'),
            'ichava.api.icons.statistics' => route('ichava.api.icons.statistics'),
            
            // Packages API
            'ichava.api.packages' => route('ichava.api.packages.index'),
            'ichava.api.packages.index' => route('ichava.api.packages.index'),
            
            // Terms API (categories, variants)
            'ichava.api.categories' => route('ichava.api.terms.categories'),
            'ichava.api.terms.categories' => route('ichava.api.terms.categories'),
            'ichava.api.terms.variants' => route('ichava.api.terms.variants'),
            'ichava.api.terms.hierarchy' => route('ichava.api.terms.hierarchy'),
            
            // Favorites API
            'ichava.api.favorites' => route('ichava.api.favorites.index'),
            'ichava.api.favorites.index' => route('ichava.api.favorites.index'),
            'ichava.api.favorites.toggle' => route('ichava.api.favorites.toggle', ['iconId' => '__ID__']),
            
            // Collections API
            'ichava.api.collections' => route('ichava.api.collections.index'),
            'ichava.api.collections.index' => route('ichava.api.collections.index'),
            
            // History API
            'ichava.api.history' => route('ichava.api.history.index'),
            'ichava.api.history.index' => route('ichava.api.history.index'),
            
            // Preferences API
            'ichava.api.preferences' => route('ichava.api.preferences.index'),
            'ichava.api.preferences.index' => route('ichava.api.preferences.index'),
            
            // Command History API
            'ichava.api.commandHistory' => route('ichava.api.commandHistory.index'),
            'ichava.api.commandHistory.index' => route('ichava.api.commandHistory.index'),
            
            // Cache API
            'ichava.api.cache.stats' => route('ichava.api.cache.stats'),
        ];
    @endphp
    <script>
        window.ichavaRoutes = @json($ichavaRoutes);
    </script>
</head>
<body class="antialiased h-full bg-white text-gray-900 dark:bg-[#0a0d1a] dark:text-gray-100">

    @if($vueApp)
        {{-- 
            VUE APP MODE
            Vue controls the entire UI (icon browser)
        --}}
        <div id="ichava-app">
            {{-- Vue app mounts here and renders full UI --}}
                </div>
    @else
        {{-- 
            BLADE CONTENT MODE  
            Server-rendered pages with optional Vue enhancements
        --}}
        <div class="min-h-screen">
            {{-- Simple header for non-Vue pages --}}
            <header class="sticky top-0 z-40 w-full border-b {{ $isDark ? 'border-[#1e2235] bg-[#0a0d1a]' : 'border-gray-200 bg-white' }}">
                <div class="flex h-14 items-center px-6">
                    <div class="flex items-center gap-4 flex-1">
                        <a href="{{ route('ichava.browser') }}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <span class="text-lg font-semibold text-purple-400">Ichava</span>
                            <span class="text-lg font-normal {{ $isDark ? 'text-gray-400' : 'text-gray-500' }}">{{ $headerTitle }}</span>
                        </a>
                    </div>
                    <div class="flex items-center gap-2">
                        @if($themeToggle)
                            <button 
                                onclick="toggleTheme()" 
                                class="p-2 rounded-lg transition-colors {{ $isDark ? 'hover:bg-[#151823] text-gray-400' : 'hover:bg-gray-100 text-gray-500' }}"
                                title="Toggle theme"
                            >
                                <svg class="w-5 h-5 {{ $isDark ? 'hidden' : '' }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                                </svg>
                                <svg class="w-5 h-5 {{ $isDark ? '' : 'hidden' }}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                                </svg>
                            </button>
                        @endif
                        <a 
                            href="{{ route('ichava.browser') }}" 
                            class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors {{ $isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white' }}"
                        >
                            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"/>
                                </svg>
                            Browse Icons
                        </a>
                    </div>
            </div>
        </header>

            {{-- Main content area --}}
            <main class="flex-1">
                {{ $slot }}
            </main>
        </div>

        {{-- Theme toggle script for non-Vue pages --}}
        <script>
            function toggleTheme() {
                const html = document.documentElement;
                const isDark = html.classList.contains('dark');
                html.classList.toggle('dark', !isDark);
                html.setAttribute('data-theme', isDark ? 'light' : 'dark');
                
                // Persist preference
                try {
                    const stored = localStorage.getItem('ichava_preferences');
                    const prefs = stored ? JSON.parse(stored) : { preferences: {} };
                    prefs.preferences = prefs.preferences || {};
                    prefs.preferences.is_dark = !isDark;
                    localStorage.setItem('ichava_preferences', JSON.stringify(prefs));
                } catch (e) {}
            }
        </script>
    @endif

    @if($vueApp)
        {{-- Ichava Vue.js Application (only for Vue mode) --}}
<script src="{{ asset('vendor/ichava/assets/js/ichava.js') }}?v={{ \Simtabi\Laranail\Ichava\Support\Helpers::assetVersion('vendor/ichava/assets/js/ichava.js') }}" type="module"></script>
    @endif

{{ $scripts ?? '' }}
@stack('scripts')
</body>
</html>
