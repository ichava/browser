<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { toast } from 'vue-sonner'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sliders,
  Palette,
  Filter,
  Search,
  X,
  Package,
  Folder,
  Sparkles,
} from 'lucide-vue-next'
import SearchBar from '@/components/SearchBar.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useIchava } from '@/ichava-ts'

const {
  sortBy,
  sortOrder,
  iconSize,
  iconColor,
  setSortBy,
  toggleSortOrder,
  setIconSize,
  setIconColor,
  selectedCategoryIds,
  selectedPackageIds,
  toggleCategory,
  togglePackage,
  clearAllCategories,
  filteredCount,
  totalIconCount,
  searchQuery,
  setSearchQuery,
  isDark,
  packages,
  categories
} = useIchava()

const sortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'package', label: 'Package' },
  { value: 'category', label: 'Category' }
]

const showSortDropdown = ref(false)
const showColorPicker = ref(false)

// Empty string means "original" - no color override
const ORIGINAL_COLOR = ''

const colorPresets = [
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#000000', // black
  '#ffffff', // white
]

const isOriginalColor = computed(() => iconColor.value === ORIGINAL_COLOR)

function resetToOriginal() {
  setIconColor(ORIGINAL_COLOR)
  showColorPicker.value = false
}

function selectSort(value: string) {
  setSortBy(value as 'name' | 'package' | 'category')
  showSortDropdown.value = false
}

const currentSortLabel = computed(() => {
  return sortOptions.find(opt => opt.value === sortBy.value)?.label || 'Name'
})

// Get display name for package ID
function getPackageName(pkgId: string): string {
  const pkg = packages.value.find(p => p.id === pkgId)
  return pkg?.name?.split('/').pop() || pkgId
}

// Get display name for category ID
function getCategoryName(catId: string): string {
  for (const group of categories.value) {
    const cat = group.categories?.find((c: any) => c.id === catId)
    if (cat) return cat.name
  }
  return catId
}

// Selected packages for display (max 3 visible)
const visiblePackages = computed(() => selectedPackageIds.value.slice(0, 3))
const hiddenPackageCount = computed(() => Math.max(0, selectedPackageIds.value.length - 3))

// Selected categories for display (max 4 visible)
const visibleCategories = computed(() => selectedCategoryIds.value.slice(0, 4))
const hiddenCategoryCount = computed(() => Math.max(0, selectedCategoryIds.value.length - 4))

// Check if any filters are active
const hasActiveFilters = computed(() => {
  const hasSearch = !!searchQuery.value?.trim()
  const hasPackages = selectedPackageIds.value.length > 0 && selectedPackageIds.value.length < packages.value.length
  const hasCategories = selectedCategoryIds.value.length > 0
  const hasCustomColor = iconColor.value !== ORIGINAL_COLOR
  const hasCustomSort = sortBy.value !== 'name' || sortOrder.value !== 'asc'

  return hasSearch || hasPackages || hasCategories || hasCustomColor || hasCustomSort
})

// Total active filter count
const activeFilterCount = computed(() => {
  let count = 0
  if (searchQuery.value?.trim()) count++
  if (selectedPackageIds.value.length > 0 && selectedPackageIds.value.length < packages.value.length) {
    count += selectedPackageIds.value.length
  }
  count += selectedCategoryIds.value.length
  if (iconColor.value !== ORIGINAL_COLOR) count++
  return count
})

// Clear all filters
function clearAllFilters() {
  const activeCount = activeFilterCount.value
  setSearchQuery('')
  clearAllCategories()
  setIconColor(ORIGINAL_COLOR)
  setSortBy('name')
  if (sortOrder.value !== 'asc') toggleSortOrder()
  
  toast.success(`Cleared ${activeCount} filter${activeCount !== 1 ? 's' : ''}`, {
    description: 'Showing all icons',
    duration: 2500
  })
}

function hasIconCounts(filtered: number | null, total: number | null): boolean {
  return filtered !== null && total !== null && Number.isFinite(filtered) && Number.isFinite(total)
}

// Handle icon size change from slider
function handleSizeChange(value: number[]) {
  if (value.length > 0) {
    setIconSize(value[0])
  }
}
</script>


