<x-ichava::layouts.app 
    title="Statistics" 
    headerTitle="Statistics"
    :themeToggle="true"
    :vueApp="false"
>
    <div class="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Header Actions -->
        <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-3xl font-bold text-foreground">Icon Statistics</h1>
                <p class="mt-2 text-sm text-muted-foreground">Comprehensive overview of your icon library</p>
            </div>
            <div class="flex gap-3">
                <a href="{{ route('ichava.browser') }}" 
                   class="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-accent transition-colors">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"/>
                    </svg>
                    Icon Browser
                </a>
                <form action="{{ route('ichava.cache.clear') }}" method="POST" class="inline">
                    @csrf
                    <button type="submit" 
                            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        Clear Cache
                    </button>
                </form>
            </div>
        </div>

        @if(session('success'))
            <div class="mb-6 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg p-4">
                {{ session('success') }}
            </div>
        @endif

        @if(session('error') || isset($error))
            <div class="mb-6 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4">
                {{ session('error') ?? $error }}
            </div>
        @endif

        <!-- Overall Statistics -->
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <!-- Total Icons -->
            <div class="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="p-3 bg-blue-500/10 rounded-lg">
                                <svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-muted-foreground truncate">Total Icons</dt>
                                <dd class="text-2xl font-bold text-foreground">{{ number_format($statistics['total_icons'] ?? 0) }}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total Packages -->
            <div class="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="p-3 bg-green-500/10 rounded-lg">
                                <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                                </svg>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-muted-foreground truncate">Packages</dt>
                                <dd class="text-2xl font-bold text-foreground">{{ number_format($statistics['total_packages'] ?? 0) }}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total Categories -->
            <div class="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="p-3 bg-purple-500/10 rounded-lg">
                                <svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                                </svg>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-muted-foreground truncate">Categories</dt>
                                <dd class="text-2xl font-bold text-foreground">{{ number_format($statistics['total_categories'] ?? 0) }}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total Variants -->
            <div class="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                <div class="p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="p-3 bg-orange-500/10 rounded-lg">
                                <svg class="h-6 w-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                                </svg>
                            </div>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-muted-foreground truncate">Variants</dt>
                                <dd class="text-2xl font-bold text-foreground">{{ number_format($statistics['total_variants'] ?? 0) }}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cache Status -->
        <div class="bg-card border border-border rounded-lg shadow-sm mb-8 p-6">
            <h2 class="text-lg font-medium text-foreground mb-4">Cache Status</h2>
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    @if($cacheHealthy)
                        <div class="h-3 w-3 rounded-full bg-green-500"></div>
                    @else
                        <div class="h-3 w-3 rounded-full bg-destructive"></div>
                    @endif
                </div>
                <div class="ml-3">
                    <p class="text-sm font-medium text-foreground">
                        {{ $cacheHealthy ? 'Healthy' : 'Unhealthy' }}
                    </p>
                </div>
            </div>
            @if(!empty($cacheStats))
                <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    @foreach($cacheStats as $key => $value)
                        <div class="border-t border-border pt-4">
                            <dt class="text-sm font-medium text-muted-foreground">{{ ucwords(str_replace('_', ' ', $key)) }}</dt>
                            <dd class="mt-1 text-sm text-foreground">@if(is_numeric($value)){{ number_format($value) }}@elseif(is_array($value)){{ json_encode($value) }}@else{{ $value }}@endif</dd>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>

        <!-- Package Details -->
        <div class="bg-card border border-border rounded-lg shadow-sm mb-8">
            <div class="px-6 py-5 border-b border-border">
                <h2 class="text-lg font-medium text-foreground">Packages</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-border">
                    <thead class="bg-muted/50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Package</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Icons</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Categories</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Variants</th>
                        </tr>
                    </thead>
                    <tbody class="bg-card divide-y divide-border">
                        @forelse($packageStats as $package)
                            <tr class="hover:bg-accent transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-foreground">{{ $package['label'] }}</div>
                                    <div class="text-xs text-muted-foreground">{{ $package['name'] }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {{ $package['vendor'] ?: '-' }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right font-semibold">
                                    {{ number_format($package['icon_count']) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                                    {{ number_format($package['category_count']) }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground text-right">
                                    {{ number_format($package['variant_count']) }}
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="px-6 py-8 text-center text-sm text-muted-foreground">
                                    No packages found. Run seeding to populate the database.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Top Categories -->
        <div class="bg-card border border-border rounded-lg shadow-sm">
            <div class="px-6 py-5 border-b border-border">
                <h2 class="text-lg font-medium text-foreground">Top 10 Categories</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-border">
                    <thead class="bg-muted/50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Package</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Icon Count</th>
                        </tr>
                    </thead>
                    <tbody class="bg-card divide-y divide-border">
                        @forelse($topCategories as $category)
                            <tr class="hover:bg-accent transition-colors">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-foreground">{{ $category->name }}</div>
                                    <div class="text-xs text-muted-foreground">{{ $category->slug }}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                    {{ $category->package }}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground text-right font-semibold">
                                    {{ number_format($category->icon_count) }}
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="3" class="px-6 py-8 text-center text-sm text-muted-foreground">
                                    No categories found.
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center text-sm text-muted-foreground">
            <p>Ichava Icon Management System</p>
            <p class="mt-1">Statistics updated in real-time from database</p>
        </div>
    </div>
</x-ichava::layouts.app>
