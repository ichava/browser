{{--
Ichava Icon Browser - Vue.js Application (Botble Pattern)

The Vue app reads initial data from window.ichavaConfig and renders
the v-icon-browser component with runtime template compilation.
--}}
<x-ichava::layouts.app 
    title="Icon Browser" 
    :hideHeader="true"
>
    {{-- Vue app mounts here and renders v-icon-browser via template --}}
    {{-- Initial data passed via window.ichavaConfig below --}}

    {{-- Page Configuration (injected into head via @stack) --}}
    @push('head-scripts')
    <script>
        // Ichava Configuration Object (available before Vue initialization)
        // Vue app reads this data and passes to v-icon-browser component
        window.ichavaConfig = {
            routes: {
                icons: "{{ route('ichava.api.icons.index') }}",
                filters: "{{ route('ichava.api.icons.filters') }}",
                statistics: "{{ route('ichava.api.icons.statistics') }}",
                tree: "{{ route('ichava.api.icons.tree') }}",
                packages: "{{ route('ichava.api.packages.index') }}",
                preferences: "{{ route('ichava.api.preferences.index') }}",
            },
            // Initial data from server (hydration)
            packages: @json($packages ?? []),
            categories: @json($categories ?? []),
            preferences: @json($preferences ?? []),
            statistics: @json($statistics ?? null),
            user: @json(auth()->user() ?? null),
        };
    </script>
    @endpush
</x-ichava::layouts.app>
