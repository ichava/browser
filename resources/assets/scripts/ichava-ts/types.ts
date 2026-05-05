/**
 * Ichava Types - Consolidated Type Definitions
 * 
 * All interfaces and types for the Ichava Icon Browser module.
 * Following SOLID principles with single responsibility for each interface.
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface IchavaConfig {
  apiUrl: string
  timeout: number
  storageType: 'localStorage' | 'sessionStorage'
  storagePrefix: string
  defaultPerPage: number
  defaultIconSize: number
  defaultIconColor: string
  defaultViewMode: ViewMode
  defaultSortBy: SortField
  defaultSortOrder: SortOrder
}

export const DEFAULT_CONFIG: IchavaConfig = {
  apiUrl: '/ichava/api',
  timeout: 15000,
  storageType: 'localStorage',
  storagePrefix: 'ichava',
  defaultPerPage: 60,
  defaultIconSize: 48,
  defaultIconColor: '', // Empty = original SVG colors
  defaultViewMode: 'grid',
  defaultSortBy: 'name',
  defaultSortOrder: 'asc',
}

// =============================================================================
// ENUMS & LITERAL TYPES
// =============================================================================

export type ViewMode = 'grid' | 'list'
export type SortField = 'name' | 'package' | 'category' | 'created_at'
export type SortOrder = 'asc' | 'desc'
export type HistoryAction = 'view' | 'copy' | 'download'
export type StorageType = 'localStorage' | 'sessionStorage'
export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ToastIcon = 'copy' | 'heart' | 'download' | 'trash' | 'check' | 'error' | 'info'

// =============================================================================
// TOAST TYPES
// =============================================================================

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  icon?: ToastIcon
  duration?: number
}

export interface IToastManager {
  toasts: import('vue').Ref<ToastMessage[]>
  count: number
  add(toast: Omit<ToastMessage, 'id'>): this
  remove(id: string): this
  clear(): this
  success(title: string, message?: string, icon?: ToastIcon): this
  error(title: string, message?: string): this
  info(title: string, message?: string): this
  warning(title: string, message?: string): this
  copied(itemName?: string): this
  favoriteAdded(iconName: string): this
  favoriteRemoved(iconName: string): this
  downloaded(iconName: string): this
  collectionCreated(name: string): this
  collectionDeleted(name: string): this
  addedToCollection(iconName: string, collectionName: string): this
}

// =============================================================================
// CORE ENTITIES
// =============================================================================

export interface Icon {
  id: number
  name: string
  package: string
  category: string
  variant?: string
  path?: string
  tags?: string[]
  keywords?: string[]
  svgContent?: string
  svgUrl?: string
  bladeClean?: string
  bladeGeneric?: string
  helper?: string
  createdAt?: string
  updatedAt?: string
}

export interface IconPackage {
  id: string
  name: string
  description?: string
  count: number
  isLoaded: boolean
  vendor?: string
  version?: string
}

export interface Category {
  id: string
  name: string
  slug?: string
  count: number
  packageId?: string
  parentId?: string | null
  subcategories?: Category[]
}

export interface CategoryGroup {
  id: string
  packageName: string
  categories: Category[]
}

export interface Collection {
  id: string
  name: string
  color: string
  iconIds: number[]
  createdAt: string
  updatedAt?: string
}

export interface HistoryEntry {
  iconId: number
  iconName: string
  action: HistoryAction
  timestamp: string
}

// =============================================================================
// FILTER & QUERY TYPES
// =============================================================================

export interface IconFilters {
  search?: string
  packages?: string[]
  categories?: string[]
  variants?: string[]
  page?: number
  perPage?: number
  sortBy?: SortField
  sortOrder?: SortOrder
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  from?: number
  to?: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
  meta?: Record<string, unknown>
}

// =============================================================================
// BROWSER STATE
// =============================================================================

export interface BrowserState {
  viewMode: ViewMode
  iconSize: number
  iconColor: string
  sortBy: SortField
  sortOrder: SortOrder
  currentPage: number
  perPage: number
  searchQuery: string
  selectedIconId: number | null
}

export interface ThemeState {
  isDark: boolean
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export type IchavaEventType = 
  | 'icon:loaded'
  | 'icon:selected'
  | 'favorite:added'
  | 'favorite:removed'
  | 'favorite:toggled'
  | 'favorite:loaded'
  | 'collection:created'
  | 'collection:updated'
  | 'collection:deleted'
  | 'collection:icon:added'
  | 'collection:icon:removed'
  | 'collection:loaded'
  | 'history:added'
  | 'history:cleared'
  | 'history:loaded'
  | 'browser:viewMode:changed'
  | 'browser:iconSize:changed'
  | 'browser:iconColor:changed'
  | 'browser:sort:changed'
  | 'browser:page:changed'
  | 'browser:search:changed'
  | 'theme:changed'
  | 'storage:synced'
  | 'error'

export interface IchavaEvent<T = unknown> {
  type: IchavaEventType
  payload?: T
  timestamp: number
}

export type IchavaEventHandler<T = unknown> = (event: IchavaEvent<T>) => void

// =============================================================================
// MANAGER INTERFACES (Contracts)
// =============================================================================

export interface IManager {
  initialize(): Promise<this>
  dispose(): void
}

export interface IIconManager extends IManager {
  find(id: number): Promise<Icon | null>
  findAll(filters?: IconFilters): Promise<PaginatedResult<Icon>>
  search(query: string): Promise<Icon[]>
  getByIds(ids: number[]): Icon[]
  getSvg(id: number): Promise<string>
}

export interface IFavoriteManager extends IManager {
  getAll(): number[]
  add(iconId: number): this
  remove(iconId: number): this
  toggle(iconId: number): this
  has(iconId: number): boolean
  clear(): this
  count(): number
}

export interface ICollectionManager extends IManager {
  getAll(): Collection[]
  find(id: string): Collection | null
  create(name: string, color?: string): Collection
  update(id: string, data: Partial<Omit<Collection, 'id' | 'createdAt'>>): this
  delete(id: string): this
  addIcon(collectionId: string, iconId: number): this
  removeIcon(collectionId: string, iconId: number): this
  hasIcon(collectionId: string, iconId: number): boolean
  count(): number
}

export interface IHistoryManager extends IManager {
  getAll(): HistoryEntry[]
  add(iconId: number, action: HistoryAction): this
  clear(): this
  count(): number
}

export interface IBrowserManager extends IManager {
  getState(): BrowserState
  setViewMode(mode: ViewMode): this
  toggleViewMode(): this
  setIconSize(size: number): this
  setIconColor(color: string): this
  setSortBy(field: SortField): this
  setSortOrder(order: SortOrder): this
  toggleSortOrder(): this
  setPage(page: number): this
  setPerPage(perPage: number): this
  setSearch(query: string): this
  selectIcon(iconId: number | null): this
  reset(): this
}

export interface IThemeManager extends IManager {
  isDark(): boolean
  setDark(dark: boolean): this
  toggle(): this
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface ClipboardResult {
  success: boolean
  error?: Error
}

export interface DownloadOptions {
  filename?: string
  format?: 'svg' | 'png'
  size?: number
  color?: string
}

// =============================================================================
// BUILDER TYPES
// =============================================================================

export interface IconQueryOptions {
  packages?: string[]
  categories?: string[]
  variants?: string[]
  search?: string
  sortBy?: SortField
  sortOrder?: SortOrder
  page?: number
  perPage?: number
}

export interface CollectionCreateOptions {
  name: string
  color?: string
  iconIds?: number[]
}

// =============================================================================
// VUE INTEGRATION TYPES
// =============================================================================

export interface IchavaPluginOptions {
  config?: Partial<IchavaConfig>
}

export interface UseIchavaReturn {
  // Client
  client: IchavaClient
  isInitialized: boolean
  
  // Managers (reactive refs)
  icons: IIconManager
  favorites: IFavoriteManager
  collections: ICollectionManager
  history: IHistoryManager
  browser: IBrowserManager
  theme: IThemeManager
  
  // Utilities
  copyToClipboard: (text: string) => Promise<boolean>
  downloadSvg: (icon: Icon, options?: DownloadOptions) => Promise<void>
}

// Forward declaration for circular reference
export interface IchavaClient {
  configure(config: Partial<IchavaConfig>): this
  initialize(): Promise<this>
  icons(): IIconManager
  favorites(): IFavoriteManager
  collections(): ICollectionManager
  history(): IHistoryManager
  browser(): IBrowserManager
  theme(): IThemeManager
}

