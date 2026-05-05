@props(['statistics' => null])

{{-- 
    Icon Browser Layout
    Uses Vue mode - the entire UI is rendered by Vue's App.vue component
--}}
<x-ichava::layouts.app 
    title="Icon Browser" 
    headerTitle="Browser"
    :vueApp="true"
>
    {{-- No slot content needed - Vue handles everything --}}
</x-ichava::layouts.app>
