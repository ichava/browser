/**
 * CollectionManager - Icon Collections Manager
 * 
 * Manages user collections of icons with full CRUD operations.
 */

import { ArrayManager } from './BaseManager'
import { StorageAdapter } from '../core/StorageAdapter'
import { EventBus } from '../core/EventBus'
import { HttpClient } from '../core/HttpClient'
import type { ICollectionManager, Collection } from '../types'

const DEFAULT_COLORS = ['#8b5cf6', '#ec4899', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16']

export class CollectionManager extends ArrayManager<Collection, string> implements ICollectionManager {
  constructor(storage: StorageAdapter, events: EventBus, http: HttpClient) {
    super(storage, events, http, 'collections')
  }

  /**
   * Find collection by ID
   */
  find(id: string): Collection | null {
    return this.items.find(c => c.id === id) || null
  }

  /**
   * Check if collection exists
   */
  has(id: string): boolean {
    return this.items.some(c => c.id === id)
  }

  /**
   * Create a new collection
   */
  create(name: string, color?: string): Collection {
    const collection: Collection = {
      id: `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color: color || this.getRandomColor(),
      iconIds: [],
      createdAt: new Date().toISOString(),
    }

    this.items.push(collection)
    this.persist()
    this.emit('collection:created', { collection })

    return collection
  }

  /**
   * Create collection with builder pattern
   */
  new(name: string): CollectionBuilder {
    return new CollectionBuilder(this, name)
  }

  /**
   * Update collection (fluent)
   */
  update(id: string, data: Partial<Omit<Collection, 'id' | 'createdAt'>>): this {
    const index = this.items.findIndex(c => c.id === id)
    if (index > -1 && this.items[index]) {
      const existing = this.items[index]!
      this.items[index] = {
        id: existing.id,
        name: data.name ?? existing.name,
        color: data.color ?? existing.color,
        iconIds: data.iconIds ?? existing.iconIds,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      }
      this.persist()
      this.emit('collection:updated', { collection: this.items[index] })
    }
    return this
  }

  /**
   * Delete collection (fluent)
   */
  delete(id: string): this {
    const index = this.items.findIndex(c => c.id === id)
    if (index > -1) {
      const deleted = this.items.splice(index, 1)[0]
      this.persist()
      this.emit('collection:deleted', { collection: deleted })
    }
    return this
  }

  /**
   * Rename collection (fluent)
   */
  rename(id: string, name: string): this {
    return this.update(id, { name })
  }

  /**
   * Change collection color (fluent)
   */
  setColor(id: string, color: string): this {
    return this.update(id, { color })
  }

  /**
   * Add icon to collection (fluent)
   */
  addIcon(collectionId: string, iconId: number): this {
    const collection = this.find(collectionId)
    if (collection && !collection.iconIds.includes(iconId)) {
      collection.iconIds.push(iconId)
      collection.updatedAt = new Date().toISOString()
      this.persist()
      this.emit('collection:icon:added', { collectionId, iconId })
    }
    return this
  }

  /**
   * Add multiple icons to collection (fluent)
   */
  addIcons(collectionId: string, iconIds: number[]): this {
    const collection = this.find(collectionId)
    if (collection) {
      const added: number[] = []
      iconIds.forEach(id => {
        if (!collection.iconIds.includes(id)) {
          collection.iconIds.push(id)
          added.push(id)
        }
      })
      if (added.length > 0) {
        collection.updatedAt = new Date().toISOString()
        this.persist()
        added.forEach(iconId => {
          this.emit('collection:icon:added', { collectionId, iconId })
        })
      }
    }
    return this
  }

  /**
   * Remove icon from collection (fluent)
   */
  removeIcon(collectionId: string, iconId: number): this {
    const collection = this.find(collectionId)
    if (collection) {
      const index = collection.iconIds.indexOf(iconId)
      if (index > -1) {
        collection.iconIds.splice(index, 1)
        collection.updatedAt = new Date().toISOString()
        this.persist()
        this.emit('collection:icon:removed', { collectionId, iconId })
      }
    }
    return this
  }

  /**
   * Toggle icon in collection (fluent)
   */
  toggleIcon(collectionId: string, iconId: number): this {
    const collection = this.find(collectionId)
    if (collection) {
      if (collection.iconIds.includes(iconId)) {
        this.removeIcon(collectionId, iconId)
      } else {
        this.addIcon(collectionId, iconId)
      }
    }
    return this
  }

  /**
   * Check if icon is in collection
   */
  hasIcon(collectionId: string, iconId: number): boolean {
    const collection = this.find(collectionId)
    return collection ? collection.iconIds.includes(iconId) : false
  }

  /**
   * Get icon count for collection
   */
  iconCount(collectionId: string): number {
    const collection = this.find(collectionId)
    return collection ? collection.iconIds.length : 0
  }

  /**
   * Get all icon IDs from a collection
   */
  getIconIds(collectionId: string): number[] {
    const collection = this.find(collectionId)
    return collection ? [...collection.iconIds] : []
  }

  /**
   * Find collections containing an icon
   */
  findByIcon(iconId: number): Collection[] {
    return this.items.filter(c => c.iconIds.includes(iconId))
  }

  /**
   * Clear all icons from a collection (fluent)
   */
  clearIcons(collectionId: string): this {
    const collection = this.find(collectionId)
    if (collection && collection.iconIds.length > 0) {
      collection.iconIds = []
      collection.updatedAt = new Date().toISOString()
      this.persist()
    }
    return this
  }

  /**
   * Get random color for new collection
   */
  private getRandomColor(): string {
    const index = Math.floor(Math.random() * DEFAULT_COLORS.length)
    return DEFAULT_COLORS[index] ?? '#8b5cf6'
  }

  private useApi: boolean = true

  /**
   * Set API mode (enable/disable API calls)
   */
  setApiMode(enabled: boolean): this {
    this.useApi = enabled
    return this
  }

  /**
   * Sync with API (fluent)
   */
  async sync(): Promise<this> {
    if (!this.useApi) return this
    
    try {
      await this.http.post('/preferences', {
        collections: this.items,
      })
      this.emit('storage:synced', { key: this.storageKey })
    } catch (error) {
      console.error('[CollectionManager] Failed to sync:', error)
    }
    return this
  }

  /**
   * Load from API
   */
  async fetch(): Promise<this> {
    if (!this.useApi) return this
    
    try {
      const response = await this.http.get<{ success: boolean; data: Array<{
        id: string
        name: string
        color: string
        icon_ids: number[]
        created_at: string
        updated_at?: string
        icons?: Array<{ id: number; name: string; package: string }>
      }> }>('/collections')
      
      if (response.success && response.data) {
        // Transform API response to Collection type
        this.items = response.data.map(col => ({
          id: col.id,
          name: col.name,
          color: col.color,
          iconIds: col.icon_ids || [],
          createdAt: col.created_at,
          updatedAt: col.updated_at,
        }))
        this.persist()
        this.emit('collection:loaded', { count: this.items.length })
      }
    } catch (error) {
      console.error('[CollectionManager] Failed to fetch, using local cache:', error)
    }
    return this
  }

  /**
   * Create collection with API sync
   */
  async createAsync(name: string, color?: string): Promise<Collection | null> {
    const collection = this.create(name, color)
    
    if (this.useApi) {
      try {
        const response = await this.http.post<{ success: boolean; data: { id: string } }>('/collections', {
          name,
          color: collection.color,
        })
        
        if (response.success && response.data?.id) {
          // Update local collection with API-generated ID
          const index = this.items.findIndex(c => c.id === collection.id)
          if (index > -1) {
            this.items[index] = { ...collection, id: response.data.id }
            this.persist()
            return this.items[index]!
          }
        }
      } catch (error) {
        // Rollback on error
        this.delete(collection.id)
        console.error('[CollectionManager] Failed to create collection:', error)
        return null
      }
    }
    
    return collection
  }

  /**
   * Delete collection with API sync
   */
  async deleteAsync(id: string): Promise<this> {
    const collection = this.find(id)
    if (!collection) return this
    
    // Optimistic delete
    this.delete(id)
    
    if (this.useApi) {
      try {
        await this.http.delete(`/collections/${id}`)
      } catch (error) {
        // Rollback on error
        this.items.push(collection)
        this.persist()
        console.error('[CollectionManager] Failed to delete collection:', error)
      }
    }
    
    return this
  }

  /**
   * Add icon to collection with API sync
   */
  async addIconAsync(collectionId: string, iconId: number): Promise<this> {
    // Optimistic update
    this.addIcon(collectionId, iconId)
    
    if (this.useApi) {
      try {
        await this.http.post(`/collections/${collectionId}/icons/${iconId}`)
      } catch (error) {
        // Rollback on error
        this.removeIcon(collectionId, iconId)
        console.error('[CollectionManager] Failed to add icon to collection:', error)
      }
    }
    
    return this
  }

  /**
   * Remove icon from collection with API sync
   */
  async removeIconAsync(collectionId: string, iconId: number): Promise<this> {
    const collection = this.find(collectionId)
    const hadIcon = collection?.iconIds.includes(iconId) ?? false
    
    // Optimistic update
    this.removeIcon(collectionId, iconId)
    
    if (this.useApi && hadIcon) {
      try {
        await this.http.delete(`/collections/${collectionId}/icons/${iconId}`)
      } catch (error) {
        // Rollback on error
        this.addIcon(collectionId, iconId)
        console.error('[CollectionManager] Failed to remove icon from collection:', error)
      }
    }
    
    return this
  }
}

/**
 * CollectionBuilder - Fluent builder for creating collections
 */
export class CollectionBuilder {
  private manager: CollectionManager
  private builderName: string
  private builderColor: string = '#8b5cf6'
  private builderIconIds: number[] = []

  constructor(manager: CollectionManager, name: string) {
    this.manager = manager
    this.builderName = name
  }

  /**
   * Set collection color
   */
  withColor(color: string): this {
    this.builderColor = color
    return this
  }

  /**
   * Add icon to collection
   */
  withIcon(iconId: number): this {
    if (!this.builderIconIds.includes(iconId)) {
      this.builderIconIds.push(iconId)
    }
    return this
  }

  /**
   * Add multiple icons
   */
  withIcons(iconIds: number[]): this {
    iconIds.forEach(id => this.withIcon(id))
    return this
  }

  /**
   * Build and save the collection
   */
  save(): Collection {
    const collection = this.manager.create(this.builderName, this.builderColor)
    if (this.builderIconIds.length > 0) {
      this.manager.addIcons(collection.id, this.builderIconIds)
    }
    return collection
  }
}

