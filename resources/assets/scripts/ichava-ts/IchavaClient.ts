/**
 * IchavaClient - Main Facade Class
 *
 * The primary entry point for the Ichava module.
 * Implements the Singleton + Facade patterns for a unified, fluent API.
 *
 * @example
 * ```typescript
 * const ichava = IchavaClient.getInstance()
 *   .configure({ apiUrl: '/ichava/api' })
 *   .initialize()
 *
 * // Query icons
 * const icons = await ichava.icons()
 *   .query()
 *   .wherePackage('ui-icons')
 *   .search('home')
 *   .paginate(1, 60)
 *   .get()
 *
 * // Manage favorites
 * ichava.favorites().add(iconId).sync()
 *
 * // Create collection
 * ichava.collections()
 *   .new('My Icons')
 *   .withColor('#8b5cf6')
 *   .withIcons([1, 2, 3])
 *   .save()
 * ```
 */

import { EventBus } from './core/EventBus'
import { StorageAdapter } from './core/StorageAdapter'
import { HttpClient } from './core/HttpClient'
import { IconManager } from './managers/IconManager'
import { FavoriteManager } from './managers/FavoriteManager'
import { CollectionManager } from './managers/CollectionManager'
import { HistoryManager } from './managers/HistoryManager'
import { CommandHistoryManager } from './managers/CommandHistoryManager'
import { BrowserManager } from './managers/BrowserManager'
import { ThemeManager } from './managers/ThemeManager'
import { ToastManager } from './managers/ToastManager'
import { Clipboard } from './utils/Clipboard'
import { Download } from './utils/Download'
import { Formatter } from './utils/Formatter'
import type {
  IchavaConfig,
  Icon,
  DownloadOptions,
  IchavaEventType,
  IchavaEventHandler
} from './types'

export class IchavaClient {
  private static instance: IchavaClient | null = null

  private config: IchavaConfig
  private events: EventBus
  private storage: StorageAdapter
  private http: HttpClient

  // Managers
  private _icons: IconManager | null = null
  private _favorites: FavoriteManager | null = null
  private _collections: CollectionManager | null = null
  private _history: HistoryManager | null = null
  private _commandHistory: CommandHistoryManager | null = null
  private _browser: BrowserManager | null = null
  private _theme: ThemeManager | null = null
  private _toast: ToastManager | null = null

  private _isInitialized: boolean = false

  /**
   * Private constructor - use getInstance() instead
   */
  private constructor() {
    this.config = { ...DEFAULT_CONFIG_VALUES }
    this.events = EventBus.getInstance()
    this.storage = new StorageAdapter(this.config.storageType, this.config.storagePrefix)
    this.http = new HttpClient({ baseUrl: this.config.apiUrl, timeout: this.config.timeout })
  }

  /**
   * Get singleton instance
   */
  static getInstance(): IchavaClient {
    if (!IchavaClient.instance) {
      IchavaClient.instance = new IchavaClient()
    }
    return IchavaClient.instance
  }

  /**
   * Reset singleton instance (for testing)
   */
  static resetInstance(): void {
    if (IchavaClient.instance) {
      IchavaClient.instance.dispose()
      IchavaClient.instance = null
    }
  }

  /**
   * Configure the client (fluent)
   */
  configure(config: Partial<IchavaConfig>): this {
    this.config = { ...this.config, ...config }

    // Update dependencies
    if (config.apiUrl || config.timeout) {
      this.http.configure({
        baseUrl: config.apiUrl,
        timeout: config.timeout,
      })
    }

    if (config.storageType || config.storagePrefix) {
      this.storage = new StorageAdapter(
        config.storageType || this.config.storageType,
        config.storagePrefix || this.config.storagePrefix
      )
    }

    return this
  }

  /**
   * Initialize all managers (async, fluent)
   */
  async initialize(): Promise<this> {
    if (this._isInitialized) return this

    // Initialize managers
    await Promise.all([
      this.icons().initialize(),
      this.favorites().initialize(),
      this.collections().initialize(),
      this.history().initialize(),
      this.commandHistory().initialize(),
      this.browser().initialize(),
      this.theme().initialize(),
    ])

    this._isInitialized = true
    return this
  }

  /**
   * Check if initialized
   */
  get isInitialized(): boolean {
    return this._isInitialized
  }

  /**
   * Get configuration
   */
  getConfig(): IchavaConfig {
    return { ...this.config }
  }

  // ==========================================================================
  // MANAGER ACCESSORS
  // ==========================================================================

  /**
   * Get IconManager
   */
  icons(): IconManager {
    if (!this._icons) {
      this._icons = new IconManager(this.storage, this.events, this.http)
    }
    return this._icons
  }

  /**
   * Get FavoriteManager
   */
  favorites(): FavoriteManager {
    if (!this._favorites) {
      this._favorites = new FavoriteManager(this.storage, this.events, this.http)
    }
    return this._favorites
  }

