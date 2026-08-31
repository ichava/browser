<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip'
import { useIchava } from '@/ichava-ts'

const { 
  searchQuery,
  setSearchQuery,
  packageSearchQuery,
  categorySearchQuery,
  setPackageSearch,
  setCategorySearch,
  setSearchScope,
  searchScope: globalSearchScope,
  packages,
  categories,
  filteredCount,
  isDark 
} = useIchava()

// Search scopes with icons
const scopes = [
  { value: 'all', label: 'All', description: 'Search everything' },
  { value: 'icons', label: 'Icons', description: 'Search icon names' },
  { value: 'packages', label: 'Packages', description: 'Search packages' },
  { value: 'categories', label: 'Categories', description: 'Search categories' }
]

const localSearch = ref('')
const searchScope = ref<'all' | 'icons' | 'packages' | 'categories'>('icons')

// Sync with global scope
watch(globalSearchScope, (newVal) => {
  if (newVal !== searchScope.value) {
    searchScope.value = newVal
  }
})

// Sync local search with appropriate global search based on scope
watch(searchScope, () => {
  // Reset local search when scope changes
  localSearch.value = ''
  clearSearch()
})

watch(searchQuery, (newVal) => {
  if (searchScope.value === 'icons' || searchScope.value === 'all') {
    if (newVal !== localSearch.value) {
      localSearch.value = newVal || ''
    }
  }
})

watch(packageSearchQuery, (newVal) => {
  if (searchScope.value === 'packages' || searchScope.value === 'all') {
    if (newVal !== localSearch.value) {
      localSearch.value = newVal || ''
    }
  }
})

watch(categorySearchQuery, (newVal) => {
  if (searchScope.value === 'categories' || searchScope.value === 'all') {
    if (newVal !== localSearch.value) {
      localSearch.value = newVal || ''
    }
  }
})

// Get current scope info
const currentScope = computed(() => 
  scopes.find(s => s.value === searchScope.value) || scopes[1]
)

// Debounced search handler
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearchInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  localSearch.value = value

  if (searchTimeout) clearTimeout(searchTimeout)
  
  searchTimeout = setTimeout(() => {
    switch (searchScope.value) {
      case 'all':
        setSearchQuery(value)
        setPackageSearch(value)
        setCategorySearch(value)
        break
      case 'icons':
        setSearchQuery(value)
        break
      case 'packages':
        setPackageSearch(value)
        break
      case 'categories':
        setCategorySearch(value)
        break
    }
  }, 300)
}

function clearSearch() {
  localSearch.value = ''
  setSearchQuery('')
  setPackageSearch('')
  setCategorySearch('')
}

function handleScopeChange() {
  setSearchScope(searchScope.value)
}

// Calculate match counts
const matchCounts = computed(() => {
  if (!localSearch.value.trim()) {
    return {
      icons: 0,
      packages: 0,
      categories: 0,
      total: 0
    }
  }

  const search = localSearch.value.toLowerCase()
  
  const iconMatches = searchScope.value === 'icons' || searchScope.value === 'all' 
    ? filteredCount.value || 0 
    : 0
  
  const packageMatches = packages.value.filter(pkg => 
    pkg.name.toLowerCase().includes(search) ||
    pkg.description?.toLowerCase().includes(search)
  ).length
  
  let categoryMatches = 0
  categories.value.forEach(group => {
    group.categories?.forEach((cat: any) => {
      if (cat.name.toLowerCase().includes(search)) categoryMatches++
      if (cat.subcategories) {
        cat.subcategories.forEach((sub: any) => {
          if (sub.name.toLowerCase().includes(search)) categoryMatches++
        })
      }
    })
  })
  
  return {
    icons: iconMatches,
    packages: packageMatches,
    categories: categoryMatches,
    total: iconMatches + packageMatches + categoryMatches
  }
})
</script>

<template>
  <TooltipProvider>
    <div class="flex items-center gap-2 w-full">
      <!-- Unified Search Input Group -->
      <div class="flex-1">
        <div 
          class="flex items-center rounded-lg border transition-all overflow-hidden focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500"
          :class="isDark 
            ? 'bg-[#151823] border-[#1e2235]' 
            : 'bg-white border-gray-200'"
        >
          <!-- Scope Selector (Left) -->
          <div class="relative flex items-center shrink-0 border-r" :class="isDark ? 'border-[#1e2235]' : 'border-gray-200'">
            <select
              v-model="searchScope"
              @change="handleScopeChange"
              aria-label="Search Scope"
              class="appearance-none py-2 pl-3 pr-8 text-sm focus:outline-none transition-colors cursor-pointer border-0"
              :class="isDark
                ? 'bg-transparent text-gray-400 hover:text-gray-300'
                : 'bg-transparent text-gray-500 hover:text-gray-700'"
            >
              <option v-for="scope in scopes" :key="scope.value" :value="scope.value">
                {{ scope.label }}
              </option>
            </select>
            <svg 
              viewBox="0 0 16 16" 
              fill="currentColor" 
              aria-hidden="true" 
              class="pointer-events-none absolute right-2 size-4"
              :class="isDark ? 'text-gray-500' : 'text-gray-400'"
            >
              <path 
                d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" 
                clip-rule="evenodd" 
                fill-rule="evenodd" 
              />
            </svg>
          </div>

          <!-- Search Input (Center) -->
          <input
            data-unified-search
            type="text"
            :value="localSearch"
            @input="handleSearchInput"
            :placeholder="`Search ${currentScope.label.toLowerCase()}...`"
            class="block min-w-0 grow py-2 px-3 text-sm focus:outline-none border-0"
            :class="isDark
              ? 'bg-transparent text-gray-200 placeholder-gray-500'
              : 'bg-transparent text-gray-900 placeholder-gray-400'"
          />

          <!-- Clear Button (when searching) -->
          <button
            v-if="localSearch"
            @click="clearSearch"
            class="shrink-0 p-1.5 mr-1 rounded-md transition-colors"
            :class="isDark ? 'hover:bg-[#1e2235] text-gray-500 hover:text-gray-400' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-500'"
          >
            <X :size="16" />
          </button>

          <!-- Search Icon (Right) -->
          <div class="shrink-0 pr-3 select-none">
            <Search
              :size="16"
              :class="isDark ? 'text-gray-500' : 'text-gray-400'" 
            />
          </div>
        </div>
      </div>

      <!-- Match Counter (visible when searching) -->
      <div
        v-if="localSearch.trim() && matchCounts.total > 0"
        class="text-xs font-medium px-3 py-2 rounded-lg whitespace-nowrap"
        :class="isDark 
          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
          : 'bg-purple-50 text-purple-600 border border-purple-200'"
      >
        <span class="font-semibold">{{ matchCounts.total }}</span>
        <span class="ml-1">{{ matchCounts.total === 1 ? 'match' : 'matches' }}</span>
      </div>
    </div>
  </TooltipProvider>
</template>
