/**
 * CommandHistoryManager - Command Palette History Manager
 * 
 * Tracks and manages command history for the command palette.
 * Stores recent commands, searches, and actions with API integration.
 */

import { ArrayManager } from './BaseManager'
import { HttpClient } from '../core/HttpClient'
import { StorageAdapter } from '../core/StorageAdapter'
import { EventBus } from '../core/EventBus'
import type { ApiResponse } from '../api/types'

export interface CommandHistoryEntry {
  command: string
  type: 'action' | 'search' | 'navigation'
  metadata?: Record<string, unknown>
  timestamp: string
  formatted_time?: string
}

export class CommandHistoryManager extends ArrayManager<CommandHistoryEntry, string> {
  private lastFetch: number = 0
  private cacheTimeout: number = 5 * 60 * 1000 // 5 minutes

  constructor(storage: StorageAdapter, events: EventBus, http: HttpClient) {
    super(storage, events, http, 'ichava.commandHistory')
  }

  /**
   * Get recent commands from API or cache
   */
  async getRecentCommands(forceRefresh: boolean = false): Promise<CommandHistoryEntry[]> {
    const now = Date.now()
    const needsRefresh = forceRefresh || (now - this.lastFetch > this.cacheTimeout)

    if (needsRefresh) {
      try {
        const response = await this.http.get<CommandHistoryEntry[]>('/command-history')
        
        if (response.success && response.data) {
          this.items = Array.isArray(response.data) ? response.data : []
          this.lastFetch = now
          this.persist()
        }
      } catch (error) {
        console.warn('[CommandHistoryManager] Failed to fetch history from API, using cache', error)
      }
    }

    return this.getAll()
  }

  /**
   * Add command to history
   */
  async addCommand(
    command: string,
    type: 'action' | 'search' | 'navigation',
    metadata: Record<string, unknown> = {}
  ): Promise<this> {
    try {
      await this.http.post('/command-history', {
        command,
        type,
        metadata,
      })

      // Add to local cache immediately for instant UI update
      const entry: CommandHistoryEntry = {
        command,
        type,
        metadata,
        timestamp: new Date().toISOString(),
        formatted_time: 'Just now',
      }

      this.items.unshift(entry)
      
      // Keep only last 50 entries
      if (this.items.length > 50) {
        this.items = this.items.slice(0, 50)
      }

      this.persist()
      this.emit('commandHistory:added', entry)
    } catch (error) {
      console.error('[CommandHistoryManager] Failed to add command', error)
    }

    return this
  }

  /**
   * Clear command history
   */
  async clearHistory(): Promise<this> {
    try {
      await this.http.delete('/command-history')
      this.items = []
      this.persist()
      this.emit('commandHistory:cleared')
    } catch (error) {
      console.error('[CommandHistoryManager] Failed to clear history', error)
    }

    return this
  }

  /**
   * Find command by exact match
   */
  find(command: string): CommandHistoryEntry | null {
    return this.items.find(item => item.command === command) || null
  }

  /**
   * Check if command exists
   */
  has(command: string): boolean {
    return this.items.some(item => item.command === command)
  }

  /**
   * Get recent commands by type
   */
  getByType(type: 'action' | 'search' | 'navigation'): CommandHistoryEntry[] {
    return this.items.filter(item => item.type === type)
  }

  /**
   * Search commands
   */
  search(query: string): CommandHistoryEntry[] {
    const lowerQuery = query.toLowerCase()
    return this.items.filter(item => 
      item.command.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Get most recent N commands
   */
  getRecent(limit: number = 10): CommandHistoryEntry[] {
    return this.items.slice(0, limit)
  }
}

