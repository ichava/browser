/**
 * BaseManager - Abstract Base Class for All Managers
 * 
 * Provides common functionality for storage, events, and method chaining.
 * All managers extend this class for consistent behavior.
 */

import { StorageAdapter } from '../core/StorageAdapter'
import { EventBus } from '../core/EventBus'
import { HttpClient } from '../core/HttpClient'
import type { IchavaEventType, IManager } from '../types'

export abstract class BaseManager<T = unknown> implements IManager {
  protected storage: StorageAdapter
  protected events: EventBus
  protected http: HttpClient
  protected storageKey: string
  protected isInitialized: boolean = false

  constructor(
    storage: StorageAdapter,
    events: EventBus,
    http: HttpClient,
    storageKey: string
  ) {
    this.storage = storage
    this.events = events
    this.http = http
    this.storageKey = storageKey
  }

  /**
   * Initialize the manager - called once on startup
   */
  async initialize(): Promise<this> {
    if (this.isInitialized) return this
    
    this.loadFromStorage()
    this.isInitialized = true
    
    return this
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.isInitialized = false
  }

  /**
   * Persist current state to storage (fluent)
   */
  protected persist(): this {
    const data = this.toJSON()
    this.storage.set(this.storageKey, data)
    this.emit('storage:synced', { key: this.storageKey, data })
    return this
  }

  /**
   * Load state from storage
   */
  protected loadFromStorage(): void {
    // Override in subclasses
  }

  /**
   * Emit an event (fluent)
   */
  protected emit<P = unknown>(type: IchavaEventType, payload?: P): this {
    this.events.emit(type, payload)
    return this
  }

  /**
   * Subscribe to an event
   */
  protected on<P = unknown>(
    type: IchavaEventType, 
    handler: (event: { type: IchavaEventType; payload?: P; timestamp: number }) => void
  ): this {
    this.events.on(type, handler)
    return this
  }

  /**
   * Convert manager state to JSON-serializable format
   * Override in subclasses
   */
  abstract toJSON(): T

  /**
   * Get item count
   * Override in subclasses
   */
  abstract count(): number

  /**
   * Clear all data (fluent)
   */
  abstract clear(): this
}

/**
 * ArrayManager - Base class for managers that store arrays
 */
export abstract class ArrayManager<T, ID = number | string> extends BaseManager<T[]> {
  protected items: T[] = []

  /**
   * Get all items
   */
  getAll(): T[] {
    return [...this.items]
  }

  /**
   * Get item count
   */
  count(): number {
    return this.items.length
  }

  /**
   * Check if empty
   */
  isEmpty(): boolean {
    return this.items.length === 0
  }

  /**
   * Find item by ID
   */
  abstract find(id: ID): T | null

  /**
   * Check if item exists
   */
  abstract has(id: ID): boolean

  /**
   * Convert to JSON
   */
  toJSON(): T[] {
    return this.getAll()
  }

  /**
   * Load from storage
   */
  protected loadFromStorage(): void {
    this.items = this.storage.get<T[]>(this.storageKey, [])
  }

  /**
   * Clear all items (fluent)
   */
  clear(): this {
    this.items = []
    return this.persist()
  }

  /**
   * Filter items
   */
  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate)
  }

  /**
   * Map items
   */
  map<U>(mapper: (item: T) => U): U[] {
    return this.items.map(mapper)
  }

  /**
   * Find first matching item
   */
  findFirst(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate)
  }

  /**
   * Check if any item matches predicate
   */
  some(predicate: (item: T) => boolean): boolean {
    return this.items.some(predicate)
  }

  /**
   * Check if all items match predicate
   */
  every(predicate: (item: T) => boolean): boolean {
    return this.items.every(predicate)
  }
}

/**
 * StateManager - Base class for managers that store a state object
 */
export abstract class StateManager<T extends object> extends BaseManager<T> {
  protected state: T

  constructor(
    storage: StorageAdapter,
    events: EventBus,
    http: HttpClient,
    storageKey: string,
    defaultState: T
  ) {
    super(storage, events, http, storageKey)
    this.state = { ...defaultState }
  }

  /**
   * Get current state
   */
  getState(): T {
    return { ...this.state }
  }

  /**
   * Update state with partial values (fluent)
   */
  protected setState(partial: Partial<T>): this {
    this.state = { ...this.state, ...partial }
    return this.persist()
  }

  /**
   * Reset to default state (fluent)
   */
  abstract reset(): this

  /**
   * Convert to JSON
   */
  toJSON(): T {
    return this.getState()
  }

  /**
   * Load from storage
   */
  protected loadFromStorage(): void {
    const saved = this.storage.get<T | null>(this.storageKey, null)
    if (saved) {
      this.state = { ...this.state, ...saved }
    }
  }

  /**
   * Clear state (alias for reset)
   */
  clear(): this {
    return this.reset()
  }

  /**
   * Count (returns 1 for state objects)
   */
  count(): number {
    return Object.keys(this.state).length
  }
}

