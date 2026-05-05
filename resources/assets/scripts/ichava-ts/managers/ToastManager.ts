/**
 * ToastManager - Fluent OOP Toast Notification Manager
 * 
 * @example
 * const toasts = new ToastManager()
 * toasts.success('Done!', 'Operation completed')
 * toasts.copied('Icon name')
 * toasts.favoriteAdded('heart-icon')
 */

import { ref, type Ref } from 'vue'
import type { IToastManager, ToastMessage, ToastIcon } from '../types'

export class ToastManager implements IToastManager {
  private _toasts: Ref<ToastMessage[]> = ref([])
  private _defaultDuration: number = 3000

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  /**
   * Get all active toasts (reactive)
   */
  get toasts(): Ref<ToastMessage[]> {
    return this._toasts
  }

  /**
   * Get toast count
   */
  get count(): number {
    return this._toasts.value.length
  }

  // ==========================================================================
  // CORE METHODS (Fluent)
  // ==========================================================================

  /**
   * Add a toast notification (fluent)
   */
  add(toast: Omit<ToastMessage, 'id'>): this {
    const id = this.generateId()
    const duration = toast.duration ?? this._defaultDuration
    
    this._toasts.value.push({ ...toast, id })
    
    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id)
      }, duration)
    }
    
    return this
  }

  /**
   * Remove a toast by ID (fluent)
   */
  remove(id: string): this {
    const index = this._toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      this._toasts.value.splice(index, 1)
    }
    return this
  }

  /**
   * Clear all toasts (fluent)
   */
  clear(): this {
    this._toasts.value = []
    return this
  }

  /**
   * Set default duration for toasts (fluent)
   */
  setDefaultDuration(ms: number): this {
    this._defaultDuration = ms
    return this
  }

  // ==========================================================================
  // CONVENIENCE METHODS (Fluent)
  // ==========================================================================

  /**
   * Show success toast (fluent)
   */
  success(title: string, message?: string, icon: ToastIcon = 'check'): this {
    return this.add({ type: 'success', title, message, icon })
  }

  /**
   * Show error toast (fluent)
   */
  error(title: string, message?: string): this {
    return this.add({ type: 'error', title, message, icon: 'error' })
  }

  /**
   * Show info toast (fluent)
   */
  info(title: string, message?: string): this {
    return this.add({ type: 'info', title, message, icon: 'info' })
  }

  /**
   * Show warning toast (fluent)
   */
  warning(title: string, message?: string): this {
    return this.add({ type: 'warning', title, message, icon: 'info' })
  }

  // ==========================================================================
  // SPECIFIC ACTION TOASTS (Fluent)
  // ==========================================================================

  /**
   * Show "copied to clipboard" toast (fluent)
   */
  copied(itemName: string = 'Content'): this {
    return this.add({
      type: 'success',
      title: 'Copied!',
      message: `${itemName} copied to clipboard`,
      icon: 'copy'
    })
  }

  /**
   * Show "added to favorites" toast (fluent)
   */
  favoriteAdded(iconName: string): this {
    return this.add({
      type: 'success',
      title: 'Added to Favorites',
      message: iconName,
      icon: 'heart'
    })
  }

  /**
   * Show "removed from favorites" toast (fluent)
   */
  favoriteRemoved(iconName: string): this {
    return this.add({
      type: 'info',
      title: 'Removed from Favorites',
      message: iconName,
      icon: 'heart'
    })
  }

  /**
   * Show "downloaded" toast (fluent)
   */
  downloaded(iconName: string): this {
    return this.add({
      type: 'success',
      title: 'Downloaded',
      message: `${iconName}.svg`,
      icon: 'download'
    })
  }

  /**
   * Show "collection created" toast (fluent)
   */
  collectionCreated(name: string): this {
    return this.add({
      type: 'success',
      title: 'Collection Created',
      message: name,
      icon: 'check'
    })
  }

  /**
   * Show "collection deleted" toast (fluent)
   */
  collectionDeleted(name: string): this {
    return this.add({
      type: 'info',
      title: 'Collection Deleted',
      message: name,
      icon: 'trash'
    })
  }

  /**
   * Show "added to collection" toast (fluent)
   */
  addedToCollection(iconName: string, collectionName: string): this {
    return this.add({
      type: 'success',
      title: 'Added to Collection',
      message: `${iconName} → ${collectionName}`,
      icon: 'check'
    })
  }

  /**
   * Show "removed from collection" toast (fluent)
   */
  removedFromCollection(iconName: string, collectionName: string): this {
    return this.add({
      type: 'info',
      title: 'Removed from Collection',
      message: `${iconName} removed from ${collectionName}`,
      icon: 'trash'
    })
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

