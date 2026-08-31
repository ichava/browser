/**
 * Ichava Module - Barrel Export
 * 
 * Single entry point for all Ichava functionality with live API integration.
 * 
 * @example
 * ```typescript
 * // Import everything
 * import { ichava, useIchava, IchavaPlugin } from '@/ichava'
 * 
 * // Use in Vue app
 * app.use(IchavaPlugin)
 * 
 * // Use in composable
 * const { icons, favorites, collections } = useIchava()
 * ```
 */

import type { App, Plugin } from 'vue'
import { toRef, computed, onMounted, ref } from 'vue'
import { ichava } from './IchavaClient'
import { state, loadPersistedState, applyPreferencesFromApi, buildPreferencesForApi, persistState } from './state'
import type { 
  IchavaPluginOptions,
  Icon,
  ViewMode,
  SortField,
  SortOrder,
  HistoryAction,
} from './types'

// =============================================================================
// DEBOUNCE UTILITY
// =============================================================================

function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return ((...args: unknown[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }) as T
}

// =============================================================================
// VUE PLUGIN
// =============================================================================

/**
 * Vue Plugin for Ichava
 */
export const IchavaPlugin: Plugin = {
  install(app: App, options?: IchavaPluginOptions) {
    // Configure client
    if (options?.config) {
      ichava.configure(options.config)
    }

    // Provide globally
    app.provide('ichava', ichava)
    
    // Add global property
    app.config.globalProperties.$ichava = ichava

    // Initialize on app mount
    app.mixin({
      async mounted() {
        if (!state.isInitialized) {
          await loadInitialData()
        }
      },
    })
  },
}

// =============================================================================
// LARAVEL CONFIG TYPES
// =============================================================================

declare global {
  interface Window {
    ichavaConfig?: {
      packages?: unknown[]
      categories?: unknown[]
      preferences?: Record<string, unknown>
      statistics?: { total?: number }
      user?: unknown
    }
    ichavaApp?: unknown
    $ichavaEvent?: unknown
  }
}

// =============================================================================
// INITIAL DATA LOADING
// =============================================================================

let initializationPromise: Promise<void> | null = null

/**
 * Load initial data from Laravel config or API
 */
