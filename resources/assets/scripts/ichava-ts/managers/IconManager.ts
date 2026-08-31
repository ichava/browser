/**
 * IconManager - Icon Data Manager
 * 
 * Handles fetching, caching, and querying icons from the API.
 */

import { BaseManager } from './BaseManager'
import { StorageAdapter } from '../core/StorageAdapter'
import { EventBus } from '../core/EventBus'
import { HttpClient } from '../core/HttpClient'
import type { 
  IIconManager, 
  Icon, 
  IconFilters, 
  PaginatedResult, 
  ApiResponse,
  IconPackage,
  CategoryGroup 
} from '../types'

export class IconManager extends BaseManager<Icon[]> implements IIconManager {
  private icons: Map<number, Icon> = new Map()
  private packages: IconPackage[] = []
  private categories: CategoryGroup[] = []

  constructor(storage: StorageAdapter, events: EventBus, http: HttpClient) {
    super(storage, events, http, 'icons')
  }

  /**
   * Initialize - load cached data
   */
  async initialize(): Promise<this> {
    await super.initialize()
    
    // Load cached icons
    const cached = this.storage.get<Icon[]>('icons-cache', [])
    cached.forEach(icon => this.icons.set(icon.id, icon))
    
    return this
  }

  /**
   * Find icon by ID
   */
  async find(id: number): Promise<Icon | null> {
    // Check cache first
    if (this.icons.has(id)) {
      return this.icons.get(id)!
    }

    // Fetch from API
    try {
      const response = await this.http.get<ApiResponse<Icon>>(`/icons/${id}`)
      if (response.success && response.data) {
        this.icons.set(id, response.data)
        return response.data
      }
    } catch (error) {
      console.error(`[IconManager] Failed to fetch icon ${id}:`, error)
    }

    return null
  }

  /**
   * Find icon by ID (sync, from cache only)
   */
  findSync(id: number): Icon | null {
    return this.icons.get(id) || null
  }

  /**
   * Find all icons matching filters
   */
  async findAll(filters?: IconFilters): Promise<PaginatedResult<Icon>> {
    try {
      // Laravel ResourceCollection returns { data: [...], meta: {...} } format
      // Note: Some meta values may be arrays due to grouping, e.g., total: [529, 529]
      interface LaravelPaginatedResponse {
        data: Icon[]
        meta: {
          total: number | number[]
          per_page: number | number[]
          current_page: number | number[]
          last_page: number | number[]
          from: number | number[] | null
          to: number | number[] | null
          group_by?: string
        }
        links?: Record<string, string | null>
      }
      
      // Helper to extract number from possibly array value
      const extractNumber = (value: number | number[] | undefined, fallback: number): number => {
        if (value === undefined) return fallback
        return Array.isArray(value) ? (value[0] ?? fallback) : value
      }
      
      const response = await this.http.get<LaravelPaginatedResponse>('/icons', {
        params: this.buildFilterParams(filters),
      })

      // Handle Laravel ResourceCollection response format
      // Data can be an array or an object with numeric keys (due to PHP json_encode with grouping)
      // The response may also include a 'grouped' key which we need to filter out
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rawData: any[] = []
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          rawData = response.data
        } else if (typeof response.data === 'object') {
          // Convert object with numeric keys to array, filtering out 'grouped' key
          rawData = Object.entries(response.data)
            .filter(([key]) => !isNaN(Number(key))) // Only keep numeric keys (icon indices)
            .map(([, value]) => value)
        }
      }

      // Transform snake_case API response to camelCase Icon objects
      // Filter out any non-icon objects (must have an 'id' property)
      const iconsData: Icon[] = rawData
        .filter(item => item && typeof item === 'object' && 'id' in item)
        .map(item => this.transformApiIcon(item))

