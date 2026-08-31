/**
 * BrowserManager - UI State Manager
 *
 * Manages browser UI state (view mode, icon size, colors, sorting, pagination).
 */

import { StateManager } from './BaseManager'
import { StorageAdapter } from '../core/StorageAdapter'
import { EventBus } from '../core/EventBus'
import { HttpClient } from '../core/HttpClient'
import { state } from '../state'
import type { IBrowserManager, BrowserState, ViewMode, SortField, SortOrder } from '../types'

const DEFAULT_STATE: BrowserState = {
  viewMode: 'grid',
  iconSize: 256,
  iconColor: '', // Empty = original SVG colors
  sortBy: 'name',
  sortOrder: 'asc',
  currentPage: 1,
  perPage: 60,
  searchQuery: '',
  selectedIconId: null,
}

export class BrowserManager extends StateManager<BrowserState> implements IBrowserManager {
  constructor(storage: StorageAdapter, events: EventBus, http: HttpClient) {
    super(storage, events, http, 'browser', DEFAULT_STATE)
  }

  // ==========================================================================
  // VIEW MODE
  // ==========================================================================

  /**
   * Get current view mode
   */
  getViewMode(): ViewMode {
    return this.state.viewMode
  }

  /**
   * Set view mode (fluent)
   */
  setViewMode(mode: ViewMode): this {
    if (this.state.viewMode !== mode) {
      this.setState({ viewMode: mode })
      this.emit('browser:viewMode:changed', { viewMode: mode })
    }
    return this
  }

  /**
   * Toggle between grid and list view (fluent)
   */
  toggleViewMode(): this {
    return this.setViewMode(this.state.viewMode === 'grid' ? 'list' : 'grid')
  }

  /**
   * Set to grid view (fluent)
   */
  grid(): this {
    return this.setViewMode('grid')
  }

  /**
   * Set to list view (fluent)
   */
  list(): this {
    return this.setViewMode('list')
  }

  /**
   * Check if grid view is active
   */
  isGrid(): boolean {
    return this.state.viewMode === 'grid'
  }

  /**
   * Check if list view is active
   */
  isList(): boolean {
    return this.state.viewMode === 'list'
  }

  // ==========================================================================
  // ICON SIZE
  // ==========================================================================

  /**
   * Get icon size
   */
  getIconSize(): number {
    return this.state.iconSize
  }

  /**
   * Set icon size (fluent)
   * Supports sizes from 24px to 640px
   */
  setIconSize(size: number): this {
    const clampedSize = Math.max(24, Math.min(640, size))
    if (this.state.iconSize !== clampedSize) {
      this.setState({ iconSize: clampedSize })
      this.emit('browser:iconSize:changed', { iconSize: clampedSize })
    }
    return this
  }

  /**
   * Increase icon size (fluent)
   */
  increaseSize(amount: number = 8): this {
    return this.setIconSize(this.state.iconSize + amount)
  }

  /**
   * Decrease icon size (fluent)
   */
  decreaseSize(amount: number = 8): this {
    return this.setIconSize(this.state.iconSize - amount)
  }

  // ==========================================================================
  // ICON COLOR
  // ==========================================================================

  /**
   * Get icon color
   */
  getIconColor(): string {
    return this.state.iconColor
  }

  /**
   * Set icon color (fluent)
   */
  setIconColor(color: string): this {
    if (this.state.iconColor !== color) {
      this.setState({ iconColor: color })
      this.emit('browser:iconColor:changed', { iconColor: color })
    }
    return this
  }

  // ==========================================================================
  // SORTING
  // ==========================================================================

  /**
   * Get sort field
   */
  getSortBy(): SortField {
    return this.state.sortBy
  }

  /**
   * Get sort order
   */
  getSortOrder(): SortOrder {
    return this.state.sortOrder
  }

  /**
   * Set sort field (fluent)
   */
  setSortBy(field: SortField): this {
    if (this.state.sortBy !== field) {
      this.setState({ sortBy: field })
      this.emit('browser:sort:changed', { sortBy: field, sortOrder: this.state.sortOrder })
    }
    return this
  }

  /**
   * Set sort order (fluent)
   */
  setSortOrder(order: SortOrder): this {
    if (this.state.sortOrder !== order) {
      this.setState({ sortOrder: order })
      this.emit('browser:sort:changed', { sortBy: this.state.sortBy, sortOrder: order })
    }
    return this
  }

