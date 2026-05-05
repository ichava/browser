/**
 * useRoute Composable
 * 
 * Provides access to Laravel routes in Vue components.
 * Routes are injected from Blade via window.ichavaRoutes.
 * 
 * @example
 * ```vue
 * <script setup>
 * import { useRoute } from '@/ichava-ts/composables/useRoute'
 * 
 * const { route, hasRoute, routes } = useRoute()
 * 
 * // Generate route URL
 * const browserUrl = route('ichava.browser')
 * const iconUrl = route('ichava.api.icons.show', { id: 123 })
 * 
 * // Check if route exists
 * if (hasRoute('ichava.custom')) { ... }
 * </script>
 * ```
 */

import { computed } from 'vue'
import { ichava } from '../IchavaClient'

// Type for window with routes
declare global {
  interface Window {
    ichavaRoutes?: Record<string, string>
  }
}

/**
 * Route parameters type
 */
export type RouteParams = Record<string, string | number>

/**
 * useRoute composable
 */
export function useRoute() {
  /**
   * All available routes (reactive)
   */
  const routes = computed(() => ichava.getRoutes())

  /**
   * Generate a route URL
   * 
   * @param name - Route name (e.g., 'ichava.browser')
   * @param params - Route parameters (e.g., { id: 123 })
   * @returns The full URL
   * 
   * @example
   * route('ichava.browser') // '/ichava/browser'
   * route('ichava.api.icons.show', { id: 123 }) // '/ichava/api/icons/123'
   */
  const route = (name: string, params?: RouteParams): string => {
    return ichava.route(name, params)
  }

  /**
   * Check if a route exists
   */
  const hasRoute = (name: string): boolean => {
    return ichava.hasRoute(name)
  }

  /**
   * Navigate to a route (client-side)
   */
  const navigateTo = (name: string, params?: RouteParams): void => {
    const url = route(name, params)
    window.location.href = url
  }

  /**
   * Get route for anchor href (same as route but more semantic)
   */
  const href = (name: string, params?: RouteParams): string => {
    return route(name, params)
  }

  return {
    route,
    routes,
    hasRoute,
    navigateTo,
    href,
  }
}

/**
 * Standalone route function (for use outside Vue components)
 */
export const route = (name: string, params?: RouteParams): string => {
  return ichava.route(name, params)
}

export default useRoute