<template>
    <TooltipProvider>
        <div
            class="border-b theme-transition"
            :class="isDark ? 'border-[#1e2235] bg-[#0a0d1a]' : 'border-gray-200 bg-white'"
        >
            <!-- Row 1: Sort, Size, Color Controls -->
            <div class="px-6 py-3 flex items-center gap-4 flex-wrap">
                <!-- Sort Controls -->
                <div class="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger as-child>
                            <span class="text-xs uppercase font-medium" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Sort:</span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Sort icons by name, package, or category</p>
                        </TooltipContent>
                    </Tooltip>

                    <div class="relative">
                        <Tooltip>
                            <TooltipTrigger as-child>
                                <button
                                    @click="showSortDropdown = !showSortDropdown"
                                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
                                    :class="isDark
                    ? 'bg-[#151823] border border-[#1e2235] text-gray-200 hover:border-purple-500/50'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:border-purple-500/50'"
                                >
                                    <ArrowUpDown :size="14" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
                                    {{ currentSortLabel }}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>Click to change sort field</p>
                            </TooltipContent>
                        </Tooltip>

                        <!-- Sort Dropdown -->
                        <div
                            v-if="showSortDropdown"
                            class="absolute top-full left-0 mt-2 w-40 rounded-lg shadow-xl z-50 py-1"
                            :class="isDark ? 'bg-[#151823] border border-[#1e2235]' : 'bg-white border border-gray-200'"
                        >
                            <button
                                v-for="option in sortOptions"
                                :key="option.value"
                                @click="selectSort(option.value)"
                                class="w-full px-3 py-2 text-sm text-left transition-colors"
                                :class="[
                  sortBy === option.value ? 'text-purple-400' : (isDark ? 'text-gray-200' : 'text-gray-700'),
                  isDark ? 'hover:bg-[#1e2235]' : 'hover:bg-gray-100'
                ]"
                            >
                                {{ option.label }}
                            </button>
                        </div>
                    </div>

                    <Tooltip>
                        <TooltipTrigger as-child>
                            <button
                                @click="toggleSortOrder"
                                class="p-1.5 rounded-lg transition-colors"
                                :class="isDark
                  ? 'bg-[#151823] border border-[#1e2235] hover:border-purple-500/50'
                  : 'bg-gray-50 border border-gray-200 hover:border-purple-500/50'"
                            >
                                <ArrowUp v-if="sortOrder === 'asc'" :size="14" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
                                <ArrowDown v-else :size="14" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>{{ sortOrder === 'asc' ? 'Ascending (click for descending)' : 'Descending (click for ascending)' }}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                <!-- Divider -->
                <div class="w-px h-6" :class="isDark ? 'bg-[#1e2235]' : 'bg-gray-200'" />

                <!-- Icon Size -->
                <div class="flex items-center gap-3 flex-1 min-w-[180px] max-w-[280px]">
                    <Tooltip>
                        <TooltipTrigger as-child>
              <span class="text-xs whitespace-nowrap flex items-center gap-1.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                <Sliders :size="14" />
                Size:
              </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Adjust icon preview size (24-640px)</p>
                        </TooltipContent>
                    </Tooltip>
                    <Slider
                        :model-value="[iconSize]"
                        @update:model-value="handleSizeChange"
                        :min="24"
                        :max="640"
                        :step="8"
                        class="flex-1"
                    />
                    <span class="text-xs font-mono w-14 text-right" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ iconSize }}px</span>
                </div>

                <!-- Divider -->
                <div class="w-px h-6" :class="isDark ? 'bg-[#1e2235]' : 'bg-gray-200'" />

                <!-- Preview Color -->
                <div class="flex items-center gap-2 relative">
                    <Tooltip>
                        <TooltipTrigger as-child>
              <span class="text-xs flex items-center gap-1.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                <Palette :size="14" />
                Color:
              </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                            <p>Change icon preview color</p>
                        </TooltipContent>
                    </Tooltip>

                    <Popover v-model:open="showColorPicker">
                        <PopoverTrigger as-child>
                            <Button
                                variant="outline"
                                class="h-8 px-3"
                                :class="isDark ? 'bg-[#151823] border-[#1e2235]' : 'bg-gray-50 border-gray-200'"
                            >
                                <!-- Original color indicator (rainbow/gradient) -->
                                <div
                                    v-if="isOriginalColor"
                                    class="w-4 h-4 rounded border overflow-hidden mr-2"
                                    :class="isDark ? 'border-gray-600' : 'border-gray-300'"
                                >
                                    <div class="w-full h-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
                                </div>
                                <!-- Custom color indicator -->
                                <div
                                    v-else
                                    class="w-4 h-4 rounded border mr-2"
                                    :class="isDark ? 'border-gray-600' : 'border-gray-300'"
                                    :style="{ backgroundColor: iconColor }"
                                />
                                <span class="text-xs font-mono" :class="isDark ? 'text-gray-400' : 'text-gray-500'">
                  {{ isOriginalColor ? 'Original' : iconColor }}
                </span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent class="w-56 p-3" :class="isDark ? 'bg-[#151823] border-[#1e2235]' : ''">
                            <div class="flex items-center gap-2 mb-3">
                                <Palette :size="14" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
                                <span class="text-xs" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Select Color</span>
                            </div>

                            <!-- Original Color Option -->
                            <button
                                @click="resetToOriginal"
                                class="w-full flex items-center gap-2 px-3 py-2 mb-3 rounded-lg border-2 transition-all hover:scale-[1.02]"
                                :class="isOriginalColor
                  ? 'border-purple-500 ring-2 ring-purple-500/30'
                  : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'"
                            >
                                <div class="w-6 h-6 rounded overflow-hidden border" :class="isDark ? 'border-gray-600' : 'border-gray-300'">
                                    <div class="w-full h-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
                                </div>
                                <span class="text-sm font-medium" :class="isDark ? 'text-gray-200' : 'text-gray-700'">Original Colors</span>
                                <span v-if="isOriginalColor" class="ml-auto text-xs text-purple-400">✓</span>
                            </button>

                            <!-- Color Presets Grid -->
                            <div class="grid grid-cols-5 gap-2 mb-3">
                                <Tooltip v-for="color in colorPresets" :key="color">
                                    <TooltipTrigger as-child>
                                        <button
                                            @click="setIconColor(color); showColorPicker = false"
                                            class="w-7 h-7 rounded-lg border-2 hover:scale-110 transition-transform"
                                            :class="iconColor === color ? 'border-purple-500 ring-2 ring-purple-500/30' : (isDark ? 'border-gray-700' : 'border-gray-300')"
                                            :style="{ backgroundColor: color }"
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p>{{ color }}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>

                            <!-- Custom Color Picker -->
                            <div class="pt-2 border-t" :class="isDark ? 'border-gray-700' : 'border-gray-200'">
                                <span class="text-xs mb-2 block" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Custom color</span>
                                <input
                                    type="color"
                                    :value="iconColor || '#8b5cf6'"
                                    @input="setIconColor(($event.target as HTMLInputElement).value)"
                                    class="w-full h-8 rounded cursor-pointer"
                                />
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <!-- Row 2: Unified Search + Icon Counter -->
            <div
                class="px-6 py-3 flex items-center gap-4 border-t"
                :class="isDark ? 'border-[#1e2235]' : 'border-gray-100'"
            >
                <!-- Unified Search Component -->
                <SearchBar class="flex-1 max-w-2xl" />

                <!-- Spacer -->
                <div class="flex-1" />

                <!-- Icon Counter -->
                <div v-if="hasIconCounts(filteredCount, totalIconCount)" class="text-xs whitespace-nowrap" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    Showing
                    <span class="text-purple-400 font-semibold">{{ filteredCount?.toLocaleString() }}</span>
                    of
                    <span class="font-medium" :class="isDark ? 'text-gray-400' : 'text-gray-500'">{{ totalIconCount?.toLocaleString() }}</span>
                    icons
                </div>
            </div>

            <!-- Row 3: Active Filters (only shown when filters are active) -->
            <div
                v-if="hasActiveFilters"
                class="px-6 py-3 flex items-center gap-3 flex-wrap border-t"
                :class="isDark ? 'border-[#1e2235]' : 'border-gray-100'"
            >
                <!-- Filter Header -->
                <Tooltip>
                    <TooltipTrigger as-child>
            <span class="text-xs flex items-center gap-1.5" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              <Filter :size="14" />
              Active Filters:
            </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                        <p>{{ activeFilterCount }} active filter{{ activeFilterCount !== 1 ? 's' : '' }}</p>
                    </TooltipContent>
                </Tooltip>

                <!-- Search Term Filter -->
                <Tooltip v-if="searchQuery?.trim()">
                    <TooltipTrigger as-child>
                        <Badge
                            variant="secondary"
                            class="cursor-pointer flex items-center gap-1.5 px-2.5 py-1"
                            :class="isDark
                ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30'
                : 'bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100'"
                            @click="setSearchQuery('')"
                        >
                            <Search :size="12" />
                            <span class="font-medium">"{{ searchQuery }}"</span>
                            <X :size="12" />
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Click to clear search</p>
                    </TooltipContent>
                </Tooltip>

                <!-- Selected Packages (only show if not all selected) -->
                <template v-if="selectedPackageIds.length > 0 && selectedPackageIds.length < packages.length">
                    <div class="flex items-center gap-1.5">
                        <Tooltip>
                            <TooltipTrigger as-child>
                <span class="text-xs flex items-center gap-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  <Package :size="12" />
                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Selected packages</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip v-for="pkgId in visiblePackages" :key="pkgId">
                            <TooltipTrigger as-child>
                                <Badge
                                    variant="secondary"
                                    class="cursor-pointer flex items-center gap-1 px-2 py-1"
                                    :class="isDark
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100'"
                                    @click="togglePackage(pkgId)"
                                >
                                    {{ getPackageName(pkgId) }}
                                    <X :size="12" />
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Click to deselect {{ getPackageName(pkgId) }}</p>
                            </TooltipContent>
                        </Tooltip>

                        <span v-if="hiddenPackageCount > 0" class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              +{{ hiddenPackageCount }} more
            </span>
                    </div>
                </template>

                <!-- Selected Categories -->
                <template v-if="selectedCategoryIds.length > 0">
                    <div class="flex items-center gap-1.5">
                        <Tooltip>
                            <TooltipTrigger as-child>
                <span class="text-xs flex items-center gap-1" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                  <Folder :size="12" />
                </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Selected categories</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip v-for="catId in visibleCategories" :key="catId">
                            <TooltipTrigger as-child>
                                <Badge
                                    variant="secondary"
                                    class="cursor-pointer flex items-center gap-1 px-2 py-1"
                                    :class="isDark
                    ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30'
                    : 'bg-purple-50 border border-purple-200 text-purple-600 hover:bg-purple-100'"
                                    @click="toggleCategory(catId)"
                                >
                                    {{ getCategoryName(catId) }}
                                    <X :size="12" />
                                </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Click to deselect {{ getCategoryName(catId) }}</p>
                            </TooltipContent>
                        </Tooltip>

                        <span v-if="hiddenCategoryCount > 0" class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
              +{{ hiddenCategoryCount }} more
            </span>
                    </div>
                </template>

                <!-- Custom Color Filter -->
                <Tooltip v-if="iconColor !== ''">
                    <TooltipTrigger as-child>
                        <Badge
                            variant="secondary"
                            class="cursor-pointer flex items-center gap-1.5 px-2.5 py-1"
                            :class="isDark
                ? 'bg-pink-500/20 border border-pink-500/50 text-pink-400 hover:bg-pink-500/30'
                : 'bg-pink-50 border border-pink-200 text-pink-600 hover:bg-pink-100'"
                            @click="resetToOriginal"
                        >
                            <div
                                class="w-3 h-3 rounded-sm border"
                                :class="isDark ? 'border-pink-400' : 'border-pink-500'"
                                :style="{ backgroundColor: iconColor }"
                            />
                            <span class="font-mono">{{ iconColor }}</span>
                            <X :size="12" />
                        </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Click to reset to original colors</p>
                    </TooltipContent>
                </Tooltip>

                <!-- Spacer -->
                <div class="flex-1" />

                <!-- Clear All Filters -->
                <Tooltip>
                    <TooltipTrigger as-child>
                        <Button
                            variant="ghost"
                            size="sm"
                            class="h-7 px-2.5 text-xs"
                            :class="isDark
                ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                : 'text-red-500 hover:text-red-600 hover:bg-red-50'"
                            @click="clearAllFilters"
                        >
                            <Sparkles :size="12" class="mr-1.5" />
                            Clear all filters
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Clear all active filters</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>

        <!-- Click outside handler for dropdowns -->
        <div
            v-if="showSortDropdown || showColorPicker"
            @click="showSortDropdown = false; showColorPicker = false"
            class="fixed inset-0 z-40"
        />
    </TooltipProvider>
</template>
