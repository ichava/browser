/**
 * Download - File Download Utility Class
 * 
 * Provides SVG download operations.
 */

import type { Icon, DownloadOptions } from '../types'

export class Download {
  /**
   * Download SVG content as file
   */
  static downloadSvg(svgContent: string, filename: string): void {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    this.downloadBlob(blob, filename)
  }

  /**
   * Download from URL
   */
  static async downloadFromUrl(url: string, filename: string): Promise<void> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      this.downloadBlob(blob, filename)
    } catch (error) {
      console.error('[Download] Failed to download from URL:', error)
      throw error
    }
  }

  /**
   * Download blob as file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  /**
   * Download icon as SVG
   */
  static async downloadIcon(icon: Icon, svgContent: string, options?: DownloadOptions): Promise<void> {
    const filename = options?.filename || `${icon.name}.svg`
    
    // Apply color transformation if specified
    let content = svgContent
    if (options?.color) {
      content = this.applyColor(svgContent, options.color)
    }

    this.downloadSvg(content, filename)
  }

  /**
   * Apply color to SVG content
   */
  static applyColor(svgContent: string, color: string): string {
    // Replace fill and stroke with specified color
    return svgContent
      .replace(/fill="[^"]*"/g, `fill="${color}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
  }

  /**
   * Convert SVG to data URL
   */
  static svgToDataUrl(svgContent: string): string {
    const encoded = encodeURIComponent(svgContent)
    return `data:image/svg+xml,${encoded}`
  }

  /**
   * Convert SVG to PNG data URL (via canvas)
   */
  static async svgToPng(svgContent: string, size: number = 64): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, size, size)
        URL.revokeObjectURL(url)
        
        resolve(canvas.toDataURL('image/png'))
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load SVG'))
      }

      img.src = url
    })
  }

  /**
   * Download icon as PNG
   */
  static async downloadIconAsPng(
    icon: Icon, 
    svgContent: string, 
    size: number = 64,
    filename?: string
  ): Promise<void> {
    try {
      const pngDataUrl = await this.svgToPng(svgContent, size)
      const response = await fetch(pngDataUrl)
      const blob = await response.blob()
      this.downloadBlob(blob, filename || `${icon.name}.png`)
    } catch (error) {
      console.error('[Download] Failed to convert to PNG:', error)
      throw error
    }
  }
}

/**
 * Convenience function for downloading SVG
 */
export function downloadSvg(svgContent: string, filename: string): void {
  Download.downloadSvg(svgContent, filename)
}

