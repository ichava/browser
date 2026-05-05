<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronRight,
  ChevronDown,
  Check,
  Package,
  FolderOpen,
  Folder,
  Settings,
  Home,
  Users,
  FolderClosed,
  Calendar,
  FileText,
  PieChart,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useIchava, useRoute } from '@/ichava-ts'

const {
  packages,
  selectedPackageIds,
  selectedCategoryIds,
  packageSearchQuery,
  categorySearchQuery,
  togglePackage,
  toggleCategory,
  selectAllPackages,
  clearAllPackages,
  filteredCount,
  totalIconCount,
  loadedIconCount,
  favoritesCount,
  getCategoriesForPackage,
  formatNumber,
  isDark,
  collections,
} = useIchava()

// Route helper
const { route } = useRoute()

// Get browser route URL
const browserRoute = route('ichava.browser')

// Navigation items
const navigation = ref([
  { name: 'Dashboard', icon: Home, href: '#', current: true },
  { name: 'Team', icon: Users, href: '#', current: false },
  { name: 'Projects', icon: FolderClosed, href: '#', current: false },
  { name: 'Calendar', icon: Calendar, href: '#', current: false },
  { name: 'Documents', icon: FileText, href: '#', current: false },
  { name: 'Reports', icon: PieChart, href: '#', current: false },
])

// Teams (mapped to collections with first letter avatars)
const teams = computed(() =>
  collections.value.slice(0, 3).map(col => ({
    id: col.id,
    name: col.name,
    initial: col.name.charAt(0).toUpperCase(),
    color: col.color,
    href: '#'
  }))
)

// Emit events
const emit = defineEmits<{
  'open-settings': []
}>()

const expandedPackages = ref<Set<string>>(new Set())
const expandedCategories = ref<Set<string>>(new Set())

function togglePackageExpansion(packageId: string) {
  if (expandedPackages.value.has(packageId)) {
    expandedPackages.value.delete(packageId)
  } else {
    expandedPackages.value.add(packageId)
  }
}