  /**
   * Get CollectionManager
   */
  collections(): CollectionManager {
    if (!this._collections) {
      this._collections = new CollectionManager(this.storage, this.events, this.http)
    }
    return this._collections
  }

  /**
   * Get HistoryManager
   */
  history(): HistoryManager {
    if (!this._history) {
      this._history = new HistoryManager(this.storage, this.events, this.http)
    }
    return this._history
  }

  /**
   * Get CommandHistoryManager
   */
  commandHistory(): CommandHistoryManager {
    if (!this._commandHistory) {
      this._commandHistory = new CommandHistoryManager(this.storage, this.events, this.http)
    }
    return this._commandHistory
  }

  /**
   * Get BrowserManager
   */
  browser(): BrowserManager {
    if (!this._browser) {
      this._browser = new BrowserManager(this.storage, this.events, this.http)
    }
    return this._browser
  }

  /**
   * Get ThemeManager
   */
  theme(): ThemeManager {
    if (!this._theme) {
      this._theme = new ThemeManager(this.storage, this.events, this.http)
    }
    return this._theme
  }

  /**
   * Get ToastManager
   */
  toast(): ToastManager {
    if (!this._toast) {
      this._toast = new ToastManager()
    }
    return this._toast
  }

  /**
   * Get raw HTTP client for direct API calls
   */
  getHttpClient(): HttpClient {
    return this.http
  }

  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================

  /**
   * Subscribe to events (fluent)
   */
  on<T = unknown>(type: IchavaEventType, handler: IchavaEventHandler<T>): this {
    this.events.on(type, handler)
    return this
  }

  /**
   * Unsubscribe from events (fluent)
   */
  off<T = unknown>(type: IchavaEventType, handler: IchavaEventHandler<T>): this {
    this.events.off(type, handler)
    return this
  }

  /**
   * Subscribe once (fluent)
   */
  once<T = unknown>(type: IchavaEventType, handler: IchavaEventHandler<T>): this {
    this.events.once(type, handler)
    return this
  }

  /**
   * Emit event (fluent)
   */
  emit<T = unknown>(type: IchavaEventType, payload?: T): this {
    this.events.emit(type, payload)
    return this
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    const result = await Clipboard.copy(text)
    return result.success
  }

  /**
   * Download icon as SVG
   */
  async downloadIcon(icon: Icon, options?: DownloadOptions): Promise<void> {
    const svgContent = await this.icons().getSvg(icon.id)
    if (svgContent) {
      await Download.downloadIcon(icon, svgContent, options)
      this.history().download(icon.id, icon.name)
    }
  }

  /**
   * Format number with locale separators
   */
  formatNumber(num: number): string {
    return Formatter.number(num)
  }

  /**
   * Format compact number (1K, 1M, etc.)
   */
  formatCompact(num: number): string {
    return Formatter.compact(num)
  }

  /**
   * Format time ago
   */
  formatTimeAgo(date: Date | string): string {
    return Formatter.timeAgo(date)
  }

