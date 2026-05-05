/**
 * Formatter - Formatting Utility Class
 * 
 * Provides number, date, and string formatting utilities.
 */

export class Formatter {
  /**
   * Format number with locale-aware separators
   */
  static number(num: number, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale).format(num)
  }

  /**
   * Format number with compact notation (1K, 1M, etc.)
   */
  static compact(num: number, locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(num)
  }

  /**
   * Format bytes to human readable string
   */
  static bytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
  }

  /**
   * Format percentage
   */
  static percent(value: number, total: number, decimals: number = 1): string {
    if (total === 0) return '0%'
    const percentage = (value / total) * 100
    return `${percentage.toFixed(decimals)}%`
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static timeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHour = Math.floor(diffMin / 60)
    const diffDay = Math.floor(diffHour / 24)
    const diffWeek = Math.floor(diffDay / 7)
    const diffMonth = Math.floor(diffDay / 30)
    const diffYear = Math.floor(diffDay / 365)

    if (diffSec < 60) return 'Just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHour < 24) return `${diffHour}h ago`
    if (diffDay < 7) return `${diffDay}d ago`
    if (diffWeek < 4) return `${diffWeek}w ago`
    if (diffMonth < 12) return `${diffMonth}mo ago`
    return `${diffYear}y ago`
  }

  /**
   * Format date to locale string
   */
  static date(date: Date | string, locale: string = 'en-US'): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  /**
   * Format date and time
   */
  static dateTime(date: Date | string, locale: string = 'en-US'): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  /**
   * Truncate string with ellipsis
   */
  static truncate(str: string, length: number, ellipsis: string = '...'): string {
    if (str.length <= length) return str
    return str.slice(0, length - ellipsis.length) + ellipsis
  }

  /**
   * Convert to kebab-case
   */
  static kebab(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }

  /**
   * Convert to camelCase
   */
  static camel(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^(.)/, c => c.toLowerCase())
  }

  /**
   * Convert to PascalCase
   */
  static pascal(str: string): string {
    const camel = this.camel(str)
    return camel.charAt(0).toUpperCase() + camel.slice(1)
  }

  /**
   * Pluralize a word
   */
  static pluralize(word: string, count: number, plural?: string): string {
    if (count === 1) return word
    return plural || `${word}s`
  }

  /**
   * Format count with label (e.g., "5 icons")
   */
  static countLabel(count: number, singular: string, plural?: string): string {
    const formatted = this.number(count)
    const label = this.pluralize(singular, count, plural)
    return `${formatted} ${label}`
  }
}

// Export convenience functions
export const formatNumber = Formatter.number.bind(Formatter)
export const formatCompact = Formatter.compact.bind(Formatter)
export const formatTimeAgo = Formatter.timeAgo.bind(Formatter)
export const formatBytes = Formatter.bytes.bind(Formatter)

