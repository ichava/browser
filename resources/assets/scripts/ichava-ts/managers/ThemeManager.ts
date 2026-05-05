/**
 * ThemeManager - Dark/Light Mode Manager
 * 
 * Manages theme state with fluent interface.
 */

import { StateManager } from './BaseManager'
import { StorageAdapter } from '../core/StorageAdapter'
import { EventBus } from '../core/EventBus'
import { HttpClient } from '../core/HttpClient'
import type { IThemeManager, ThemeState } from '../types'

const DEFAULT_STATE: ThemeState = {
  isDark: true,
}

export class ThemeManager extends StateManager<ThemeState> implements IThemeManager {
  constructor(storage: StorageAdapter, events: EventBus, http: HttpClient) {
    super(storage, events, http, 'theme', DEFAULT_STATE)
  }

  /**
   * Initialize and apply theme to DOM
   */
  async initialize(): Promise<this> {
    await super.initialize()
    this.applyTheme()
    return this
  }

  /**
   * Check if dark mode is active
   */
  isDark(): boolean {
    return this.state.isDark
  }

  /**
   * Check if light mode is active
   */
  isLight(): boolean {
    return !this.state.isDark
  }

  /**
   * Set dark mode (fluent)
   */
  setDark(dark: boolean): this {
    if (this.state.isDark !== dark) {
      this.setState({ isDark: dark })
      this.applyTheme()
      this.emit('theme:changed', { isDark: dark })
    }
    return this
  }

  /**
   * Toggle theme (fluent)
   */
  toggle(): this {
    return this.setDark(!this.state.isDark)
  }

  /**
   * Set to dark mode (fluent)
   */
  dark(): this {
    return this.setDark(true)
  }

  /**
   * Set to light mode (fluent)
   */
  light(): this {
    return this.setDark(false)
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(): void {
    if (typeof document !== 'undefined') {
      if (this.state.isDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    }
  }

  /**
   * Reset to default theme (dark)
   */
  reset(): this {
    this.state = { ...DEFAULT_STATE }
    this.applyTheme()
    return this.persist()
  }

  /**
   * Match system preference
   */
  matchSystem(): this {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return this.setDark(prefersDark)
    }
    return this
  }

  /**
   * Watch for system preference changes
   */
  watchSystem(): this {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        this.setDark(e.matches)
      })
    }
    return this
  }
}

