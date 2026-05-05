/**
 * Ichava Shared Reactive State
 * 
 * Singleton reactive state that is shared across all components.
 * This solves the cross-component reactivity issue where different
 * useIchava() instances have their own separate state.
 * 
 * Persistence Strategy:
 * - Primary: Session storage (via API) - cleared on session end
 * - Fallback: localStorage - persists across sessions (30 days)
 */

import { reactive, computed, toRefs } from 'vue'
import { localStorageManager } from './storage/LocalStorageManager'
import type { 
  Icon, 
  IconPackage, 
  CategoryGroup, 
  Collection, 
  HistoryEntry,
  ViewMode,
  SortField,
  SortOrder,
} from './types'

// =============================================================================
// STATE INTERFACE
// =============================================================================

export interface IchavaState {
  // Data
  icons: Icon[]
  packages: IconPackage[]
  categories: CategoryGroup[]
  favoriteIds: number[]
  collections: Collection[]
  historyEntries: HistoryEntry[]
  
  // Filter state
  selectedPackageIds: string[]
  selectedCategoryIds: string[]
  
  // Browser state
  viewMode: ViewMode
  iconSize: number
  iconColor: string
  sortBy: SortField
  sortOrder: SortOrder
  currentPage: number
  perPage: number
  searchQuery: string
  selectedIconId: number | null
  
  // Unified search
  searchScope: 'all' | 'icons' | 'packages' | 'categories'
  packageSearchQuery: string
  categorySearchQuery: string
  
  // Theme
  isDark: boolean
  
  // UI state
  isLoading: boolean
  isInitialized: boolean
  error: string | null
  
  // Pagination from API
  totalIcons: number
  lastPage: number
}

// =============================================================================
// DEFAULT STATE
// =============================================================================

const DEFAULT_STATE: IchavaState = {
  icons: [],
  packages: [],
  categories: [],
  favoriteIds: [],
  collections: [],
  historyEntries: [],
  
  selectedPackageIds: [],
  selectedCategoryIds: [],
  
  viewMode: 'grid',
  iconSize: 48,
  iconColor: '', // Empty = original SVG colors
  sortBy: 'name',
  sortOrder: 'asc',
  currentPage: 1,
  perPage: 60,
  searchQuery: '',
  selectedIconId: null,
  
  searchScope: 'icons',
  packageSearchQuery: '',
  categorySearchQuery: '',
  
  isDark: true,
  
  isLoading: false,
  isInitialized: false,
  error: null,
  
  totalIcons: 0,
  lastPage: 1,
}

// =============================================================================
// REACTIVE STATE SINGLETON
// =============================================================================

/**
 * The shared reactive state object.
 * All components using useIchava() will share this same state.
 */
export const state = reactive<IchavaState>({ ...DEFAULT_STATE })

// =============================================================================
// STATE HELPERS
// =============================================================================

/**
 * Reset state to defaults
 */
export function resetState(): void {
  Object.assign(state, DEFAULT_STATE)
}

/**
 * Load preferences from localStorage as fallback
 * Called when API/session doesn't have preferences
 */
export function loadPersistedState(): void {
  const stored = localStorageManager.load()
  if (stored) {
    console.debug('[Ichava] Loading preferences from localStorage fallback')
    applyPreferencesFromApi(stored)
  }
}

/**
 * Apply preferences data from API response to state
 */
