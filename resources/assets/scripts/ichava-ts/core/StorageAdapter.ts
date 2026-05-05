/**
 * StorageAdapter - Storage Abstraction Layer
 * 
 * Provides a fluent interface for localStorage/sessionStorage operations.
 * Implements the Strategy pattern for different storage backends.
 */

import type { StorageType } from '../types'

export class StorageAdapter {
  private storage: Storage
  private prefix: string

  constructor(type: StorageType = 'localStorage', prefix: string = 'ichava') {
    this.storage = type === 'localStorage' ? localStorage : sessionStorage
    this.prefix = prefix
  }

  /**
   * Build a prefixed key
   */
  private buildKey(key: string): string {
    return `${this.prefix}-${key}`
  }

  /**
   * Get a value from storage
   */
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = this.storage.getItem(this.buildKey(key))
      if (item === null) return defaultValue
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`[StorageAdapter] Failed to get "${key}":`, error)
      return defaultValue
    }
  }

  /**
   * Set a value in storage (fluent)
   */
  set<T>(key: string, value: T): this {
    try {
      this.storage.setItem(this.buildKey(key), JSON.stringify(value))
    } catch (error) {
      console.error(`[StorageAdapter] Failed to set "${key}":`, error)
    }
    return this
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return this.storage.getItem(this.buildKey(key)) !== null
  }

  /**
   * Remove a key from storage (fluent)
   */
  remove(key: string): this {
    try {
      this.storage.removeItem(this.buildKey(key))
    } catch (error) {
      console.error(`[StorageAdapter] Failed to remove "${key}":`, error)
    }
    return this
  }

  /**
   * Clear all prefixed keys (fluent)
   */
  clear(): this {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => this.storage.removeItem(key))
    } catch (error) {
      console.error('[StorageAdapter] Failed to clear:', error)
    }
    return this
  }

  /**
   * Get all keys with the prefix
   */
  keys(): string[] {
    const keys: string[] = []
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(`${this.prefix}-`, ''))
      }
    }
    return keys
  }

  /**
   * Get the size of stored data (approximate, in bytes)
   */
  size(): number {
    let total = 0
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i)
      if (key && key.startsWith(this.prefix)) {
        const value = this.storage.getItem(key) || ''
        total += key.length + value.length
      }
    }
    return total * 2 // UTF-16 = 2 bytes per char
  }

  /**
   * Update a value using a callback function (fluent)
   */
  update<T>(key: string, updater: (current: T | null) => T): this {
    const current = this.has(key) ? this.get<T>(key, null as T) : null
    const updated = updater(current)
    return this.set(key, updated)
  }

  /**
   * Merge an object with existing stored object (fluent)
   */
  merge<T extends object>(key: string, data: Partial<T>): this {
    const current = this.get<T>(key, {} as T)
    return this.set(key, { ...current, ...data })
  }

  /**
   * Push an item to an array in storage (fluent)
   */
  push<T>(key: string, item: T): this {
    const array = this.get<T[]>(key, [])
    array.push(item)
    return this.set(key, array)
  }

  /**
   * Remove an item from an array in storage by predicate (fluent)
   */
  pull<T>(key: string, predicate: (item: T) => boolean): this {
    const array = this.get<T[]>(key, [])
    const filtered = array.filter(item => !predicate(item))
    return this.set(key, filtered)
  }

  /**
   * Toggle an item in an array (add if not exists, remove if exists)
   */
  toggle<T>(key: string, item: T, comparator?: (a: T, b: T) => boolean): this {
    const array = this.get<T[]>(key, [])
    const compare = comparator || ((a, b) => a === b)
    const index = array.findIndex(existing => compare(existing, item))
    
    if (index > -1) {
      array.splice(index, 1)
    } else {
      array.push(item)
    }
    
    return this.set(key, array)
  }

  /**
   * Check if an item exists in a stored array
   */
  includes<T>(key: string, item: T, comparator?: (a: T, b: T) => boolean): boolean {
    const array = this.get<T[]>(key, [])
    const compare = comparator || ((a, b) => a === b)
    return array.some(existing => compare(existing, item))
  }

  /**
   * Get storage prefix
   */
  getPrefix(): string {
    return this.prefix
  }

  /**
   * Set storage prefix (fluent)
   */
  setPrefix(prefix: string): this {
    this.prefix = prefix
    return this
  }

  /**
   * Switch storage type (fluent)
   */
  useStorage(type: StorageType): this {
    this.storage = type === 'localStorage' ? localStorage : sessionStorage
    return this
  }
}

// Export default instance
export const storage = new StorageAdapter()