  /**
   * Generate Laravel route URL
   * Uses routes injected from Blade via window.ichavaRoutes
   */
  route(name: string, params?: Record<string, string | number>): string {
    // Get routes from window (injected by Blade)
    const routes = (window as Window & { ichavaRoutes?: Record<string, string> }).ichavaRoutes || {}
    
    // Fallback routes if not injected (matches actual Laravel route structure)
    const baseUrl = window.location.origin
    const prefix = '/ichava'
    const fallbackRoutes: Record<string, string> = {
      // Web routes
      'ichava.browser': `${baseUrl}${prefix}/icons`,
      'ichava.stats': `${baseUrl}${prefix}/stats`,
      'ichava.cache.clear': `${baseUrl}${prefix}/cache/clear`,
      'ichava.cache.rebuild': `${baseUrl}${prefix}/cache/rebuild`,
      
      // Icons API
      'ichava.api.icons': `${baseUrl}${prefix}/api/icons`,
      'ichava.api.icons.index': `${baseUrl}${prefix}/api/icons`,
      'ichava.api.icons.show': `${baseUrl}${prefix}/api/icons/__ID__`,
      'ichava.api.icons.svg': `${baseUrl}${prefix}/api/icons/__ID__/svg`,
      'ichava.api.icons.filters': `${baseUrl}${prefix}/api/icons/filters`,
      'ichava.api.icons.tree': `${baseUrl}${prefix}/api/icons/tree`,
      'ichava.api.icons.statistics': `${baseUrl}${prefix}/api/icons/statistics`,
      
      // Packages API
      'ichava.api.packages': `${baseUrl}${prefix}/api/packages`,
      'ichava.api.packages.index': `${baseUrl}${prefix}/api/packages`,
      
      // Terms API
      'ichava.api.categories': `${baseUrl}${prefix}/api/terms/categories`,
      'ichava.api.terms.categories': `${baseUrl}${prefix}/api/terms/categories`,
      'ichava.api.terms.variants': `${baseUrl}${prefix}/api/terms/variants`,
      'ichava.api.terms.hierarchy': `${baseUrl}${prefix}/api/terms/hierarchy`,
      
      // Favorites API
      'ichava.api.favorites': `${baseUrl}${prefix}/api/favorites`,
      'ichava.api.favorites.index': `${baseUrl}${prefix}/api/favorites`,
      'ichava.api.favorites.toggle': `${baseUrl}${prefix}/api/favorites/__ID__/toggle`,
      
      // Collections API
      'ichava.api.collections': `${baseUrl}${prefix}/api/collections`,
      'ichava.api.collections.index': `${baseUrl}${prefix}/api/collections`,
      
      // History API
      'ichava.api.history': `${baseUrl}${prefix}/api/history`,
      'ichava.api.history.index': `${baseUrl}${prefix}/api/history`,
      
      // Preferences API
      'ichava.api.preferences': `${baseUrl}${prefix}/api/preferences`,
      'ichava.api.preferences.index': `${baseUrl}${prefix}/api/preferences`,
      
      // Command History API
      'ichava.api.commandHistory': `${baseUrl}${prefix}/api/command-history`,
      'ichava.api.commandHistory.index': `${baseUrl}${prefix}/api/command-history`,
      
      // Cache API
      'ichava.api.cache.stats': `${baseUrl}${prefix}/api/cache/stats`,
    }

    let url = routes[name] || fallbackRoutes[name] || `${baseUrl}${prefix}`

    // Replace route parameters (e.g., __ID__ with actual values)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Replace __KEY__ placeholder pattern (Laravel route params)
        url = url.replace(`__${key.toUpperCase()}__`, String(value))
        // Also support {key} pattern
        url = url.replace(`{${key}}`, String(value))
      })
    }

    return url
  }

  /**
   * Check if a route exists
   */
  hasRoute(name: string): boolean {
    const routes = (window as Window & { ichavaRoutes?: Record<string, string> }).ichavaRoutes || {}
    return name in routes
  }

  /**
   * Get all available routes
   */
  getRoutes(): Record<string, string> {
    return { ...((window as Window & { ichavaRoutes?: Record<string, string> }).ichavaRoutes || {}) }
  }

  // ==========================================================================
  // CONVENIENCE METHODS
  // ==========================================================================

  /**
   * Search icons (shorthand)
   */
  async search(query: string) {
    return this.icons().query().search(query).get()
  }

  /**
   * Get icon by ID (shorthand)
   */
  async getIcon(id: number) {
    return this.icons().find(id)
  }

  /**
   * Toggle favorite (shorthand)
   */
  toggleFavorite(iconId: number): this {
    this.favorites().toggle(iconId)
    return this
  }

  /**
   * Toggle theme (shorthand)
   */
  toggleTheme(): this {
    this.theme().toggle()
    return this
  }

  /**
   * Toggle view mode (shorthand)
   */
  toggleViewMode(): this {
    this.browser().toggleViewMode()
    return this
  }

  /**
   * Set search scope
   */
  setSearchScope(scope: 'all' | 'icons' | 'packages' | 'categories'): this {
    this.browser().setSearchScope(scope)
    return this
  }

  /**
   * Set package search query
   */
  setPackageSearch(query: string): this {
    this.browser().setPackageSearch(query)
    return this
  }

  /**
   * Set category search query
   */
  setCategorySearch(query: string): this {
    this.browser().setCategorySearch(query)
    return this
  }

  // ==========================================================================
  // LIFECYCLE
  // ==========================================================================

  /**
   * Dispose all resources
   */
  dispose(): void {
    this._icons?.dispose()
    this._favorites?.dispose()
    this._collections?.dispose()
    this._history?.dispose()
    this._browser?.dispose()
    this._theme?.dispose()
    this.events.dispose()

    this._icons = null
    this._favorites = null
    this._collections = null
    this._history = null
    this._browser = null
    this._theme = null
    this._toast = null
    this._isInitialized = false
  }

  /**
   * Sync all data with API
   */
  async sync(): Promise<this> {
    await Promise.all([
      this.favorites().sync(),
      this.collections().sync(),
      this.history().sync(),
    ])
    return this
  }

  /**
   * Clear all local data
   */
  clearAll(): this {
    this.favorites().clear()
    this.collections().clear()
    this.history().clear()
    this.browser().reset()
    this.icons().clear()
    return this
  }
}

// Default configuration values
const DEFAULT_CONFIG_VALUES: IchavaConfig = {
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

// Export singleton accessor
export const ichava = IchavaClient.getInstance()

