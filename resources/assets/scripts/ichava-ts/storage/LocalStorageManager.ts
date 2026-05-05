/**
 * LocalStorageManager - Browser localStorage persistence layer
 * 
 * Provides fallback persistence for preferences when session expires.
 * Works alongside session storage for enhanced user experience.
 */

export interface StoredPreferences {
  filters?: {
    search?: string
    packages?: string[]
    categories?: string[]
  }
  sorting?: {
    sort_by?: string
    sort_direction?: string
  }
  preferences?: {
    view_mode?: string
    icon_size?: number
    icon_color?: string
    per_page?: number
    is_dark?: boolean
  }
  pagination?: {
    current_page?: number
    per_page?: number
  }
  // Metadata
  _version?: string
  _timestamp?: string
}

export class LocalStorageManager {
  private readonly STORAGE_KEY = 'ichava_preferences'
  private readonly VERSION = '1.0.0'
  private readonly MAX_AGE_DAYS = 30 // Auto-clear after 30 days

  /**
   * Check if localStorage is available
   */
  private isAvailable(): boolean {
    try {
      const test = '__ichava_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch {
      return false
    }
  }

  /**
   * Save preferences to localStorage
   */
  save(preferences: StoredPreferences): boolean {
    if (!this.isAvailable()) {
      console.warn('[Ichava] localStorage not available')
      return false
    }

    try {
      const data: StoredPreferences = {
        ...preferences,
        _version: this.VERSION,
        _timestamp: new Date().toISOString(),
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
      console.debug('[Ichava] Preferences saved to localStorage')
      return true
    } catch (error) {
      console.error('[Ichava] Failed to save to localStorage:', error)
      return false
    }
  }

  /**
   * Load preferences from localStorage
   */
  load(): StoredPreferences | null {
    if (!this.isAvailable()) {
      return null
    }

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY)
      if (!raw) {
        return null
      }

      const data = JSON.parse(raw) as StoredPreferences

      // Check version compatibility
      if (data._version !== this.VERSION) {
        console.warn('[Ichava] localStorage version mismatch, clearing')
        this.clear()
        return null
      }

      // Check age
      if (data._timestamp && this.isExpired(data._timestamp)) {
        console.warn('[Ichava] localStorage data expired, clearing')
        this.clear()
        return null
      }

      console.debug('[Ichava] Preferences loaded from localStorage')
      return data
    } catch (error) {
      console.error('[Ichava] Failed to load from localStorage:', error)
      this.clear() // Clear corrupted data
      return null
    }
  }

  /**
   * Clear all stored preferences
   */
  clear(): void {
    if (!this.isAvailable()) {
      return
    }

    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.debug('[Ichava] localStorage cleared')
    } catch (error) {
      console.error('[Ichava] Failed to clear localStorage:', error)
    }
  }

  /**
   * Check if stored data is expired
   */
  private isExpired(timestamp: string): boolean {
    try {
      const stored = new Date(timestamp)
      const now = new Date()
      const daysDiff = (now.getTime() - stored.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff > this.MAX_AGE_DAYS
    } catch {
      return true
    }
  }

  /**
   * Get storage info for debugging
   */
  getInfo(): { available: boolean; size?: number; timestamp?: string; version?: string } {
    if (!this.isAvailable()) {
      return { available: false }
    }

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY)
      if (!raw) {
        return { available: true }
      }

      const data = JSON.parse(raw) as StoredPreferences
      return {
        available: true,
        size: raw.length,
        timestamp: data._timestamp,
        version: data._version,
      }
    } catch {
      return { available: true }
    }
  }
}

// Singleton instance
export const localStorageManager = new LocalStorageManager()