      if (iconsData.length > 0 || response.meta) {
        // Cache fetched icons
        iconsData.forEach(icon => this.icons.set(icon.id, icon))
        this.emit('icon:loaded', { count: iconsData.length })
        
        return {
          data: iconsData,
          total: extractNumber(response.meta?.total, iconsData.length),
          perPage: extractNumber(response.meta?.per_page, filters?.perPage || 60),
          currentPage: extractNumber(response.meta?.current_page, filters?.page || 1),
          lastPage: extractNumber(response.meta?.last_page, 1),
        }
      }
    } catch (error) {
      console.error('[IconManager] Failed to fetch icons:', error)
    }

    return {
      data: [],
      total: 0,
      perPage: filters?.perPage || 60,
      currentPage: filters?.page || 1,
      lastPage: 1,
    }
  }

  /**
   * Search icons by query
   */
  async search(query: string): Promise<Icon[]> {
    const result = await this.findAll({ search: query, perPage: 100 })
    return result.data
  }

  /**
   * Get icons by IDs (from cache)
   */
  getByIds(ids: number[]): Icon[] {
    return ids
      .map(id => this.icons.get(id))
      .filter((icon): icon is Icon => icon !== undefined)
  }

  /**
   * Get SVG content for icon
   */
  async getSvg(id: number): Promise<string> {
    try {
      const response = await this.http.get<string>(`/icons/${id}/svg`)
      return response
    } catch (error) {
      console.error(`[IconManager] Failed to fetch SVG for icon ${id}:`, error)
      return ''
    }
  }

  /**
   * Create a fluent query builder
   */
  query(): IconQueryBuilder {
    return new IconQueryBuilder(this)
  }

  /**
   * Get all packages
   */
  async getPackages(): Promise<IconPackage[]> {
    if (this.packages.length > 0) {
      return this.packages
    }

    try {
      interface ApiPackage {
        name: string
        label: string
        count: number
        description?: string
        vendor?: string
      }
      const response = await this.http.get<ApiResponse<ApiPackage[]>>('/packages')
      if (response.success && response.data) {
        // Transform API response to IconPackage type
        this.packages = response.data.map(pkg => ({
          id: pkg.name, // Use name as id
          name: pkg.name,
          description: pkg.description || '',
          count: pkg.count,
          isLoaded: true,
        }))
      }
    } catch (error) {
      console.error('[IconManager] Failed to fetch packages:', error)
    }

    return this.packages
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<CategoryGroup[]> {
    if (this.categories.length > 0) {
      return this.categories
    }

    try {
      interface ApiCategory {
        id: number
        name: string
        slug: string
        package: string
        parent_id: number | null
        icon_count: number
        type: string
        children?: ApiCategory[]
      }
      interface HierarchyResponse {
        categories: ApiCategory[]
        variants?: ApiCategory[]
      }
      const response = await this.http.get<ApiResponse<HierarchyResponse>>('/terms/hierarchy')
      if (response.success && response.data?.categories) {
        // Group categories by package
        const groupedByPackage = new Map<string, ApiCategory[]>()
        
        for (const cat of response.data.categories) {
          const pkgName = cat.package
          if (!groupedByPackage.has(pkgName)) {
            groupedByPackage.set(pkgName, [])
          }
          groupedByPackage.get(pkgName)!.push(cat)
        }

        // Transform to CategoryGroup[]
        this.categories = Array.from(groupedByPackage.entries()).map(([pkgName, cats]) => ({
          id: pkgName,
          packageName: pkgName,
          categories: cats.map(cat => ({
            id: cat.slug,
            name: cat.name,
            count: cat.icon_count,
            subcategories: cat.children?.map(child => ({
              id: child.slug,
              name: child.name,
              count: child.icon_count,
            })),
          })),
        }))
      }
    } catch (error) {
      console.error('[IconManager] Failed to fetch categories:', error)
    }

    return this.categories
  }

  /**
   * Get filter options
   */
  async getFilters(): Promise<{ packages: IconPackage[]; categories: CategoryGroup[] }> {
    const [packages, categories] = await Promise.all([
      this.getPackages(),
      this.getCategories(),
    ])
    return { packages, categories }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<Record<string, number>> {
    try {
      const response = await this.http.get<ApiResponse<Record<string, number>>>('/icons/statistics')
      if (response.success && response.data) {
        return response.data
      }
    } catch (error) {
      console.error('[IconManager] Failed to fetch statistics:', error)
    }
    return {}
  }

  /**
   * Build filter params for API request
   * Note: Laravel expects arrays in format packages[]=value1&packages[]=value2
   * Minimizing params to avoid Laravel redirect issues with many query params
   */
  private buildFilterParams(filters?: IconFilters): Record<string, unknown> {
    if (!filters) return {}

    const params: Record<string, unknown> = {}

    // Only add params that are actually needed
    if (filters.search) params.search = filters.search
    
    // Send arrays directly - Axios will serialize as packages[]=value1&packages[]=value2
    if (filters.packages?.length) params['packages[]'] = filters.packages
    if (filters.categories?.length) params['categories[]'] = filters.categories
    if (filters.variants?.length) params['variants[]'] = filters.variants
    
    // Only add pagination if not defaults
    if (filters.page && filters.page > 1) params.page = filters.page
    if (filters.perPage && filters.perPage !== 60) params.per_page = filters.perPage
    
    // Skip sort params for now (use API defaults) to minimize query string
    // if (filters.sortBy) params.sort_by = filters.sortBy
    // if (filters.sortOrder) params.sort_order = filters.sortOrder

    return params
  }

  /**
   * Get cached icon count
   */
  count(): number {
    return this.icons.size
  }

  /**
   * Clear cache
   */
  clear(): this {
    this.icons.clear()
    this.packages = []
    this.categories = []
    this.storage.remove('icons-cache')
    return this
  }

  /**
   * Convert to JSON
   */
  toJSON(): Icon[] {
    return Array.from(this.icons.values())
  }

  /**
   * Persist cache
   */
  protected persist(): this {
    // Only cache first 500 icons to avoid storage limits
    const toCache = Array.from(this.icons.values()).slice(0, 500)
    this.storage.set('icons-cache', toCache)
    return this
  }

  /**
   * Transform snake_case API response to camelCase Icon object
   */
  private transformApiIcon(item: Record<string, unknown>): Icon {
    return {
      id: item.id as number,
      name: item.name as string,
      package: item.package as string,
      category: item.category as string,
      variant: item.variant as string | undefined,
      path: item.path as string | undefined,
      tags: item.tags as string[] | undefined,
      keywords: item.keywords as string[] | undefined,
      svgContent: item.svg_content as string | undefined,
      svgUrl: item.svg_url as string | undefined,
      bladeClean: item.blade_clean as string | undefined,
      bladeGeneric: item.blade_generic as string | undefined,
      helper: item.helper as string | undefined,
      createdAt: item.created_at as string | undefined,
      updatedAt: item.updated_at as string | undefined,
    }
  }
}

/**
 * IconQueryBuilder - Fluent Query Builder for Icons
 */
export class IconQueryBuilder {
  private manager: IconManager
  private filters: IconFilters = {}

  constructor(manager: IconManager) {
    this.manager = manager
  }

  /**
   * Filter by package(s)
   */
  wherePackage(pkg: string | string[]): this {
    this.filters.packages = Array.isArray(pkg) ? pkg : [pkg]
    return this
  }

  /**
   * Filter by category(s)
   */
  whereCategory(cat: string | string[]): this {
    this.filters.categories = Array.isArray(cat) ? cat : [cat]
    return this
  }

  /**
   * Filter by variant(s)
   */
  whereVariant(variant: string | string[]): this {
    this.filters.variants = Array.isArray(variant) ? variant : [variant]
    return this
  }

  /**
   * Search by query
   */
  search(query: string): this {
    this.filters.search = query
    return this
  }

  /**
   * Order by field
   */
  orderBy(field: 'name' | 'package' | 'category' | 'created_at', order: 'asc' | 'desc' = 'asc'): this {
    this.filters.sortBy = field
    this.filters.sortOrder = order
    return this
  }

  /**
   * Order by name ascending
   */
  orderByName(): this {
    return this.orderBy('name', 'asc')
  }

  /**
   * Order by name descending
   */
  orderByNameDesc(): this {
    return this.orderBy('name', 'desc')
  }

  /**
   * Paginate results
   */
  paginate(page: number, perPage: number = 60): this {
    this.filters.page = page
    this.filters.perPage = perPage
    return this
  }

  /**
   * Set page
   */
  page(page: number): this {
    this.filters.page = page
    return this
  }

  /**
   * Set per page
   */
  perPage(perPage: number): this {
    this.filters.perPage = perPage
    return this
  }

  /**
   * Limit results (alias for perPage)
   */
  limit(limit: number): this {
    return this.perPage(limit)
  }

  /**
   * Execute query and get paginated results
   */
  async get(): Promise<PaginatedResult<Icon>> {
    return this.manager.findAll(this.filters)
  }

  /**
   * Execute query and get first result
   */
  async first(): Promise<Icon | null> {
    this.filters.perPage = 1
    const result = await this.manager.findAll(this.filters)
    return result.data[0] || null
  }

  /**
   * Execute query and get count
   */
  async count(): Promise<number> {
    const result = await this.manager.findAll({ ...this.filters, perPage: 1 })
    return result.total
  }

  /**
   * Execute query and get all data (unpaginated array)
   */
  async all(): Promise<Icon[]> {
    const result = await this.get()
    return result.data
  }

  /**
   * Get current filters
   */
  getFilters(): IconFilters {
    return { ...this.filters }
  }

  /**
   * Reset filters
   */
  reset(): this {
    this.filters = {}
    return this
  }
}

