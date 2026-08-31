/**
 * API Types & Interfaces
 * 
 * Standardized request/response types for all API communication
 */

// =============================================================================
// STANDARD API RESPONSE ENVELOPE
// =============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
  meta?: ApiMeta
}

export interface ApiMeta {
  timestamp?: string
  request_id?: string
  [key: string]: any
}

// =============================================================================
// PAGINATION
// =============================================================================

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta
}

export interface PaginationMeta extends ApiMeta {
  current_page: number
  from: number | null
  last_page: number
  path: string
  per_page: number
  to: number | null
  total: number
}

// =============================================================================
// PREFERENCE PAYLOADS
// =============================================================================

export interface PreferencePayload {
  // View settings
  viewMode?: 'grid' | 'list'
  iconSize?: number
  iconColor?: string | null
  isDark?: boolean
  perPage?: number
  
  // Search & filters
  searchQuery?: string
  searchScope?: 'all' | 'icons' | 'packages' | 'categories'
  packageSearchQuery?: string
  categorySearchQuery?: string
  selectedPackageIds?: string[]
  selectedCategoryIds?: string[]
  
  // Sorting
  sortBy?: 'name' | 'package' | 'category' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
  
  // Collections & favorites
  favorites?: number[]
  collections?: Collection[]
  
  // History
  history?: HistoryEntry[]
  command_history?: CommandHistoryEntry[]
  
  // Tree state
  expandedPackages?: string[]
  expandedCategories?: string[]
}

export interface Collection {
  id: string
  name: string
  color: string
  iconIds: number[]
  created_at?: string
}

export interface HistoryEntry {
  icon_id: number
  icon_name: string
  action: 'view' | 'copy' | 'download'
  timestamp: string
  formatted_time?: string
}

export interface CommandHistoryEntry {
  command: string
  type: 'action' | 'search' | 'navigation'
  metadata?: Record<string, any>
  timestamp: string
  formatted_time?: string
}

// =============================================================================
// ICON PAYLOADS
// =============================================================================

export interface IconPayload {
  id: number
  name: string
  package: string
  category?: string
  tags?: string[]
  svg_content?: string
  path?: string
  file_hash?: string
  created_at?: string
  updated_at?: string
}

export interface IconQueryParams {
  page?: number
  per_page?: number
  search?: string
  packages?: string[]
  categories?: string[]
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

// =============================================================================
// SETTINGS PAYLOADS
// =============================================================================

export interface SettingsPayload {
  // Display
  display?: {
    theme?: 'system' | 'light' | 'dark'
    icon_size?: number
    grid_columns?: number
    show_tooltips?: boolean
    show_icon_names?: boolean
    compact_mode?: boolean
  }
  
  // Performance
  performance?: {
    enable_virtualization?: boolean
    lazy_load_images?: boolean
    animation_speed?: 'slow' | 'normal' | 'fast'
    debounce_delay?: number
  }
  
  // Caching
  caching?: {
    enable_browser_cache?: boolean
    cache_duration?: number
    preload_icons?: boolean
  }
  
  // Export
  export?: {
    default_format?: 'svg' | 'png' | 'jsx'
    default_size?: number
    include_metadata?: boolean
  }
  
  // Accessibility
  accessibility?: {
    high_contrast?: boolean
    reduce_motion?: boolean
    keyboard_shortcuts?: boolean
    screen_reader_mode?: boolean
  }
}

// =============================================================================
// REQUEST TRANSFORMERS
// =============================================================================

export class ApiTransformer {
  /**
   * Transform frontend preference state to API payload
   */
  static toPreferencePayload(state: any): PreferencePayload {
    return {
      viewMode: state.viewMode,
      iconSize: state.iconSize,
      iconColor: state.iconColor,
      isDark: state.isDark,
      perPage: state.perPage,
      searchQuery: state.searchQuery,
      searchScope: state.searchScope,
      packageSearchQuery: state.packageSearchQuery,
      categorySearchQuery: state.categorySearchQuery,
      selectedPackageIds: Array.from(state.selectedPackageIds || []),
      selectedCategoryIds: Array.from(state.selectedCategoryIds || []),
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      favorites: Array.from(state.favorites || []),
      collections: state.collections || [],
      history: state.history || [],
      command_history: state.command_history || [],
      expandedPackages: Array.from(state.expandedPackages || []),
      expandedCategories: Array.from(state.expandedCategories || []),
    }
  }

  /**
   * Transform API preference response to frontend state
   */
  static fromPreferencePayload(payload: PreferencePayload): any {
    return {
      viewMode: payload.viewMode || 'grid',
      iconSize: payload.iconSize || 64,
      iconColor: payload.iconColor || null,
      isDark: payload.isDark ?? false,
      perPage: payload.perPage || 48,
      searchQuery: payload.searchQuery || '',
      searchScope: payload.searchScope || 'all',
      packageSearchQuery: payload.packageSearchQuery || '',
      categorySearchQuery: payload.categorySearchQuery || '',
      selectedPackageIds: new Set(payload.selectedPackageIds || []),
      selectedCategoryIds: new Set(payload.selectedCategoryIds || []),
      sortBy: payload.sortBy || 'name',
      sortOrder: payload.sortOrder || 'asc',
      favorites: new Set(payload.favorites || []),
      collections: payload.collections || [],
      history: payload.history || [],
      command_history: payload.command_history || [],
      expandedPackages: new Set(payload.expandedPackages || []),
      expandedCategories: new Set(payload.expandedCategories || []),
    }
  }

  /**
   * Transform icon query params to API format
   */
  static toIconQueryParams(params: any): IconQueryParams {
    const query: IconQueryParams = {}
    
    if (params.page) query.page = params.page
    if (params.perPage) query.per_page = params.perPage
    if (params.searchQuery) query.search = params.searchQuery
    if (params.selectedPackageIds?.size > 0) {
      query.packages = Array.from(params.selectedPackageIds)
    }
    if (params.selectedCategoryIds?.size > 0) {
      query.categories = Array.from(params.selectedCategoryIds)
    }
    if (params.sortBy) query.sort_by = params.sortBy
    if (params.sortOrder) query.sort_order = params.sortOrder
    
    return query
  }

  /**
   * Clean undefined/null values from payload
   */
  static cleanPayload<T extends Record<string, any>>(payload: T): Partial<T> {
    const cleaned: any = {}
    
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null) {
        // Convert Sets to Arrays
        if (value instanceof Set) {
          cleaned[key] = Array.from(value)
        }
        // Recursively clean objects
        else if (typeof value === 'object' && !Array.isArray(value)) {
          const nested = this.cleanPayload(value)
          if (Object.keys(nested).length > 0) {
            cleaned[key] = nested
          }
        }
        // Keep other values
        else {
          cleaned[key] = value
        }
      }
    }
    
    return cleaned
  }
}

// =============================================================================
// ERROR TYPES
// =============================================================================

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  code?: string
  status?: number
}

export class ApiException extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiException'
  }

  static fromResponse(response: any): ApiException {
    return new ApiException(
      response.error || response.message || 'An error occurred',
      response.code,
      response.status,
      response.errors
    )
  }
}
