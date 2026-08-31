<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Heart,
  Layers,
  Trash2,
  X,
  Plus,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Clock,
  Eye,
  Download,
  Search,
  Menu,
} from 'lucide-vue-next'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ToolbarMain from '@/components/layout/ToolbarMain.vue'
import IconModal from '@/components/IconModal.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { sanitizeSvg } from '@/ichava-ts/utils/sanitizeSvg'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useIchava } from '@/ichava-ts'
import { toast } from 'vue-sonner'

// Use the Ichava composable
const {
  // Icons
  paginatedIcons,
  refreshAll,

  // Browser state
  viewMode,
  iconSize,
  iconColor,
  resetFilters,

  // Pagination
  currentPage,
  totalPages,
  setPage,

  // Favorites
  favoriteIcons,
  toggleFavorite,
  isFavorite,

  // Collections
  collections,
  collectionsWithIcons,
  createCollection,
  deleteCollection,
  addIconToCollection,
  isIconInCollection,

  // History
  historyEntries,
  addHistoryEntry,
  clearHistory,

  // Theme
  isDark,

  // Loading and error states
  isLoading,
  isInitialized,
  error,

  // Toast from ichava
  showToast,
} = useIchava()

// Modal state
const showCommandPalette = ref(false)
const showFavorites = ref(false)
const showHistory = ref(false)
const showSettings = ref(false)
const showCollections = ref(false)
const showIconDetail = ref(false)
const selectedIconForDetail = ref<any>(null)

// Mobile sidebar state
const showMobileSidebar = ref(false)
const showAddToCollectionModal = ref(false)

// Collection state
const newCollectionName = ref('')

// Track history when viewing icon details
function openIconDetail(icon: any) {
  selectedIconForDetail.value = icon
  showIconDetail.value = true
  addHistoryEntry(icon.id, 'view')
}

function closeIconDetail() {
  showIconDetail.value = false
  selectedIconForDetail.value = null
}

// Track history when copying
function copyToClipboard(text: string, iconId?: number, iconName?: string) {
  navigator.clipboard.writeText(text)
  toast.success(`Copied ${iconName || 'Content'}!`)
  if (iconId) {
    addHistoryEntry(iconId, 'copy')
  }
}

// Handle favorite toggle with toast
async function handleToggleFavorite(iconId: number, iconName: string) {
  const wasFavorite = isFavorite(iconId)
  await toggleFavorite(iconId)
  if (wasFavorite) {
    toast.info(`Removed from favorites`, {
      description: iconName
    })
  } else {
    toast.success(`Added to favorites`, {
      description: iconName
    })
  }
}

// Handle download with toast
function handleDownload(iconId: number, iconName: string) {
  addHistoryEntry(iconId, 'download')
  toast.success(`Downloaded ${iconName}.svg`)
}

// Pagination helpers
function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    setPage(page)
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    setPage(currentPage.value + 1)
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    setPage(currentPage.value - 1)
  }
}

// Icon card size based on icon size (square cards)
const iconCardSize = computed(() => {
  const baseSize = iconSize.value
  if (baseSize <= 48) return 100
  if (baseSize <= 96) return baseSize + 60
  if (baseSize <= 192) return baseSize + 80
  return baseSize + 100
})

