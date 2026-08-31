/**
 * Clipboard - Clipboard Utility Class
 * 
 * Provides clipboard operations with fallback support.
 */

import type { ClipboardResult } from '../types'

export class Clipboard {
  /**
   * Copy text to clipboard
   */
  static async copy(text: string): Promise<ClipboardResult> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return { success: true }
      }

      // Fallback for older browsers
      return this.copyFallback(text)
    } catch (error) {
      console.error('[Clipboard] Failed to copy:', error)
      return { success: false, error: error as Error }
    }
  }

  /**
   * Fallback copy using execCommand
   */
  private static copyFallback(text: string): ClipboardResult {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const success = document.execCommand('copy')
      document.body.removeChild(textArea)

      return { success }
    } catch (error) {
      return { success: false, error: error as Error }
    }
  }

  /**
   * Read text from clipboard
   */
  static async read(): Promise<string | null> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText()
      }
      return null
    } catch (error) {
      console.error('[Clipboard] Failed to read:', error)
      return null
    }
  }

  /**
   * Check if clipboard API is available
   */
  static isSupported(): boolean {
    return !!(navigator.clipboard && navigator.clipboard.writeText)
  }

  /**
   * Copy with notification callback
   */
  static async copyWithNotification(
    text: string,
    onSuccess?: () => void,
    onError?: (error: Error) => void
  ): Promise<boolean> {
    const result = await this.copy(text)
    
    if (result.success) {
      onSuccess?.()
    } else if (result.error) {
      onError?.(result.error)
    }

    return result.success
  }
}

/**
 * Convenience function for copying
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const result = await Clipboard.copy(text)
  return result.success
}