async function loadInitialData(): Promise<void> {
  // Prevent multiple initializations
  if (initializationPromise) {
    return initializationPromise
  }
  
  if (state.isInitialized) {
    return
  }

  initializationPromise = (async () => {
    state.isLoading = true
    state.error = null

    try {
      // 1. Load theme from localStorage first (immediate visual feedback)
      loadPersistedState()

      // Initialize ichava client
      await ichava.initialize()

      // Check if Laravel provided initial data via window.ichavaConfig
      const laravelConfig = window.ichavaConfig
      
      // 2. Load preferences from API session (overrides localStorage)
      if (laravelConfig?.preferences) {
        applyPreferencesFromApi(laravelConfig.preferences)
      } else {
        const apiPrefs = await loadPreferencesFromApi()
        // If API has no preferences, localStorage fallback was already loaded above
        if (!apiPrefs) {
          console.debug('[Ichava] No API preferences, using localStorage fallback')
        }
      }

      // Load data from Laravel config or API
      let packagesResult, categoriesResult, favoritesResult, collectionsResult, historyResult
      
      if (laravelConfig?.packages && laravelConfig?.categories) {
        // Use Laravel-provided data
        packagesResult = { status: 'fulfilled' as const, value: laravelConfig.packages }
        categoriesResult = { status: 'fulfilled' as const, value: laravelConfig.categories }
        
        // Still fetch user-specific data from API
        ;[favoritesResult, collectionsResult, historyResult] = await Promise.allSettled([
          ichava.favorites().fetch(),
          ichava.collections().fetch(),
          ichava.history().fetch(),
        ])
      } else {
        // Load all data from API
        ;[packagesResult, categoriesResult, favoritesResult, collectionsResult, historyResult] = await Promise.allSettled([
          ichava.icons().getPackages(),
          ichava.icons().getCategories(),
          ichava.favorites().fetch(),
          ichava.collections().fetch(),
          ichava.history().fetch(),
        ])
      }

      // Update shared state with API results
      if (packagesResult.status === 'fulfilled') {
        state.packages = packagesResult.value
        const validPackageIds = packagesResult.value.map(p => p.id)
        
        // Check if we have valid persisted package selections
        const hasPersistedSelection = state.selectedPackageIds.length > 0
        const persistedAreValid = hasPersistedSelection && 
          state.selectedPackageIds.every(id => validPackageIds.includes(id))
        
        if (persistedAreValid) {
          // Keep persisted selection - user's choice is preserved!
          console.debug('[Ichava] Using persisted package selection:', state.selectedPackageIds.length, 'packages')
        } else {
          // No valid persisted selection - default to all packages
          state.selectedPackageIds = validPackageIds
          console.debug('[Ichava] Defaulting to all packages:', validPackageIds.length)
        }
      }

      if (categoriesResult.status === 'fulfilled') {
        state.categories = categoriesResult.value
        
        // Validate persisted category selections against available categories
        if (state.selectedCategoryIds.length > 0) {
          const allCategoryIds: string[] = []
          state.categories.forEach(group => {
            group.categories?.forEach(cat => {
              allCategoryIds.push(cat.id)
              cat.subcategories?.forEach(sub => allCategoryIds.push(sub.id))
            })
          })
          
          // Filter out any invalid category IDs
          const validPersistedCategories = state.selectedCategoryIds.filter(id => allCategoryIds.includes(id))
          if (validPersistedCategories.length !== state.selectedCategoryIds.length) {
            console.debug('[Ichava] Filtered invalid category IDs:', state.selectedCategoryIds.length - validPersistedCategories.length)
            state.selectedCategoryIds = validPersistedCategories
          }
        }
      }

      if (favoritesResult.status === 'fulfilled') {
        state.favoriteIds = ichava.favorites().getAll()
      }

      if (collectionsResult.status === 'fulfilled') {
        state.collections = ichava.collections().getAll()
      }

      if (historyResult.status === 'fulfilled') {
        state.historyEntries = ichava.history().getAll()
      }

      // Load initial icons
      await loadIcons()

      state.isInitialized = true
    } catch (error) {
      console.error('[Ichava] Failed to load initial data:', error)
      state.error = error instanceof Error ? error.message : 'Failed to load data'
    } finally {
      state.isLoading = false
      initializationPromise = null
    }
  })()

  return initializationPromise
}

/**
 * Load icons from API based on current filters
 */
async function loadIcons(): Promise<void> {
  try {
    // If no packages selected, show empty results (user cleared all)
    if (state.selectedPackageIds.length === 0 && state.packages.length > 0) {
      state.icons = []
      state.totalIcons = 0
      state.lastPage = 1
      return
    }

    const query = ichava.icons().query()
    
    // Only filter by packages if NOT all packages are selected
    // This avoids sending unnecessary params (Laravel has issues with many query params)
    const allPackagesSelected = state.selectedPackageIds.length === state.packages.length
    if (!allPackagesSelected && state.selectedPackageIds.length > 0) {
      query.wherePackage(state.selectedPackageIds)
    }
    
    // Only filter by categories if some are selected
    if (state.selectedCategoryIds.length > 0) {
      query.whereCategory(state.selectedCategoryIds)
    }
    
    // Only add search if there's a query
    if (state.searchQuery) {
      query.search(state.searchQuery)
    }
    
    // Always add pagination (using simple params)
    const result = await query
      .paginate(state.currentPage, state.perPage)
      .get()

    state.icons = result.data
    state.totalIcons = result.total
    state.lastPage = result.lastPage
  } catch (error) {
    console.error('[Ichava] Failed to load icons:', error)
  }
}

// Debounced version for search
const loadIconsDebounced = debounce(loadIcons, 300)

// Debounced sync preferences to API + localStorage
const syncPreferencesToApi = debounce(async () => {
  try {
    const prefs = buildPreferencesForApi()
    
    // Sync to API session
    await ichava.getHttpClient().post('/preferences', prefs)
    console.debug('[Ichava] Synced preferences to API session')
    
    // Also save to localStorage as backup
    persistState()
    console.debug('[Ichava] Backed up preferences to localStorage')
  } catch (error) {
    console.warn('[Ichava] Failed to sync preferences to API:', error)
    // Still try to save to localStorage even if API fails
    persistState()
  }
}, 500)