  /**
   * Toggle sort order (fluent)
   */
  toggleSortOrder(): this {
    return this.setSortOrder(this.state.sortOrder === 'asc' ? 'desc' : 'asc')
  }

  /**
   * Sort by name ascending (fluent)
   */
  sortByName(order: SortOrder = 'asc'): this {
    return this.setSortBy('name').setSortOrder(order)
  }

  /**
   * Sort by package ascending (fluent)
   */
  sortByPackage(order: SortOrder = 'asc'): this {
    return this.setSortBy('package').setSortOrder(order)
  }

  // ==========================================================================
  // PAGINATION
  // ==========================================================================

  /**
   * Get current page
   */
  getPage(): number {
    return this.state.currentPage
  }

  /**
   * Get per page count
   */
  getPerPage(): number {
    return this.state.perPage
  }

  /**
   * Set current page (fluent)
   */
  setPage(page: number): this {
    if (page > 0 && this.state.currentPage !== page) {
      this.setState({ currentPage: page })
      this.emit('browser:page:changed', { page })
    }
    return this
  }

  /**
   * Set per page count (fluent)
   */
  setPerPage(perPage: number): this {
    if (perPage > 0 && this.state.perPage !== perPage) {
      this.setState({ perPage, currentPage: 1 })
      this.emit('browser:page:changed', { page: 1, perPage })
    }
    return this
  }

  /**
   * Go to next page (fluent)
   */
  nextPage(): this {
    return this.setPage(this.state.currentPage + 1)
  }

  /**
   * Go to previous page (fluent)
   */
  prevPage(): this {
    return this.setPage(Math.max(1, this.state.currentPage - 1))
  }

  /**
   * Go to first page (fluent)
   */
  firstPage(): this {
    return this.setPage(1)
  }

  // ==========================================================================
  // SEARCH
  // ==========================================================================

  /**
   * Get search query
   */
  getSearch(): string {
    return this.state.searchQuery
  }

  /**
   * Set search query (fluent)
   */
  setSearch(query: string): this {
    if (this.state.searchQuery !== query) {
      this.setState({ searchQuery: query, currentPage: 1 })
      this.emit('browser:search:changed', { query })
    }
    return this
  }

  /**
   * Clear search (fluent)
   */
  clearSearch(): this {
    return this.setSearch('')
  }

  /**
   * Set search scope (fluent)
   */
  setSearchScope(scope: 'all' | 'icons' | 'packages' | 'categories'): this {
    if (state.searchScope !== scope) {
      state.searchScope = scope
      this.emit('browser:searchScope:changed', { scope })
    }
    return this
  }

  /**
   * Set package search query (fluent)
   */
  setPackageSearch(query: string): this {
    if (state.packageSearchQuery !== query) {
      state.packageSearchQuery = query
      this.emit('browser:packageSearch:changed', { query })
    }
    return this
  }

  /**
   * Set category search query (fluent)
   */
  setCategorySearch(query: string): this {
    if (state.categorySearchQuery !== query) {
      state.categorySearchQuery = query
      this.emit("browser:categorySearch:changed", { query })
    }
    return this
  }

  // ==========================================================================
  // ICON SELECTION
  // ==========================================================================

  /**
   * Get selected icon ID
   */
  getSelectedIconId(): number | null {
    return this.state.selectedIconId
  }

  /**
   * Select an icon (fluent)
   */
  selectIcon(iconId: number | null): this {
    if (this.state.selectedIconId !== iconId) {
      this.setState({ selectedIconId: iconId })
      this.emit('icon:selected', { iconId })
    }
    return this
  }

  /**
   * Deselect icon (fluent)
   */
  deselectIcon(): this {
    return this.selectIcon(null)
  }

  /**
   * Check if an icon is selected
   */
  hasSelection(): boolean {
    return this.state.selectedIconId !== null
  }

  // ==========================================================================
  // RESET
  // ==========================================================================

  /**
   * Reset to default state (fluent)
   */
  reset(): this {
    this.state = { ...DEFAULT_STATE }
    return this.persist()
  }

  /**
   * Reset only search and filters (fluent)
   */
  resetFilters(): this {
    return this.setSearch('').firstPage()
  }
}

