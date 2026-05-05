/**
 * EventBus - Reactive Event Emitter
 * 
 * Lightweight event system for cross-manager communication.
 * Implements the Observer pattern with type-safe events.
 */

import type { IchavaEventType, IchavaEvent, IchavaEventHandler } from '../types'

export class EventBus {
  private static instance: EventBus
  private listeners: Map<IchavaEventType, Set<IchavaEventHandler>>
  private allListeners: Set<IchavaEventHandler>

  private constructor() {
    this.listeners = new Map()
    this.allListeners = new Set()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  /**
   * Subscribe to a specific event type
   */
  on<T = unknown>(type: IchavaEventType, handler: IchavaEventHandler<T>): this {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(handler as IchavaEventHandler)
    return this
  }

  /**
   * Subscribe to all events
   */
  onAll(handler: IchavaEventHandler): this {
    this.allListeners.add(handler)
    return this
  }

  /**
   * Unsubscribe from a specific event type
   */
  off<T = unknown>(type: IchavaEventType, handler: IchavaEventHandler<T>): this {
    const handlers = this.listeners.get(type)
    if (handlers) {
      handlers.delete(handler as IchavaEventHandler)
    }
    return this
  }

  /**
   * Unsubscribe from all events
   */
  offAll(handler?: IchavaEventHandler): this {
    if (handler) {
      this.allListeners.delete(handler)
    } else {
      this.allListeners.clear()
      this.listeners.clear()
    }
    return this
  }

  /**
   * Emit an event
   */
  emit<T = unknown>(type: IchavaEventType, payload?: T): this {
    const event: IchavaEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
    }

    // Notify type-specific listeners
    const handlers = this.listeners.get(type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event as IchavaEvent)
        } catch (error) {
          console.error(`[EventBus] Error in handler for ${type}:`, error)
        }
      })
    }

    // Notify all-event listeners
    this.allListeners.forEach(handler => {
      try {
        handler(event as IchavaEvent)
      } catch (error) {
        console.error(`[EventBus] Error in global handler:`, error)
      }
    })

    return this
  }

  /**
   * Subscribe once - auto-unsubscribe after first emit
   */
  once<T = unknown>(type: IchavaEventType, handler: IchavaEventHandler<T>): this {
    const onceHandler: IchavaEventHandler<T> = (event) => {
      this.off(type, onceHandler)
      handler(event)
    }
    return this.on(type, onceHandler)
  }

  /**
   * Get listener count for a specific event type
   */
  listenerCount(type: IchavaEventType): number {
    return this.listeners.get(type)?.size ?? 0
  }

  /**
   * Check if there are any listeners for a type
   */
  hasListeners(type: IchavaEventType): boolean {
    return this.listenerCount(type) > 0 || this.allListeners.size > 0
  }

  /**
   * Clear all listeners and reset singleton
   */
  dispose(): void {
    this.listeners.clear()
    this.allListeners.clear()
  }
}

// Export singleton accessor
export const eventBus = EventBus.getInstance()