// Compute grid style
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(auto-fill, ${iconCardSize.value}px)`,
  gap: '12px',
  justifyContent: 'start',
}))

// Calculate page numbers for pagination display
function getPageNumber(index: number): number {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 5) return index

  let start = Math.max(1, current - 2)
  const end = Math.min(total, start + 4)

  if (end - start < 4) {
    start = Math.max(1, end - 4)
  }

  return start + index - 1
}

function handleCreateCollection() {
  if (newCollectionName.value.trim()) {
    const name = newCollectionName.value.trim()
    createCollection(name)
    toast.success(`Collection created`, {
      description: name,
      duration: 3000
    })
    newCollectionName.value = ''
  }
}

// Handle collection deletion with feedback
function handleDeleteCollection(collectionId: string) {
  const collection = collections.value.find(c => c.id === collectionId)
  if (collection) {
    const iconCount = collection.iconIds.length
    deleteCollection(collectionId)
    toast.success(`Collection deleted`, {
      description: `"${collection.name}" with ${iconCount} icon${iconCount !== 1 ? 's' : ''}`
    })
  }
}

// Handle adding icon to collection
function handleAddIconToCollection(collectionId: string, iconId: number, iconName: string) {
  const collection = collections.value.find(c => c.id === collectionId)
  addIconToCollection(collectionId, iconId)
  toast.success(`Added to collection`, {
    description: `${iconName} → "${collection?.name}"`
  })
  showAddToCollectionModal.value = false
}

// Handle clear history
function handleClearHistory() {
  const count = historyEntries.value.length
  if (count === 0) {
    toast.info('History is already empty')
    return
  }
  clearHistory()
  toast.success(`Cleared ${count} history entries`, {
    description: 'Your browsing history has been reset'
  })
}

// Keyboard shortcuts - removed as CommandPalette handles Cmd+K internally
function handleKeydown(event: KeyboardEvent) {
  // Quick search: /
  if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
    const target = event.target as HTMLElement
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      event.preventDefault()
      document.querySelector<HTMLInputElement>('[data-unified-search]')?.focus()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-screen theme-transition" :class="[isDark ? 'dark' : '', 'theme-bg-page theme-text-primary']">
    <!-- Loading Overlay -->
    <Transition name="fade">
      <div
        v-if="isLoading && !isInitialized"
        class="fixed inset-0 z-50 flex items-center justify-center"
        :class="isDark ? 'bg-gradient-to-br from-[#0a0d1a] via-[#151823] to-[#1a1d2e]' : 'bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30'"
      >
        <div class="flex flex-col items-center space-y-6 px-4">
          <!-- Animated Icon -->
          <div class="relative">
            <div
              class="absolute inset-0 blur-2xl opacity-30 animate-pulse"
              :class="isDark ? 'bg-violet-500' : 'bg-violet-400'"
            ></div>
            <div
              class="relative rounded-2xl p-6"
              :class="isDark ? 'bg-[#1c1f2e]/80 border border-violet-500/20' : 'bg-white/80 border border-violet-400/20 backdrop-blur-sm shadow-xl'"
            >
              <Loader2 :size="64" class="animate-spin" :class="isDark ? 'text-violet-400' : 'text-violet-500'" />
            </div>
          </div>

          <!-- Loading Text -->
          <div class="text-center space-y-2">
            <p class="text-xl font-semibold" :class="isDark ? 'text-white' : 'text-gray-900'">
              Loading Icons...
            </p>
            <p class="text-sm" :class="isDark ? 'text-gray-500' : 'text-gray-600'">
              Preparing your icon library
            </p>
          </div>

          <!-- Progress Indicator -->
          <div class="w-48 h-1 rounded-full overflow-hidden" :class="isDark ? 'bg-[#252837]' : 'bg-gray-200'">
            <div
              class="h-full rounded-full animate-loading-bar"
              :class="isDark ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-gradient-to-r from-violet-400 to-purple-400'"
            ></div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Error Banner -->
    <Transition name="slide-down">
      <div
        v-if="error"
        class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 bg-red-500/20 px-4 py-3 backdrop-blur-sm"
      >
        <div class="flex items-center gap-3">
          <AlertCircle :size="20" class="text-red-400" />
          <span class="text-sm text-red-200">{{ error }}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="refreshAll"
          class="bg-red-500/30 text-red-200 hover:bg-red-500/40 border-red-500/50"
        >
          <RefreshCw :size="16" class="mr-2" />
          Retry
        </Button>
      </div>
    </Transition>

    <!-- Mobile Sidebar Drawer -->
    <Sheet v-model:open="showMobileSidebar">
      <SheetContent 
        side="left" 
        class="w-[280px] p-0"
        :class="isDark ? 'bg-[#0a0d1a] border-[#1e2235]' : 'bg-white border-gray-200'"
      >
        <SheetHeader class="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <AppSidebar 
          @open-settings="showSettings = true; showMobileSidebar = false" 
          class="h-full border-0"
        />
      </SheetContent>
    </Sheet>

    <!-- Desktop Sidebar (Fixed) -->
    <div 
      class="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col"
    >
      <AppSidebar @open-settings="showSettings = true" />
    </div>

    <!-- Main Content Area (offset on desktop) -->
    <div class="lg:pl-64 flex h-screen flex-col">
      <!-- Header with mobile menu button -->
      <div class="sticky top-0 z-40">
        <div 
          class="flex h-14 items-center gap-x-4 border-b px-4 lg:hidden"
          :class="isDark ? 'bg-[#0a0d1a] border-[#1e2235]' : 'bg-white border-gray-200'"
        >
          <Button 
            variant="ghost" 
            size="icon"
            @click="showMobileSidebar = true"
            :class="isDark ? 'hover:bg-[#151823]' : 'hover:bg-gray-100'"
          >
            <Menu :size="24" :class="isDark ? 'text-gray-400' : 'text-gray-500'" />
            <span class="sr-only">Open sidebar</span>
          </Button>
          <div class="flex-1 flex items-center gap-2">
            <span class="text-lg font-semibold text-purple-400">Ichava</span>
            <span class="text-lg font-normal" :class="isDark ? 'text-gray-400' : 'text-gray-500'">Browser</span>
          </div>
        </div>
        
        <!-- Full Header (desktop) -->
        <div class="hidden lg:block">
      <AppHeader
        @open-command-palette="showCommandPalette = true"
        @open-favorites="showFavorites = true"
        @open-history="showHistory = true"
        @open-settings="showSettings = true"
        @open-collections="showCollections = true"
      />
        </div>
      </div>

      <ToolbarMain />

      <div class="flex flex-1 overflow-hidden">
        <main class="flex-1 overflow-y-auto">
          <div class="p-6">
            <!-- Grid View -->
            <div
              v-if="viewMode === 'grid'"
              :style="gridStyle"
            >
              <!-- Loading Skeletons -->
              <template v-if="isLoading && isInitialized">
                <Skeleton
                  v-for="i in 24"
                  :key="i"
                  :style="{ width: `${iconCardSize}px`, height: `${iconCardSize}px` }"
                  class="rounded-lg"
                />
              </template>

              <!-- Icon Cards -->
              <template v-else>
                <div
                  v-for="icon in paginatedIcons"
                  :key="icon.id"
                  @click="openIconDetail(icon)"
                  class="relative group border rounded-lg hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden theme-transition flex flex-col"
                  :class="isDark ? 'bg-[#151823] border-[#1e2235] hover:bg-[#1a1d2e]' : 'bg-white border-gray-200 hover:bg-gray-50'"
                  :style="{ width: `${iconCardSize}px`, height: `${iconCardSize}px` }"
                >
                  <!-- Favorite Button - Top Right -->
                  <button
                    @click.stop="handleToggleFavorite(icon.id, icon.name)"
                    class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md z-10"
                    :class="[
                      isFavorite(icon.id) ? '!opacity-100' : '',
                      isDark ? 'bg-[#0a0d1a]/80 hover:bg-[#0a0d1a]' : 'bg-white/80 hover:bg-white shadow-sm'
                    ]"
                    :title="isFavorite(icon.id) ? 'Remove from favorites' : 'Add to favorites'"
                  >
                    <Heart
                      :size="14"
                      :fill="isFavorite(icon.id) ? 'currentColor' : 'none'"
                      class="transition-colors"
                      :class="isFavorite(icon.id) ? 'text-pink-400' : 'text-gray-400 hover:text-pink-400'"
                    />
                  </button>

                  <!-- Add to Collection Button - Top Left -->
                  <button
                    @click.stop="showCollections = true"
                    class="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md z-10"
                    :class="isDark ? 'bg-[#0a0d1a]/80 hover:bg-[#0a0d1a]' : 'bg-white/80 hover:bg-white shadow-sm'"
                    title="Add to collection"
                  >
                    <Plus :size="14" class="text-gray-400 hover:text-purple-400" />
                  </button>

                  <!-- Icon Display - centered with flex-1 -->
                  <div class="flex flex-col items-center justify-center flex-1 p-2 pt-8 min-h-0">
                    <div
                      class="icon-svg flex items-center justify-center flex-1 min-h-0 w-full"
                      :class="{ 'icon-colored': iconColor }"
                      :style="iconColor ? { color: iconColor } : {}"
                    >
                      <div
                        v-if="icon.svgContent || icon.svg_content"
                        class="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                        :style="{ maxWidth: `${iconSize}px`, maxHeight: `${iconSize}px` }"
                        v-html="sanitizeSvg(icon.svgContent || icon.svg_content)"
                      />
                      <div
                        v-else
                        class="flex items-center justify-center rounded-lg"
                        :class="isDark ? 'bg-gray-800/50' : 'bg-gray-100'"
                        :style="{ width: `${Math.min(iconSize, 64)}px`, height: `${Math.min(iconSize, 64)}px` }"
                      >
                        <span
                          class="text-xl font-bold uppercase"
                          :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                        >
                          {{ icon.name?.charAt(0) || '?' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Name and category - fixed at bottom -->
                  <div class="px-2 pb-2 text-center flex-shrink-0">
                    <div class="text-sm font-medium truncate" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                      {{ icon.name }}
                    </div>
                    <div class="text-xs mt-0.5 truncate" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                      {{ icon.category }}
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <!-- List View -->
            <div v-else class="space-y-2">
              <div
                v-for="icon in paginatedIcons"
                :key="icon.id"
                @click="openIconDetail(icon)"
                class="relative group flex items-center gap-4 border rounded-lg p-3 hover:border-purple-500/50 transition-all cursor-pointer theme-transition"
                :class="isDark ? 'bg-[#151823] border-[#1e2235] hover:bg-[#1a1d2e]' : 'bg-white border-gray-200 hover:bg-gray-50'"
              >
                <!-- Icon Preview -->
                <div
                  class="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
                  :class="isDark ? 'bg-gray-800/50' : 'bg-gray-100'"
                >
                  <div
                    v-if="icon.svgContent || icon.svg_content"
                    class="icon-svg w-8 h-8 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                    :class="{ 'icon-colored': iconColor }"
                    :style="iconColor ? { color: iconColor } : {}"
                    v-html="sanitizeSvg(icon.svgContent || icon.svg_content)"
                  />
                  <div
                    v-else
                    class="w-8 h-8 rounded flex items-center justify-center"
                    :class="isDark ? 'bg-gray-700' : 'bg-gray-200'"
                  >
                    <span
                      class="text-sm font-bold uppercase"
                      :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                    >
                      {{ icon.name?.charAt(0) || '?' }}
                    </span>
                  </div>
                </div>

                <!-- Icon Info -->
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate" :class="isDark ? 'text-gray-200' : 'text-gray-700'">
                    {{ icon.name }}
                  </div>
                  <div class="text-xs" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                    {{ icon.package }} / {{ icon.category }}
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click.stop="handleToggleFavorite(icon.id, icon.name)"
                    :title="isFavorite(icon.id) ? 'Remove from favorites' : 'Add to favorites'"
                  >
                    <Heart
                      :size="16"
                      :fill="isFavorite(icon.id) ? 'currentColor' : 'none'"
                      class="transition-colors"
                      :class="isFavorite(icon.id) ? 'text-pink-400' : 'text-gray-400 hover:text-pink-400'"
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click.stop="showCollections = true"
                    title="Add to collection"
                  >
                    <Plus :size="16" class="text-gray-400 hover:text-purple-400" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    @click.stop="copyToClipboard(icon.name, icon.id, icon.name)"
                    title="Copy name"
                  >
                    <Copy :size="16" class="text-gray-400 hover:text-blue-400" />
                  </Button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="paginatedIcons.length === 0 && !isLoading"
              class="flex flex-col items-center justify-center py-20"
            >
              <Search :size="64" class="mb-4" :class="isDark ? 'text-gray-600' : 'text-gray-400'" />
              <h3 class="text-lg font-semibold mb-2" :class="isDark ? 'text-gray-200' : 'text-gray-700'">No icons found</h3>
              <p class="text-sm mb-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">Try adjusting your filters or search query</p>
              <Button @click="resetFilters" variant="outline" size="sm">
                <RefreshCw :size="16" class="mr-2" />
                Reset Filters
              </Button>
            </div>

            <!-- Pagination -->
            <div
              v-if="paginatedIcons.length > 0 && totalPages > 1"
              class="flex items-center justify-center gap-2 mt-8 pb-4"
            >
              <Button
                variant="ghost"
                size="icon"
                @click="goToPage(1)"
                :disabled="currentPage === 1"
                class="h-9 w-9"
              >
                <ChevronsLeft :size="16" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                @click="prevPage"
                :disabled="currentPage === 1"
                class="h-9 w-9"
              >
                <ChevronLeft :size="16" />
              </Button>

              <div class="flex items-center gap-1">
                <template v-for="page in Math.min(5, totalPages)" :key="page">
                  <Button
                    v-if="getPageNumber(page) <= totalPages"
                    @click="goToPage(getPageNumber(page))"
                    :variant="currentPage === getPageNumber(page) ? 'default' : 'ghost'"
                    size="sm"
                    class="min-w-[36px] h-9"
                    :class="currentPage === getPageNumber(page) ? 'bg-purple-500 hover:bg-purple-600' : ''"
                  >
                    {{ getPageNumber(page) }}
                  </Button>
                </template>
              </div>

              <Button
                variant="ghost"
                size="icon"
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="h-9 w-9"
              >
                <ChevronRight :size="16" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                @click="goToPage(totalPages)"
                :disabled="currentPage === totalPages"
                class="h-9 w-9"
              >
                <ChevronsRight :size="16" />
              </Button>

              <span class="text-sm ml-4" :class="isDark ? 'text-gray-500' : 'text-gray-400'">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Toast Container (Sonner) -->
    <Toaster
      :theme="isDark ? 'dark' : 'light'"
      position="bottom-right"
      :rich-colors="true"
    />

    <!-- Favorites Modal -->
    <Dialog v-model:open="showFavorites">
      <DialogContent
        class="max-w-5xl"
        :class="isDark ? 'bg-[#1c1f2e] border-[#2a2d3e]' : 'bg-white border-gray-200'"
      >
        <DialogHeader class="flex-row items-center gap-3 space-y-0">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-xl"
            :class="isDark ? 'bg-pink-500/20' : 'bg-pink-50'"
          >
            <Heart :size="24" class="text-pink-500" />
          </div>
          <div class="flex-1">
            <DialogTitle class="text-2xl" :class="isDark ? 'text-white' : 'text-gray-900'">
              Favorites
            </DialogTitle>
            <DialogDescription :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              Your favorite icons
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea class="max-h-[500px] mt-6">
          <div v-if="favoriteIcons.length > 0" class="grid grid-cols-6 gap-3">
            <div
              v-for="icon in favoriteIcons"
              :key="icon.id"
              @click="openIconDetail(icon); showFavorites = false"
              class="aspect-square border rounded-xl p-4 cursor-pointer transition-all group hover:shadow-md"
              :class="isDark ? 'bg-[#252837] border-[#2a2d3e] hover:border-purple-500/50' : 'bg-gray-50 border-gray-200 hover:border-purple-500/50'"
            >
              <div class="flex flex-col items-center justify-center h-full">
                <div
                  class="w-10 h-10 mb-2 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  :class="isDark ? 'bg-purple-500/10' : 'bg-purple-50'"
                >
                  <div
                    v-if="icon.svgContent || icon.svg_content"
                    class="w-6 h-6 [&>svg]:w-full [&>svg]:h-full"
                    v-html="sanitizeSvg(icon.svgContent || icon.svg_content)"
                  />
                </div>
                <div
                  class="text-xs font-medium text-center truncate w-full"
                  :class="isDark ? 'text-gray-200' : 'text-gray-700'"
                >
                  {{ icon.name }}
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-16">
            <Heart
              :size="64"
              class="mx-auto mb-4"
              :class="isDark ? 'text-gray-700' : 'text-gray-300'"
            />
            <p
              class="text-lg font-medium mb-2"
              :class="isDark ? 'text-gray-400' : 'text-gray-500'"
            >
              No favorite icons yet
            </p>
            <p
              class="text-sm"
              :class="isDark ? 'text-gray-600' : 'text-gray-400'"
            >
              Click the heart icon on any icon to add it to your favorites
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>

    <!-- Collections Modal -->
    <Dialog v-model:open="showCollections">
      <DialogContent
        class="max-w-5xl"
        :class="isDark ? 'bg-[#1c1f2e] border-[#2a2d3e]' : 'bg-white border-gray-200'"
      >
        <DialogHeader class="flex-row items-center gap-3 space-y-0">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-xl"
            :class="isDark ? 'bg-purple-500/20' : 'bg-purple-50'"
          >
            <Layers :size="24" class="text-purple-500" />
          </div>
          <div class="flex-1">
            <DialogTitle class="text-2xl" :class="isDark ? 'text-white' : 'text-gray-900'">
              Collections
            </DialogTitle>
          </div>
        </DialogHeader>

        <div class="space-y-6 mt-6">
          <!-- Create new collection -->
          <div class="flex items-center gap-3">
            <Input
              v-model="newCollectionName"
              type="text"
              placeholder="New collection name..."
              class="flex-1 h-12"
              :class="isDark ? 'bg-[#252837] border-[#2a2d3e] text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200'"
              @keyup.enter="handleCreateCollection"
            />
            <Button
              @click="handleCreateCollection"
              :disabled="!newCollectionName.trim()"
              size="lg"
              class="h-12 px-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Plus :size="20" />
            </Button>
          </div>

          <!-- Collections list -->
          <ScrollArea class="max-h-[500px]">
            <div v-if="collectionsWithIcons.length > 0" class="space-y-3">
              <div
                v-for="collection in collectionsWithIcons"
                :key="collection.id"
                class="group border rounded-xl p-5 transition-all hover:shadow-sm"
                :class="isDark ? 'bg-[#252837] border-[#2a2d3e] hover:border-[#3a3d4e]' : 'bg-gray-50 border-gray-200 hover:border-gray-300'"
              >
                <div class="flex items-start justify-between mb-4">
                  <div class="flex items-center gap-3">
                    <div
                      class="w-10 h-10 rounded-full flex-shrink-0"
                      :style="{ backgroundColor: collection.color }"
                    />
                    <div>
                      <h4
                        class="font-semibold text-lg"
                        :class="isDark ? 'text-white' : 'text-gray-900'"
                      >
                        {{ collection.name }}
                      </h4>
                      <p
                        class="text-sm"
                        :class="isDark ? 'text-gray-500' : 'text-gray-500'"
                      >
                        ({{ collection.iconIds.length }})
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    :class="isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'"
                    @click="handleDeleteCollection(collection.id)"
                  >
                    <Trash2 :size="16" />
                  </Button>
                </div>

                <!-- Icon Preview Grid -->
                <div v-if="collection.icons.length > 0" class="flex gap-2.5 flex-wrap">
                  <div
                    v-for="icon in collection.icons.slice(0, 8)"
                    :key="icon.id"
                    class="w-14 h-14 border rounded-lg flex items-center justify-center transition-colors hover:border-purple-500/50 cursor-pointer"
                    :class="isDark ? 'bg-[#1c1f2e] border-[#2a2d3e]' : 'bg-white border-gray-200'"
                    @click="openIconDetail(icon)"
                  >
                    <div
                      v-if="icon.svgContent || icon.svg_content"
                      class="w-7 h-7 [&>svg]:w-full [&>svg]:h-full"
                      v-html="sanitizeSvg(icon.svgContent || icon.svg_content)"
                    />
                  </div>
                  <div
                    v-if="collection.icons.length > 8"
                    class="w-14 h-14 border rounded-lg flex items-center justify-center text-xs font-medium"
                    :class="isDark ? 'bg-[#1c1f2e] border-[#2a2d3e] text-gray-500' : 'bg-white border-gray-200 text-gray-400'"
                  >
                    +{{ collection.icons.length - 8 }}
                  </div>
                </div>
                <p
                  v-else
                  class="text-sm italic"
                  :class="isDark ? 'text-gray-500' : 'text-gray-400'"
                >
                  No icons in this collection yet
                </p>
              </div>
            </div>
            <div v-else class="text-center py-16">
              <Layers
                :size="64"
                class="mx-auto mb-4"
                :class="isDark ? 'text-gray-700' : 'text-gray-300'"
              />
              <p
                class="text-lg font-medium mb-2"
                :class="isDark ? 'text-gray-400' : 'text-gray-500'"
              >
                No collections yet
              </p>
              <p
                class="text-sm"
                :class="isDark ? 'text-gray-600' : 'text-gray-400'"
              >
                Create a collection above to organize your icons
              </p>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>

    <!-- History Modal -->
    <Dialog v-model:open="showHistory">
      <DialogContent
        class="max-w-3xl"
        :class="isDark ? 'bg-[#1c1f2e] border-[#2a2d3e]' : 'bg-white border-gray-200'"
      >
        <DialogHeader class="flex-row items-center gap-3 space-y-0">
          <div
            class="flex items-center justify-center w-12 h-12 rounded-xl"
            :class="isDark ? 'bg-blue-500/20' : 'bg-blue-50'"
          >
            <Clock :size="24" class="text-blue-500" />
          </div>
          <div class="flex-1">
            <DialogTitle class="text-2xl" :class="isDark ? 'text-white' : 'text-gray-900'">
              History
            </DialogTitle>
            <DialogDescription :class="isDark ? 'text-gray-400' : 'text-gray-500'">
              Your recent icon activity
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea class="max-h-[500px] mt-6">
          <div v-if="historyEntries.length > 0" class="space-y-2">
            <div
              v-for="(entry, index) in historyEntries"
              :key="index"
              class="flex items-center gap-4 p-4 rounded-lg transition-colors hover:shadow-sm group"
              :class="isDark ? 'bg-[#252837] hover:bg-[#2a2d3e]' : 'bg-gray-50 hover:bg-gray-100'"
            >
              <!-- Action Icon -->
              <div
                class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                :class="[
                  entry.action === 'view' ? (isDark ? 'bg-blue-500/20' : 'bg-blue-50') : '',
                  entry.action === 'copy' ? (isDark ? 'bg-green-500/20' : 'bg-green-50') : '',
                  entry.action === 'download' ? (isDark ? 'bg-purple-500/20' : 'bg-purple-50') : ''
                ]"
              >
                <Eye v-if="entry.action === 'view'" :size="20" class="text-blue-500" />
                <Copy v-else-if="entry.action === 'copy'" :size="20" class="text-green-500" />
                <Download v-else :size="20" class="text-purple-500" />
              </div>

              <!-- Icon Details -->
              <div class="flex-1 min-w-0">
                <div
                  class="text-[15px] font-medium truncate"
                  :class="isDark ? 'text-gray-200' : 'text-gray-900'"
                >
                  {{ entry.iconName }}
                </div>
                <div
                  class="flex items-center gap-2 text-sm mt-0.5"
                  :class="isDark ? 'text-gray-500' : 'text-gray-500'"
                >
                  <span class="capitalize">{{ entry.action }}</span>
                  <span>•</span>
                  <span>{{ entry.formattedTime }}</span>
                </div>
              </div>

              <!-- Icon Preview (right side) -->
              <div
                v-if="entry.icon?.svgContent || entry.icon?.svg_content"
                class="w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0"
                :class="isDark ? 'bg-[#1c1f2e] border-[#2a2d3e]' : 'bg-white border-gray-200'"
              >
                <div
                  class="w-6 h-6 [&>svg]:w-full [&>svg]:h-full"
                  v-html="sanitizeSvg(entry.icon.svgContent || entry.icon.svg_content)"
                />
              </div>
            </div>
          </div>
          <div v-else class="text-center py-16">
            <Clock
              :size="64"
              class="mx-auto mb-4"
              :class="isDark ? 'text-gray-700' : 'text-gray-300'"
            />
            <p
              class="text-lg font-medium mb-2"
              :class="isDark ? 'text-gray-400' : 'text-gray-500'"
            >
              No recent activity
            </p>
            <p
              class="text-sm"
              :class="isDark ? 'text-gray-600' : 'text-gray-400'"
            >
              Your icon actions will appear here
            </p>
          </div>
        </ScrollArea>

        <!-- Footer with Clear Button -->
        <div
          v-if="historyEntries.length > 0"
          class="flex justify-end pt-4 border-t mt-6"
          :class="isDark ? 'border-[#2a2d3e]' : 'border-gray-200'"
        >
          <Button
            @click="handleClearHistory"
            variant="outline"
            :class="isDark ? 'border-[#2a2d3e] text-gray-400 hover:bg-[#252837] hover:text-red-400' : 'border-gray-200 hover:bg-red-50 hover:text-red-500'"
          >
            <Trash2 :size="16" class="mr-2" />
            Clear History
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Settings Modal -->
    <SettingsModal :open="showSettings" @update:open="showSettings = $event" />

    <!-- Command Palette (Headless UI Combobox) -->
    <CommandPalette
      :open="showCommandPalette"
      @update:open="showCommandPalette = $event"
      @show-favorites="showFavorites = true"
      @show-history="showHistory = true"
      @show-collections="showCollections = true"
      @show-settings="showSettings = true"
      @toggle-theme="$ichava.theme().toggle()"
      @reset-filters="resetFilters()"
    />

    <!-- Icon Detail Modal -->
    <IconModal
      v-if="selectedIconForDetail"
      :selected-icon="selectedIconForDetail"
      :open="showIconDetail"
      :is-dark="isDark"
      :icon-color="iconColor"
      :favorites="favoriteIcons"
      @update:open="(v) => { if (!v) closeIconDetail() }"
      @close="closeIconDetail"
      @copy="({ code, type }) => copyToClipboard(code, selectedIconForDetail?.id, type)"
      @toggleFavorite="handleToggleFavorite(selectedIconForDetail.id, selectedIconForDetail.name)"
      @download="handleDownload(selectedIconForDetail.id, selectedIconForDetail.name)"
    />
  </div>
</template>

<style scoped>
/* Fade transition for loading overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide down transition for error banner */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* Icon SVG styling - preserve original colors by default */
.icon-svg :deep(svg) {
  width: 100%;
  height: 100%;
}

/* Only apply color overrides when icon-colored class is present */
.icon-svg.icon-colored :deep(svg) {
  fill: currentColor;
  stroke: currentColor;
}

.icon-svg.icon-colored :deep(svg path),
.icon-svg.icon-colored :deep(svg circle),
.icon-svg.icon-colored :deep(svg rect),
.icon-svg.icon-colored :deep(svg line),
.icon-svg.icon-colored :deep(svg polyline),
.icon-svg.icon-colored :deep(svg polygon) {
  fill: inherit;
  stroke: inherit;
}

/* For outline icons that use stroke only */
.icon-svg.icon-colored :deep(svg[fill="none"]) {
  fill: none;
}

.icon-svg.icon-colored :deep(svg[fill="none"] path),
.icon-svg.icon-colored :deep(svg[fill="none"] circle),
.icon-svg.icon-colored :deep(svg[fill="none"] rect),
.icon-svg.icon-colored :deep(svg[fill="none"] line) {
  fill: none;
  stroke: currentColor;
}
</style>
