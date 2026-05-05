/**
 * FavoriteManager - Icon Favorites Manager
 * 
 * Manages favorite icons with fluent interface.
 * Syncs with Laravel backend via session-based API.
 */

import { ArrayManager } from './BaseManager'
import { StorageAdapter } from '../core/StorageAdapter'
import { EventBus } from '../core/EventBus'
import { HttpClient } from '../core/HttpClient'
import type { IFavoriteManager } from '../types'
import type { ApiResponse } from '../api/types'

export class FavoriteManager extends ArrayManager<number, number> implements IFavoriteManager {
  private useApi: boolean = true

  constructor(storage: StorageAdapter, events: EventBus, http: HttpClient) {
    super(storage, events, http, 'favorites')
  }

  /**
   * Get all favorite icon IDs
   */
  getAll(): number[] {
    return [...this.items]
  }

  /**
   * Find a favorite by ID (returns the ID if exists)
   */
  find(id: number): number | null {
    return this.items.includes(id) ? id : null
  }

  /**
   * Check if icon is a favorite
   */
  has(iconId: number): boolean {
    return this.items.includes(iconId)
  }

  /**
   * Add icon to favorites (fluent)
   */
  add(iconId: number): this {
    if (!this.has(iconId)) {
      this.items.push(iconId)
      this.persist()
      this.emit('favorite:added', { iconId })
    }
    return this
  }

  /**
   * Add icon to favorites with API sync
   */
  async addAsync(iconId: number): Promise<this> {
    if (!this.has(iconId)) {
      // Optimistic update
      this.items.push(iconId)
      this.persist()
      this.emit('favorite:added', { iconId })

      // Sync to API
      if (this.useApi) {
        try {
          await this.http.post(`/favorites/${iconId}`)
        } catch (error) {
          // Rollback on error
          const index = this.items.indexOf(iconId)
          if (index > -1) this.items.splice(index, 1)
          this.persist()
          console.error('[FavoriteManager] Failed to add favorite:', error)
        }
      }
    }
    return this
  }

  /**
   * Add multiple icons to favorites (fluent)
   */
  addMany(iconIds: number[]): this {
    const added: number[] = []
    iconIds.forEach(id => {
      if (!this.has(id)) {
        this.items.push(id)
        added.push(id)
      }
    })
    if (added.length > 0) {
      this.persist()
      added.forEach(iconId => this.emit('favorite:added', { iconId }))
    }
    return this
  }

  /**
   * Remove icon from favorites (fluent)
   */
  remove(iconId: number): this {
    const index = this.items.indexOf(iconId)
    if (index > -1) {
      this.items.splice(index, 1)
      this.persist()
      this.emit('favorite:removed', { iconId })
    }
    return this
  }

  /**
   * Remove icon from favorites with API sync
   */
  async removeAsync(iconId: number): Promise<this> {
    const index = this.items.indexOf(iconId)
    if (index > -1) {
      // Optimistic update
      this.items.splice(index, 1)
      this.persist()
      this.emit('favorite:removed', { iconId })

      // Sync to API
      if (this.useApi) {
        try {
          await this.http.delete(`/favorites/${iconId}`)
        } catch (error) {
          // Rollback on error
          this.items.push(iconId)
          this.persist()
          console.error('[FavoriteManager] Failed to remove favorite:', error)
        }
      }
    }
    return this
  }

  /**
   * Remove multiple icons from favorites (fluent)
   */
  removeMany(iconIds: number[]): this {
    const removed: number[] = []
    iconIds.forEach(id => {
      const index = this.items.indexOf(id)
      if (index > -1) {
        this.items.splice(index, 1)
        removed.push(id)
      }
    })
    if (removed.length > 0) {
      this.persist()
      removed.forEach(iconId => this.emit('favorite:removed', { iconId }))
    }
    return this
  }

  /**
   * Toggle icon favorite status (fluent, local only)
   */
  toggle(iconId: number): this {
    if (this.has(iconId)) {
      this.remove(iconId)
    } else {
      this.add(iconId)
    }
    this.emit('favorite:toggled', { iconId, isFavorite: this.has(iconId) })
    return this
  }

  /**
   * Toggle icon favorite status with API sync
   */
  async toggleAsync(iconId: number): Promise<boolean> {
    const wasFavorite = this.has(iconId)
    
    // Optimistic update
    if (wasFavorite) {
      this.remove(iconId)
    } else {
      this.add(iconId)
    }

    // Sync to API
    if (this.useApi) {
      try {
        const response = await this.http.post<ToggleApiResponse>(`/favorites/${iconId}/toggle`)
        // Verify state matches API response
        if (response.success && response.data) {
          const apiIsFavorite = response.data.is_favorite
          const localIsFavorite = this.has(iconId)
          
          // Correct local state if mismatch
          if (apiIsFavorite !== localIsFavorite) {
            if (apiIsFavorite) {
              this.add(iconId)
            } else {
              this.remove(iconId)
            }
          }
        }
      } catch (error) {
        // Rollback on error
        if (wasFavorite) {
          this.add(iconId)
        } else {
          this.remove(iconId)
        }
        console.error('[FavoriteManager] Failed to toggle favorite:', error)
      }
    }

    return this.has(iconId)
  }

  /**
   * Clear all favorites (fluent)
   */
  clear(): this {
    const previousCount = this.items.length
    this.items = []
    this.persist()
    if (previousCount > 0) {
      this.emit('favorite:removed', { iconId: null, cleared: true })
    }
    return this
  }

  /**
   * Sync with API (fluent)
   */
  async sync(): Promise<this> {
    if (!this.useApi) return this
    
    try {
      await this.http.post('/preferences', {
        favorites: this.items,
      })
      this.emit('storage:synced', { key: this.storageKey })
    } catch (error) {
      console.error('[FavoriteManager] Failed to sync:', error)
      this.emit('error', { error, context: 'favorites:sync' })
    }
    return this
  }

  /**
   * Load favorites from API
   */
  async fetch(): Promise<this> {
    if (!this.useApi) return this
    
    try {
      const response = await this.http.get<FavoriteApiResponse>('/favorites')
      if (response.success && response.data?.ids) {
        this.items = response.data.ids
        this.persist()
        this.emit('favorite:loaded', { count: this.items.length })
      }
    } catch (error) {
      console.error('[FavoriteManager] Failed to fetch, using local cache:', error)
      // Keep local cache on error
    }
    return this
  }

  /**
   * Set API mode (enable/disable API calls)
   */
  setApiMode(enabled: boolean): this {
    this.useApi = enabled
    return this
  }

  /**
   * Convert to JSON
   */
  toJSON(): number[] {
    return this.getAll()
  }

  /**
   * Check if any favorites exist
   */
  hasAny(): boolean {
    return this.items.length > 0
  }

  /**
   * Get the first N favorites
   */
  take(n: number): number[] {
    return this.items.slice(0, n)
  }

  /**
   * Get the last N favorites
   */
  takeLast(n: number): number[] {
    return this.items.slice(-n)
  }
}