export function applyPreferencesFromApi(data: Record<string, unknown>): void {
  try {
    // Filters
    const filters = data.filters as Record<string, unknown> | undefined
    if (filters) {
      if (typeof filters.search === 'string') {
        state.searchQuery = filters.search
      }
      if (Array.isArray(filters.packages)) {
        state.selectedPackageIds = filters.packages as string[]
      }
      if (Array.isArray(filters.categories)) {
        state.selectedCategoryIds = filters.categories as string[]
      }
    }

    // Sorting
    const sorting = data.sorting as Record<string, unknown> | undefined
    if (sorting) {
      if (sorting.sort_by === 'name' || sorting.sort_by === 'package' || sorting.sort_by === 'category') {
        state.sortBy = sorting.sort_by
      }
      if (sorting.sort_direction === 'asc' || sorting.sort_direction === 'desc') {
        state.sortOrder = sorting.sort_direction
      }
    }

    // Preferences (UI)
    const preferences = data.preferences as Record<string, unknown> | undefined
    if (preferences) {
      if (preferences.view_mode === 'grid' || preferences.view_mode === 'list') {
        state.viewMode = preferences.view_mode
      }
      if (typeof preferences.icon_size === 'number') {
        state.iconSize = preferences.icon_size
      }
      if (typeof preferences.per_page === 'number') {
        state.perPage = preferences.per_page
      }
      // Theme (dark mode)
      if (typeof preferences.is_dark === 'boolean') {
        state.isDark = preferences.is_dark
        // Apply theme to document
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', state.isDark)
        }
      }
      // Icon color (custom preview color)
      if (typeof preferences.icon_color === 'string') {
        state.iconColor = preferences.icon_color
      }
    }

    // Pagination
    const pagination = data.pagination as Record<string, unknown> | undefined
    if (pagination) {
      if (typeof pagination.current_page === 'number' && pagination.current_page > 0) {
        state.currentPage = pagination.current_page
      }
    }

    // Favorites
    if (Array.isArray(data.favorites)) {
      state.favoriteIds = data.favorites as number[]
    }

    // Collections
    if (Array.isArray(data.collections)) {
      state.collections = (data.collections as Array<Record<string, unknown>>).map(col => ({
        id: String(col.id || ''),
        name: String(col.name || ''),
        color: String(col.color || '#8b5cf6'),
        iconIds: Array.isArray(col.icon_ids) ? col.icon_ids as number[] : [],
        createdAt: String(col.created_at || new Date().toISOString()),
        updatedAt: String(col.created_at || new Date().toISOString()),
      }))
    }

    // History
    if (Array.isArray(data.history)) {
      state.historyEntries = (data.history as Array<Record<string, unknown>>).map(entry => ({
        id: String(entry.icon_id || Date.now()),
        iconId: Number(entry.icon_id) || 0,
        iconName: String(entry.icon_name || ''),
        action: (entry.action as 'view' | 'copy' | 'download') || 'view',
        timestamp: String(entry.timestamp || new Date().toISOString()),
      }))
    }

    console.debug('[Ichava] Applied preferences from API:', {
      packages: state.selectedPackageIds.length,
      categories: state.selectedCategoryIds.length,
      search: state.searchQuery,
      viewMode: state.viewMode,
      iconSize: state.iconSize,
      isDark: state.isDark,
      favorites: state.favoriteIds.length,
    })
  } catch (e) {
    console.warn('[Ichava] Failed to apply preferences from API:', e)
  }
}

/**
 * Build preferences object for API update
 */
export function buildPreferencesForApi(): Record<string, unknown> {
  return {
    filters: {
      search: state.searchQuery,
      packages: state.selectedPackageIds,
      categories: state.selectedCategoryIds,
    },
    sorting: {
      sort_by: state.sortBy,
      sort_direction: state.sortOrder,
    },
    preferences: {
      view_mode: state.viewMode,
      icon_size: state.iconSize,
      icon_color: state.iconColor,
      per_page: state.perPage,
      is_dark: state.isDark,
    },
    pagination: {
      current_page: state.currentPage,
      per_page: state.perPage,
    },
  }
}

/**
 * Persist current state to localStorage as backup
 * Called after successful API sync
 */
export function persistState(): void {
  const preferences = buildPreferencesForApi()
  localStorageManager.save(preferences)
}

// =============================================================================
// COMPUTED HELPERS
// =============================================================================

/**
 * Get selected packages
 */
export const selectedPackages = computed(() => 
  state.packages.filter(pkg => state.selectedPackageIds.includes(pkg.id))
)

/**
 * Get total icon count from packages
 */
export const totalIconCount = computed(() =>
  state.packages.reduce((sum, pkg) => sum + pkg.count, 0)
)

/**
 * Get filtered icon count
 */
export const filteredCount = computed(() => state.icons.length)

/**
 * Get favorite icons
 */
export const favoriteIcons = computed(() =>
  state.icons.filter(icon => state.favoriteIds.includes(icon.id))
)

/**
 * Get collections with icon data
 */
export const collectionsWithIcons = computed(() =>
  state.collections.map(col => ({
    ...col,
    icons: state.icons.filter(icon => col.iconIds.includes(icon.id))
  }))
)

/**
 * Get formatted history entries
 */
export const formattedHistoryEntries = computed(() =>
  state.historyEntries.map(entry => ({
    ...entry,
    iconName: state.icons.find(i => i.id === entry.iconId)?.name || `Icon ${entry.iconId}`,
    formattedTime: formatTimeAgo(entry.timestamp),
  }))
)

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
// EXPORTS
// =============================================================================

export function useSharedState() {
  return {
    state,
    ...toRefs(state),
    selectedPackages,
    totalIconCount,
    filteredCount,
    favoriteIcons,
    collectionsWithIcons,
    formattedHistoryEntries,
    resetState,
    loadPersistedState,
    persistState,
    applyPreferencesFromApi,
    buildPreferencesForApi,
  }
}

