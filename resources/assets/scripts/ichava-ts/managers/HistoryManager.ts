/**
 * HistoryManager - Icon Activity History Manager
 * 
 * Tracks user interactions with icons (view, copy, download).
 */

import { ArrayManager } from './BaseManager'
import { StorageAdapter } from '../core/StorageAdapter'
import { EventBus } from '../core/EventBus'
import { HttpClient } from '../core/HttpClient'
import type { IHistoryManager, HistoryEntry, HistoryAction } from '../types'

const MAX_HISTORY_ENTRIES = 100

export class HistoryManager extends ArrayManager<HistoryEntry, string> implements IHistoryManager {
  private maxEntries: number

  constructor(storage: StorageAdapter, events: EventBus, http: HttpClient) {
    super(storage, events, http, 'history')
    this.maxEntries = MAX_HISTORY_ENTRIES
  }

  /**
   * Find entry by icon ID (returns first matching entry)
   */
  find(iconId: string): HistoryEntry | null {
    const numericId = parseInt(iconId, 10)
    return this.items.find(entry => entry.iconId === numericId) || null
  }

  /**
   * Check if icon exists in history
   */
  has(iconId: string): boolean {
    const numericId = parseInt(iconId, 10)
    return this.items.some(entry => entry.iconId === numericId)
  }

  /**
   * Add entry to history (fluent)
   */
  add(iconId: number, action: HistoryAction): this {
    const entry: HistoryEntry = {
      iconId,
      iconName: `Icon #${iconId}`, // Will be enriched by caller
      action,
      timestamp: new Date().toISOString(),
    }

    // Add to beginning
    this.items.unshift(entry)

    // Trim to max entries
    if (this.items.length > this.maxEntries) {
      this.items = this.items.slice(0, this.maxEntries)
    }

    this.persist()
    this.emit('history:added', { entry })
    
    return this
  }

  /**
   * Add entry with icon name (fluent)
   */
  addWithName(iconId: number, iconName: string, action: HistoryAction): this {
    const entry: HistoryEntry = {
      iconId,
      iconName,
      action,
      timestamp: new Date().toISOString(),
    }

    this.items.unshift(entry)

    if (this.items.length > this.maxEntries) {
      this.items = this.items.slice(0, this.maxEntries)
    }

    this.persist()
    this.emit('history:added', { entry })
    
    return this
  }

  /**
   * Record a view action (fluent)
   */
  view(iconId: number, iconName?: string): this {
    return iconName 
      ? this.addWithName(iconId, iconName, 'view')
      : this.add(iconId, 'view')
  }

  /**
   * Record a copy action (fluent)
   */
  copy(iconId: number, iconName?: string): this {
    return iconName 
      ? this.addWithName(iconId, iconName, 'copy')
      : this.add(iconId, 'copy')
  }

  /**
   * Record a download action (fluent)
   */
  download(iconId: number, iconName?: string): this {
    return iconName 
      ? this.addWithName(iconId, iconName, 'download')
      : this.add(iconId, 'download')
  }

  /**
   * Clear all history (fluent)
   */
  clear(): this {
    this.items = []
    this.persist()
    this.emit('history:cleared')
    return this
  }

  /**
   * Get entries by action type
   */
  byAction(action: HistoryAction): HistoryEntry[] {
    return this.items.filter(entry => entry.action === action)
  }

  /**
   * Get view history
   */
  views(): HistoryEntry[] {
    return this.byAction('view')
  }

  /**
   * Get copy history
   */
  copies(): HistoryEntry[] {
    return this.byAction('copy')
  }

  /**
   * Get download history
   */
  downloads(): HistoryEntry[] {
    return this.byAction('download')
  }

  /**
   * Get history for a specific icon
   */
  forIcon(iconId: number): HistoryEntry[] {
    return this.items.filter(entry => entry.iconId === iconId)
  }

  /**
   * Get recent entries
   */
  recent(n: number = 10): HistoryEntry[] {
    return this.items.slice(0, n)
  }

  /**
   * Get unique icon IDs from history
   */
  uniqueIconIds(): number[] {
    return [...new Set(this.items.map(entry => entry.iconId))]
  }

  /**
   * Set max entries limit (fluent)
   */
  setMaxEntries(max: number): this {
    this.maxEntries = max
    if (this.items.length > max) {
      this.items = this.items.slice(0, max)
      this.persist()
    }
    return this
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
      await this.http.post('/history', {
        entries: this.items.slice(0, 10), // Only sync recent entries
      })
      this.emit('storage:synced', { key: this.storageKey })
    } catch (error) {
      console.error('[HistoryManager] Failed to sync:', error)
    }
    return this
  }

  /**
   * Load history from API
   */
  async fetch(): Promise<this> {
    if (!this.useApi) return this
    
    try {
      const response = await this.http.get<{ 
        success: boolean
        data: Array<{
          icon_id: number
          icon_name: string
          action: 'view' | 'copy' | 'download'
          timestamp: string
          formatted_time?: string
        }>
      }>('/history')
      
      if (response.success && response.data) {
        this.items = response.data.map(entry => ({
          iconId: entry.icon_id,
          iconName: entry.icon_name,
          action: entry.action,
          timestamp: entry.timestamp,
        }))
        this.persist()
        this.emit('history:loaded', { count: this.items.length })
      }
    } catch (error) {
      console.error('[HistoryManager] Failed to fetch, using local cache:', error)
    }
    return this
  }

  /**
   * Log action to API
   */
  async logToApi(iconId: number, action: HistoryAction): Promise<void> {
    if (!this.useApi) return
    
    try {
      await this.http.post('/history', {
        icon_id: iconId,
        action,
      })
    } catch (error) {
      console.error('[HistoryManager] Failed to log action to API:', error)
    }
  }

  /**
   * Add entry with API sync
   */
  async addAsync(iconId: number, iconName: string, action: HistoryAction): Promise<this> {
    // Local update
    this.addWithName(iconId, iconName, action)
    
    // API sync (fire and forget)
    this.logToApi(iconId, action)
    
    return this
  }

  /**
   * Clear history with API sync
   */
  async clearAsync(): Promise<this> {
    this.clear()
    
    if (this.useApi) {
      try {
        await this.http.delete('/history')
      } catch (error) {
        console.error('[HistoryManager] Failed to clear history on API:', error)
      }
    }
    
    return this
  }

  /**
   * Format timestamp for display
   */
  static formatTimeAgo(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)

    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    return `${diffDay}d ago`
  }

  /**
   * Get entries with formatted time
   */
  withFormattedTime(): (HistoryEntry & { formattedTime: string })[] {
    return this.items.map(entry => ({
      ...entry,
      formattedTime: HistoryManager.formatTimeAgo(entry.timestamp),
    }))
  }
}