/**
 * Load preferences from backend API
 * Returns true if preferences were loaded, false if none found
 */
async function loadPreferencesFromApi(): Promise<boolean> {
  try {
    const response = await ichava.getHttpClient().get('/preferences') as { success?: boolean; data?: Record<string, unknown> }
    if (response?.success && response?.data) {
      applyPreferencesFromApi(response.data)
      console.debug('[Ichava] Loaded preferences from API session')
      return true
    }
    return false
  } catch (error) {
    console.warn('[Ichava] Failed to load preferences from API:', error)
    return false
  }
}

// =============================================================================
// COMPOSABLE
// =============================================================================

/**
 * useIchava - Main composable for Ichava
 * 
 * Provides reactive access to all Ichava managers and utilities.
 * Uses shared state for cross-component reactivity.
 */
export function useIchava() {
  // Initialize on mount
  onMounted(async () => {
    if (!state.isInitialized && !initializationPromise) {
      await loadInitialData()
    }
  })

  // ==========================================================================
  // SHARED STATE REFS
  // ==========================================================================

  const allIcons = toRef(state, 'icons')
  const packages = toRef(state, 'packages')
  const categories = toRef(state, 'categories')
  const selectedPackageIds = toRef(state, 'selectedPackageIds')
  const selectedCategoryIds = toRef(state, 'selectedCategoryIds')
  const favoriteIds = toRef(state, 'favoriteIds')
  const collections = toRef(state, 'collections')
  const viewMode = toRef(state, 'viewMode')
  const iconSize = toRef(state, 'iconSize')
  const iconColor = toRef(state, 'iconColor')
  const sortBy = toRef(state, 'sortBy')
  const sortOrder = toRef(state, 'sortOrder')
  const currentPage = toRef(state, 'currentPage')
  const perPage = toRef(state, 'perPage')
  const searchQuery = toRef(state, 'searchQuery')
  const searchScope = toRef(state, 'searchScope')
  const packageSearchQuery = toRef(state, 'packageSearchQuery')
  const categorySearchQuery = toRef(state, 'categorySearchQuery')
  const isDark = toRef(state, 'isDark')
  const isLoading = toRef(state, 'isLoading')
  const isInitialized = toRef(state, 'isInitialized')
  const error = toRef(state, 'error')

  // ==========================================================================
  // COMPUTED PROPERTIES
  // ==========================================================================

  const selectedPackages = computed(() => 
    state.packages.filter(pkg => state.selectedPackageIds.includes(pkg.id))
  )

  const totalIconCount = computed(() =>
    state.packages.reduce((sum, pkg) => sum + pkg.count, 0)
  )

  const selectedIconCount = computed(() =>
    selectedPackages.value.reduce((sum, pkg) => sum + pkg.count, 0)
  )

  const loadedIconCount = computed(() => state.icons.length)

  const filteredCount = computed(() => state.totalIcons)

  const totalPages = computed(() => state.lastPage)

  const favoritesCount = computed(() => state.favoriteIds.length)

  const favoriteIcons = computed(() =>
    state.icons.filter(icon => state.favoriteIds.includes(icon.id))
  )

  const collectionsCount = computed(() => state.collections.length)

  const collectionsWithIcons = computed(() =>
    state.collections.map(col => ({
      ...col,
      icons: state.icons.filter(icon => col.iconIds.includes(icon.id))
    }))
  )

  const historyCount = computed(() => state.historyEntries.length)

  const formattedHistoryEntries = computed(() =>
    state.historyEntries.map(entry => ({
      ...entry,
      iconName: state.icons.find(i => i.id === entry.iconId)?.name || `Icon ${entry.iconId}`,
      formattedTime: formatTimeAgo(entry.timestamp),
    }))
  )

  // ==========================================================================
  // ICON ACTIONS
  // ==========================================================================

  const selectedIcon = computed(() => {
    if (state.selectedIconId === null) return null
    return state.icons.find(i => i.id === state.selectedIconId) || null
  })

  const selectIcon = (icon: Icon | null) => {
    state.selectedIconId = icon?.id ?? null
    if (icon) {
      ichava.browser().selectIcon(icon.id)
    } else {
      ichava.browser().deselectIcon()
    }
  }

  const getIconById = (id: number): Icon | undefined => {
    return state.icons.find(icon => icon.id === id)
  }

  const getIconsByIds = (ids: number[]): Icon[] => {
    return state.icons.filter(icon => ids.includes(icon.id))
  }

  // ==========================================================================
  // FAVORITES ACTIONS
  // ==========================================================================

  const toggleFavorite = async (iconId: number) => {
    // Optimistic update
    const wasFavorite = state.favoriteIds.includes(iconId)
    if (wasFavorite) {
      state.favoriteIds = state.favoriteIds.filter(id => id !== iconId)
    } else {
      state.favoriteIds = [...state.favoriteIds, iconId]
    }

    // Sync to API
    try {
      await ichava.favorites().toggleAsync(iconId)
      // Update state from manager (in case API returned different result)
      state.favoriteIds = ichava.favorites().getAll()
    } catch (error) {
      // Rollback on error
      if (wasFavorite) {
        state.favoriteIds = [...state.favoriteIds, iconId]
      } else {
        state.favoriteIds = state.favoriteIds.filter(id => id !== iconId)
      }
      console.error('[useIchava] Failed to toggle favorite:', error)
    }
    // Favorites are synced via dedicated API - no localStorage needed
  }

  const isFavorite = (iconId: number) => {
    return state.favoriteIds.includes(iconId)
  }

  // ==========================================================================
  // COLLECTION ACTIONS
  // ==========================================================================

  const createCollection = async (name: string, color?: string) => {
    const collection = await ichava.collections().createAsync(name, color)
    if (collection) {
      state.collections = ichava.collections().getAll()
      // Collections synced via dedicated API
    }
    return collection
  }

  const deleteCollection = async (id: string) => {
    await ichava.collections().deleteAsync(id)
    state.collections = ichava.collections().getAll()
    // Collections synced via dedicated API
  }

  const addIconToCollection = async (collectionId: string, iconId: number) => {
    await ichava.collections().addIconAsync(collectionId, iconId)
    state.collections = ichava.collections().getAll()
    // Collections synced via dedicated API
  }

  const removeIconFromCollection = async (collectionId: string, iconId: number) => {
    await ichava.collections().removeIconAsync(collectionId, iconId)
    state.collections = ichava.collections().getAll()
    // Collections synced via dedicated API
  }

  const isIconInCollection = (collectionId: string, iconId: number) => {
    return ichava.collections().hasIcon(collectionId, iconId)
  }

  // ==========================================================================
  // HISTORY ACTIONS
  // ==========================================================================

  const addHistoryEntry = async (iconId: number, action: HistoryAction) => {
    const icon = getIconById(iconId)
    const iconName = icon?.name || `Icon ${iconId}`
    
    await ichava.history().addAsync(iconId, iconName, action)
    state.historyEntries = ichava.history().getAll()
    // History synced via dedicated API
  }

  const clearHistory = async () => {
    await ichava.history().clearAsync()
    state.historyEntries = []
    // History synced via dedicated API
  }

  // ==========================================================================
  // COMMAND HISTORY ACTIONS
  // ==========================================================================

  const commandHistory = toRef(() => ichava.commandHistory())
  const recentCommands = ref<any[]>([])

  const loadCommandHistory = async () => {
    const history = await ichava.commandHistory().getRecentCommands()
    recentCommands.value = history
  }

  const addCommandHistory = async (command: string, type: 'action' | 'search' | 'navigation', metadata = {}) => {
    await ichava.commandHistory().addCommand(command, type, metadata)
    await loadCommandHistory() // Refresh the list
  }

  const clearCommandHistory = async () => {
    await ichava.commandHistory().clearHistory()
    recentCommands.value = []
  }

  // ==========================================================================
  // BROWSER ACTIONS
  // ==========================================================================

  const setViewMode = (mode: ViewMode) => {
    state.viewMode = mode
    ichava.browser().setViewMode(mode)
    syncPreferencesToApi() // Sync to backend session
  }

  const toggleViewMode = () => {
    const newMode = state.viewMode === 'grid' ? 'list' : 'grid'
    setViewMode(newMode)
  }

  const setIconSize = (size: number) => {
    state.iconSize = size
    ichava.browser().setIconSize(size)
    syncPreferencesToApi() // Sync to backend session
  }

  const setIconColor = (color: string) => {
    state.iconColor = color
    ichava.browser().setIconColor(color)
    syncPreferencesToApi() // Sync to backend session
  }

  const setSortBy = async (field: SortField) => {
    state.sortBy = field
    ichava.browser().setSortBy(field)
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  const setSortOrder = async (order: SortOrder) => {
    state.sortOrder = order
    ichava.browser().setSortOrder(order)
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  const toggleSortOrder = async () => {
    const newOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'
    await setSortOrder(newOrder)
  }

  const setPage = async (page: number) => {
    state.currentPage = page
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  const setSearchQuery = async (query: string) => {
    state.searchQuery = query
    state.currentPage = 1
    ichava.browser().setSearch(query)
    loadIconsDebounced()
    syncPreferencesToApi() // Sync to backend session
  }

  const setSearchScope = (scope: 'all' | 'icons' | 'packages' | 'categories') => {
    ichava.setSearchScope(scope)
  }

  const setPackageSearch = (query: string) => {
    ichava.setPackageSearch(query)
  }

  const setCategorySearch = (query: string) => {
    ichava.setCategorySearch(query)
  }

  // ==========================================================================
  // PACKAGE/CATEGORY ACTIONS
  // ==========================================================================

  const togglePackage = async (packageId: string) => {
    const index = state.selectedPackageIds.indexOf(packageId)
    if (index > -1) {
      state.selectedPackageIds = state.selectedPackageIds.filter(id => id !== packageId)
    } else {
      state.selectedPackageIds = [...state.selectedPackageIds, packageId]
    }
    state.currentPage = 1
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  const selectAllPackages = async () => {
    // Select all packages
    state.selectedPackageIds = state.packages.map(pkg => pkg.id)
    // Also select all categories (nested under each package)
    const allCategoryIds: string[] = []
    state.categories.forEach(catGroup => {
      catGroup.categories?.forEach(cat => {
        allCategoryIds.push(cat.id)
        // Also include subcategories
        cat.subcategories?.forEach(subcat => {
          allCategoryIds.push(subcat.id)
        })
      })
    })
    state.selectedCategoryIds = allCategoryIds
    state.currentPage = 1
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  const clearAllPackages = async () => {
    // Clear all packages AND all categories
    state.selectedPackageIds = []
    state.selectedCategoryIds = []
    state.currentPage = 1
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  const toggleCategory = async (categoryId: string) => {
    const index = state.selectedCategoryIds.indexOf(categoryId)
    if (index > -1) {
      state.selectedCategoryIds = state.selectedCategoryIds.filter(id => id !== categoryId)
    } else {
      state.selectedCategoryIds = [...state.selectedCategoryIds, categoryId]
    }
    state.currentPage = 1
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  const clearAllCategories = async () => {
    state.selectedCategoryIds = []
    state.currentPage = 1
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  const getCategoriesForPackage = (packageId: string) => {
    return state.categories.find(cat => cat.id === packageId)?.categories || []
  }

  const resetFilters = async () => {
    state.searchQuery = ''
    state.currentPage = 1
    state.selectedPackageIds = state.packages.map(pkg => pkg.id)
    state.selectedCategoryIds = []
    ichava.browser().resetFilters()
    await loadIcons()
    syncPreferencesToApi() // Sync to backend session
  }

  // ==========================================================================
  // THEME ACTIONS
  // ==========================================================================

  const toggleTheme = () => {
    state.isDark = !state.isDark
    ichava.theme().setDark(state.isDark)
    document.documentElement.classList.toggle('dark', state.isDark)
    syncPreferencesToApi() // Sync theme to backend session
  }

  const setTheme = (dark: boolean) => {
    state.isDark = dark
    ichava.theme().setDark(dark)
    document.documentElement.classList.toggle('dark', dark)
    syncPreferencesToApi() // Sync theme to backend session
  }

  // Initialize theme on first load
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', state.isDark)
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  const copyToClipboard = async (text: string) => {
    return ichava.copyToClipboard(text)
  }

  const downloadIcon = async (icon: Icon) => {
    await ichava.downloadIcon(icon)
    await addHistoryEntry(icon.id, 'download')
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  // ==========================================================================
  // REFRESH FUNCTIONS
  // ==========================================================================

  const refreshIcons = async () => {
    await loadIcons()
  }

  const refreshAll = async () => {
    state.isLoading = true
    try {
      await Promise.all([
        ichava.favorites().fetch(),
        ichava.collections().fetch(),
        ichava.history().fetch(),
      ])
      state.favoriteIds = ichava.favorites().getAll()
      state.collections = ichava.collections().getAll()
      state.historyEntries = ichava.history().getAll()
      await loadIcons()
    } finally {
      state.isLoading = false
    }
  }

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Client
    client: ichava,
    isInitialized,
    isLoading,
    error,

    // Icons
    allIcons,
    filteredIcons: allIcons, // Alias for compatibility
    paginatedIcons: allIcons, // Icons are already paginated from API
    filteredCount,
    totalPages,
    getIconById,
    getIconsByIds,
    selectedIcon,
    selectIcon,
    refreshIcons,
    refreshAll,

    // Packages
    packages,
    categories,
    selectedPackageIds,
    selectedCategoryIds,
    selectedPackages,
    totalIconCount,
    selectedIconCount,
    loadedIconCount,
    togglePackage,
    selectAllPackages,
    clearAllPackages,
    toggleCategory,
    clearAllCategories,
    getCategoriesForPackage,

    // Favorites
    favoriteIds,
    favoritesCount,
    favoriteIcons,
    toggleFavorite,
    isFavorite,

    // Collections
    collections,
    collectionsCount,
    collectionsWithIcons,
    createCollection,
    deleteCollection,
    addIconToCollection,
    removeIconFromCollection,
    isIconInCollection,

    // History
    historyEntries: formattedHistoryEntries,
    historyCount,
    addHistoryEntry,
    clearHistory,

    // Command History
    commandHistory,
    recentCommands,
    loadCommandHistory,
    addCommandHistory,
    clearCommandHistory,

    // Browser
    viewMode,
    iconSize,
    iconColor,
    sortBy,
    sortOrder,
    currentPage,
    perPage,
    searchQuery,
    searchScope,
    packageSearchQuery,
    categorySearchQuery,
    setViewMode,
    toggleViewMode,
    setIconSize,
    setIconColor,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    setPage,
    setSearchQuery,
    setSearchScope,
    setPackageSearch,
    setCategorySearch,
    resetFilters,

    // Theme
    isDark,
    toggleTheme,
    setTheme,

    // Toast
    toast: ichava.toast(),
    showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
      ichava.toast()[type](title, message)
    },

    // Utilities
    copyToClipboard,
    downloadIcon,
    formatNumber,
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function formatTimeAgo(timestamp: string): string {
  try {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  } catch {
    return timestamp
  }
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Main client
export { IchavaClient, ichava } from './IchavaClient'

// Types
export * from './types'

// Core
export { EventBus, eventBus } from './core/EventBus'
export { StorageAdapter, storage } from './core/StorageAdapter'
export { HttpClient, createHttpClient, RequestBuilder } from './core/HttpClient'

// Managers
export { BaseManager, ArrayManager, StateManager } from './managers/BaseManager'
export { IconManager, IconQueryBuilder } from './managers/IconManager'
export { FavoriteManager } from './managers/FavoriteManager'
export { CollectionManager, CollectionBuilder } from './managers/CollectionManager'
export { HistoryManager } from './managers/HistoryManager'
export { CommandHistoryManager } from './managers/CommandHistoryManager'
export { BrowserManager } from './managers/BrowserManager'
export { ThemeManager } from './managers/ThemeManager'
export { ToastManager } from './managers/ToastManager'

// Utils
export { Clipboard, copyToClipboard } from './utils/Clipboard'
export { Download, downloadSvg } from './utils/Download'
export { Formatter, formatNumber, formatCompact, formatTimeAgo, formatBytes } from './utils/Formatter'

// State
export { state, useSharedState, loadPersistedState, persistState } from './state'

// Storage
export { localStorageManager, LocalStorageManager } from './storage'
export type { StoredPreferences } from './storage'

// Composables
export { useRoute, route } from './composables/useRoute'
export type { RouteParams } from './composables/useRoute'

// Default export
export default ichava