function toggleCategoryExpansion(categoryId: string) {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

function isPackageExpanded(packageId: string) {
  return expandedPackages.value.has(packageId)
}

function isCategoryExpanded(categoryId: string) {
  return expandedCategories.value.has(categoryId)
}

// Check if category matches search term (recursive)
function categoryMatchesSearch(category: any, search: string): boolean {
  if (category.name.toLowerCase().includes(search)) return true
  if (category.subcategories) {
    return category.subcategories.some((sub: any) =>
      sub.name.toLowerCase().includes(search)
    )
  }
  return false
}

// Get filtered categories for a package
function getFilteredCategoriesForPackage(packageId: string) {
  const categories = getCategoriesForPackage(packageId)

  // Use global package or category search
  const searchQuery = packageSearchQuery.value || categorySearchQuery.value
  if (!searchQuery) return categories

  const search = searchQuery.toLowerCase()
  return categories.filter((cat: any) => categoryMatchesSearch(cat, search))
}

// Filter and sort packages
const filteredPackages = computed(() => {
  let result = [...packages.value]

  // Use global package or category search
  const searchQuery = packageSearchQuery.value || categorySearchQuery.value
  if (searchQuery) {
    const search = searchQuery.toLowerCase()
    result = result.filter(pkg => {
      const pkgNameMatches = pkg.name.toLowerCase().includes(search) ||
                            pkg.description?.toLowerCase().includes(search)

      const categories = getCategoriesForPackage(pkg.id)
      const hasMatchingCategories = categories.some((cat: any) =>
        categoryMatchesSearch(cat, search)
      )

      return pkgNameMatches || hasMatchingCategories
    })

    // Auto-expand packages that have matching categories
    result.forEach(pkg => {
      const categories = getCategoriesForPackage(pkg.id)
      if (categories.some((cat: any) => categoryMatchesSearch(cat, search))) {
        expandedPackages.value.add(pkg.id)
      }
    })
  }

  return result.sort((a, b) => {
    const nameA = a.name.split('/').pop()?.toLowerCase() || a.name.toLowerCase()
    const nameB = b.name.split('/').pop()?.toLowerCase() || b.name.toLowerCase()
    return nameA.localeCompare(nameB)
  })
})

function hasSubcategories(category: any) {
  return category.subcategories && category.subcategories.length > 0
}

function getPackageDisplayName(name: string): string {
  return name.split('/').pop() || name
}
</script>

<template>
  <TooltipProvider>
    <aside
      class="w-64 border-r flex flex-col theme-transition h-full"
      :class="isDark ? 'bg-[#0a0d1a] border-[#1e2235]' : 'bg-white border-gray-200'"
    >
      <!-- Logo Section (Fixed at top) -->
      <div class="flex h-16 shrink-0 items-center px-6 border-b theme-transition"
           :class="isDark ? 'border-[#1e2235]' : 'border-gray-200'">
        <a :href="browserRoute"
           class="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600" alt="Ichava" class="h-8 w-auto" :class="isDark ? 'hidden' : ''" />
          <img src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Ichava" class="h-8 w-auto" :class="isDark ? '' : 'hidden'" />
        </a>
      </div>

      <!-- Navigation Section -->
      <nav class="flex flex-col px-4 py-4 border-b theme-transition" :class="isDark ? 'border-[#1e2235]' : 'border-gray-200'">
        <ul role="list" class="space-y-1">
          <li v-for="item in navigation" :key="item.name">
            <a
              :href="item.href"
              :class="[
                item.current
                  ? (isDark ? 'bg-white/5 text-white' : 'bg-gray-50 text-indigo-600')
                  : (isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'),
                'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'
              ]"
            >
              <component
                :is="item.icon"
                :class="[
                  item.current ? (isDark ? 'text-white' : 'text-indigo-600') : (isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-400 group-hover:text-indigo-600'),
                  'h-5 w-5 shrink-0'
                ]"
                aria-hidden="true"
              />
              {{ item.name }}
            </a>
          </li>
        </ul>

        <!-- Your teams -->
        <div v-if="teams.length > 0" class="mt-6">
          <div class="text-xs font-semibold uppercase tracking-wider mb-2" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Your teams</div>
          <ul role="list" class="space-y-1">
            <li v-for="team in teams" :key="team.id">
              <a
                :href="team.href"
                :class="[
                  isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                  'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'
                ]"
              >
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-lg text-[0.625rem] font-medium"
                  :class="isDark 
                    ? 'border border-white/10 bg-white/5 text-gray-400 group-hover:border-white/20 group-hover:text-white' 
                    : 'border border-gray-200 bg-white text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600'"
                  :style="team.color ? { backgroundColor: team.color + '20', borderColor: team.color, color: team.color } : {}"
                >
                  {{ team.initial }}
                </span>
                <span class="truncate">{{ team.name }}</span>
              </a>
            </li>
          </ul>
        </div>

        <!-- Settings Link -->
        <div class="mt-4">
          <a
            href="#"
            @click.prevent="emit('open-settings')"
            :class="[
              isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
              'group flex gap-x-3 rounded-md p-2 text-sm font-semibold'
            ]"
          >
            <Settings
              :class="[
                isDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-400 group-hover:text-indigo-600',
                'h-5 w-5 shrink-0'
              ]"
              aria-hidden="true"
            />
            Settings
          </a>
        </div>
      </nav>

      <!-- Scrollable Packages Section -->
      <ScrollArea class="flex-1">
        <div class="p-4 pb-2">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-semibold uppercase tracking-wider theme-text-muted">
              Packages
              <span class="ml-2 text-purple-400">{{ packages.length }}</span>
            </h3>
            <div class="flex gap-1">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    @click="selectAllPackages"
                    class="text-xs theme-text-muted hover:text-purple-400 transition-colors px-2 py-1 rounded"
                    :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
                  >
                    All
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Select all packages</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    @click="clearAllPackages"
                    class="text-xs theme-text-muted hover:text-purple-400 transition-colors px-2 py-1 rounded"
                    :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
                  >
                    Clear
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Deselect all packages</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div class="space-y-1">
            <div v-for="pkg in filteredPackages" :key="pkg.id" class="space-y-1">
              <!-- Package Header -->
              <div class="flex items-center group">
                <Tooltip v-if="getFilteredCategoriesForPackage(pkg.id).length > 0">
                  <TooltipTrigger as-child>
                    <button
                      @click="togglePackageExpansion(pkg.id)"
                      class="p-1 rounded transition-colors flex-shrink-0"
                      :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
                    >
                      <ChevronDown
                        v-if="isPackageExpanded(pkg.id)"
                        :size="12"
                        class="theme-text-muted"
                      />
                      <ChevronRight
                        v-else
                        :size="12"
                        class="theme-text-muted"
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Expand categories</p>
                  </TooltipContent>
                </Tooltip>
                <div v-else class="w-5" />

                <Tooltip>
                  <TooltipTrigger as-child>
                    <button
                      @click="togglePackage(pkg.id)"
                      class="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors"
                      :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
                    >
                      <div
                        class="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all"
                        :class="selectedPackageIds.includes(pkg.id)
                          ? 'bg-purple-500 border-purple-500'
                          : isDark ? 'border-gray-600' : 'border-gray-300'"
                      >
                        <Check v-if="selectedPackageIds.includes(pkg.id)" :size="12" class="text-white" />
                      </div>
                      <Package :size="16" class="theme-text-muted flex-shrink-0" />
                      <div class="flex-1 min-w-0 text-left">
                        <div class="text-sm font-medium theme-text-primary truncate">
                          {{ getPackageDisplayName(pkg.name) }}
                        </div>
                      </div>
                      <span class="text-xs theme-text-muted">{{ formatNumber(pkg.count) }}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{{ selectedPackageIds.includes(pkg.id) ? 'Deselect' : 'Select' }} {{ getPackageDisplayName(pkg.name) }}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <!-- Categories (Expanded) -->
              <div
                v-if="isPackageExpanded(pkg.id) && getFilteredCategoriesForPackage(pkg.id).length > 0"
                class="ml-5 border-l pl-2 space-y-0.5 py-1"
                :class="isDark ? 'border-[#1e2235]' : 'border-gray-200'"
              >
                <template v-for="category in getFilteredCategoriesForPackage(pkg.id)" :key="category.id">
                  <!-- Category with subcategories -->
                  <div v-if="hasSubcategories(category)" class="space-y-0.5">
                    <div class="flex items-center group">
                      <button
                        @click="toggleCategoryExpansion(category.id)"
                        class="p-1 rounded transition-colors flex-shrink-0"
                        :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
                      >
                        <ChevronDown
                          v-if="isCategoryExpanded(category.id)"
                          :size="12"
                          class="theme-text-muted"
                        />
                        <ChevronRight
                          v-else
                          :size="12"
                          class="theme-text-muted"
                        />
                      </button>

                      <Tooltip>
                        <TooltipTrigger as-child>
                          <button
                            @click="toggleCategory(category.id)"
                            class="flex-1 flex items-center gap-2 px-2 py-1 rounded transition-colors"
                            :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
                          >
                            <FolderOpen v-if="isCategoryExpanded(category.id)" :size="14" class="text-purple-400 flex-shrink-0" />
                            <Folder v-else :size="14" class="theme-text-muted flex-shrink-0" />
                            <span class="text-xs flex-1 text-left truncate theme-text-muted">
                              {{ category.name }}
                            </span>
                            <span class="text-xs theme-text-muted">{{ category.count }}</span>
                            <div
                              class="w-3 h-3 rounded-full border flex-shrink-0 transition-all"
                              :class="selectedCategoryIds.includes(category.id)
                                ? 'border-purple-500 bg-purple-500'
                                : isDark ? 'border-gray-600' : 'border-gray-300'"
                            />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{{ selectedCategoryIds.includes(category.id) ? 'Deselect' : 'Select' }} {{ category.name }}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <!-- Subcategories -->
                    <div
                      v-if="isCategoryExpanded(category.id)"
                      class="ml-5 border-l pl-2 space-y-0.5"
                      :class="isDark ? 'border-[#1e2235]' : 'border-gray-200'"
                    >
                      <button
                        v-for="subcat in category.subcategories"
                        :key="subcat.id"
                        @click="toggleCategory(subcat.id)"
                        class="w-full flex items-center gap-2 px-2 py-1 rounded transition-colors group"
                        :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
                      >
                        <Folder :size="12" class="theme-text-muted flex-shrink-0" />
                        <span class="text-xs flex-1 text-left truncate theme-text-muted">
                          {{ subcat.name }}
                        </span>
                        <span class="text-xs theme-text-muted">{{ subcat.count }}</span>
                        <div
                          class="w-3 h-3 rounded-full border flex-shrink-0 transition-all"
                          :class="selectedCategoryIds.includes(subcat.id)
                            ? 'border-purple-500 bg-purple-500'
                            : isDark ? 'border-gray-600' : 'border-gray-300'"
                        />
                      </button>
                    </div>
                  </div>

                  <!-- Category without subcategories -->
                  <button
                    v-else
                    @click="toggleCategory(category.id)"
                    class="w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors group ml-5"
                    :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
                  >
                    <Folder :size="14" class="theme-text-muted flex-shrink-0" />
                    <span class="text-xs flex-1 text-left truncate theme-text-muted">
                      {{ category.name }}
                    </span>
                    <span class="text-xs theme-text-muted">{{ category.count }}</span>
                    <div
                      class="w-3 h-3 rounded-full border flex-shrink-0 transition-all"
                      :class="selectedCategoryIds.includes(category.id)
                        ? 'border-purple-500 bg-purple-500'
                        : isDark ? 'border-gray-600' : 'border-gray-300'"
                    />
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- No packages match -->
          <div v-if="filteredPackages.length === 0" class="text-center py-8">
            <Package :size="32" class="mx-auto mb-2" :class="isDark ? 'text-gray-600' : 'text-gray-400'" />
            <p class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-400'">No packages found</p>
          </div>
        </div>
      </ScrollArea>

      <!-- Quick Stats (Fixed at bottom, outside ScrollArea) -->
      <div
        class="px-4 py-3 border-t theme-transition"
        :class="isDark ? 'border-[#1e2235]' : 'border-gray-200'"
      >
        <h3 class="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-3">
          Quick Stats
        </h3>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between items-center">
            <span class="theme-text-muted">Total Icons</span>
            <span class="theme-text-primary font-medium">{{ formatNumber(totalIconCount) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="theme-text-muted">Filtered</span>
            <span class="text-purple-400 font-medium">{{ formatNumber(filteredCount) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="theme-text-muted">Selected Packages</span>
            <span class="theme-text-primary font-medium">{{ selectedPackageIds.length }}/{{ packages.length }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="theme-text-muted">Active Filters</span>
            <span class="text-purple-400 font-medium">{{ selectedCategoryIds.length }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="theme-text-muted">Loaded Icons</span>
            <span class="theme-text-primary font-medium">{{ formatNumber(loadedIconCount) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="theme-text-muted">Favorites</span>
            <span class="text-pink-400 font-medium">{{ favoritesCount }}</span>
          </div>
        </div>
      </div>

    </aside>
  </TooltipProvider>
</template>
