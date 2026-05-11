/**
 * HttpClient - Fluent HTTP Client
 * 
 * Axios wrapper with fluent interface for API requests.
 * Supports method chaining and request configuration.
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { 
  ApiResponse, 
  PaginatedResponse 
} from '../api/types'
import { ApiTransformer } from '../api/types'

export interface HttpClientConfig {
  baseUrl: string
  timeout: number
  headers?: Record<string, string>
  withCredentials?: boolean
}

/**
 * Generate a simple browser fingerprint for session identification
 * This allows preferences to persist even when cookies don't work (different domains)
 */
function generateBrowserId(): string {
  // Collect stable browser properties
  const props = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform || '',
  ].join('|')
  
  // Simple hash function
  let hash = 0
  for (let i = 0; i < props.length; i++) {
    const char = props.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive hex string and pad to ensure consistent length
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0')
  
  // Add timestamp segment for additional uniqueness (changes daily)
  const dayStamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)).toString(16)
  
  return `ichava_${hexHash}_${dayStamp}`
}

// Cache the browser ID
let cachedBrowserId: string | null = null

function getBrowserId(): string {
  if (!cachedBrowserId) {
    cachedBrowserId = generateBrowserId()
  }
  return cachedBrowserId
}

export class HttpClient {
  private client: AxiosInstance
  private defaultConfig: HttpClientConfig
  private csrfInitialized: boolean = false

  constructor(config?: Partial<HttpClientConfig>) {
    this.defaultConfig = {
      baseUrl: '/ichava/api',
      timeout: 15000,
      withCredentials: true,
      ...config,
    }

    this.client = axios.create({
      baseURL: this.defaultConfig.baseUrl,
      timeout: this.defaultConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...this.defaultConfig.headers,
      },
      withCredentials: this.defaultConfig.withCredentials,
    })

    this.setupInterceptors()
  }

  /**
   * Initialize CSRF cookie for Laravel Sanctum stateful API
   * Should be called once during app initialization
   */
  async initializeCsrf(): Promise<void> {
    if (this.csrfInitialized) {
      return
    }

    try {
      // Make request to Sanctum's CSRF cookie endpoint
      // This sets the XSRF-TOKEN cookie that will be used for subsequent requests
      await axios.get('/sanctum/csrf-cookie', {
        withCredentials: true,
      })
      
      this.csrfInitialized = true
      console.debug('[HttpClient] CSRF cookie initialized')
    } catch (error) {
      console.warn('[HttpClient] Failed to initialize CSRF cookie:', error)
      // Don't throw - allow the app to continue, meta tag CSRF will be used as fallback
    }
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add browser ID for session identification (enables cross-domain preferences)
        if (config.headers) {
          config.headers['X-Browser-Id'] = getBrowserId()
        }

        // Add CSRF token if available (Laravel)
        const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content
        if (csrfToken && config.headers) {
          config.headers['X-CSRF-TOKEN'] = csrfToken
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status
          
          if (status === 401) {
            console.warn('[HttpClient] Unauthorized')
          }
          
          if (status === 419) {
            console.warn('[HttpClient] CSRF token mismatch')
          }
          
          if (status === 429) {
            console.warn('[HttpClient] Rate limited')
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  /**
   * Configure the client (fluent)
   */
  configure(config: Partial<HttpClientConfig>): this {
    if (config.baseUrl) {
      this.client.defaults.baseURL = config.baseUrl
    }
    if (config.timeout) {
      this.client.defaults.timeout = config.timeout
    }
    if (config.headers) {
      Object.assign(this.client.defaults.headers, config.headers)
    }
    return this
  }

  /**
   * Set base URL (fluent)
   */
  setBaseUrl(url: string): this {
    this.client.defaults.baseURL = url
    return this
  }

  /**
   * Set timeout (fluent)
   */
  setTimeout(timeout: number): this {
    this.client.defaults.timeout = timeout
    return this
  }

  /**
   * Set header (fluent)
   */
  setHeader(name: string, value: string): this {
    this.client.defaults.headers.common[name] = value
    return this
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config)
      return this.handleSuccess(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const cleanedData = data ? ApiTransformer.cleanPayload(data) : data
      const response = await this.client.post<ApiResponse<T>>(url, cleanedData, config)
      return this.handleSuccess(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const cleanedData = data ? ApiTransformer.cleanPayload(data) : data
      const response = await this.client.put<ApiResponse<T>>(url, cleanedData, config)
      return this.handleSuccess(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const cleanedData = data ? ApiTransformer.cleanPayload(data) : data
      const response = await this.client.patch<ApiResponse<T>>(url, cleanedData, config)
      return this.handleSuccess(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config)
      return this.handleSuccess(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Handle successful response
   */
  private handleSuccess<T>(response: AxiosResponse<ApiResponse<T>>): ApiResponse<T> {
    return {
      success: true,
      data: response.data.data || response.data,
      message: response.data.message,
      meta: response.data.meta
    }
  }

  /**
   * Handle error response.
   *
   * Accepts `unknown` and narrows via type guards so callers can pass raw
   * caught exceptions without an upstream cast.
   */
  private handleError(error: unknown): ApiResponse<never> {
    if (axios.isAxiosError(error) && error.response) {
      const { data, status } = error.response
      const payload = (data ?? {}) as { error?: string; message?: string; errors?: unknown; meta?: Record<string, unknown> }

      return {
        success: false,
        error: payload.error || payload.message || 'An error occurred',
        errors: payload.errors as ApiResponse<never>['errors'],
        meta: {
          status,
          ...(payload.meta ?? {})
        }
      }
    }

    const message = error instanceof Error ? error.message : 'Network error occurred'

    return {
      success: false,
      error: message,
      meta: {
        status: 0
      }
    }
  }

  /**
   * Raw request (returns full AxiosResponse)
   */
  async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.request<T>(config)
  }

  /**
   * Create a request builder for fluent request construction
   */
  request_builder(): RequestBuilder {
    return new RequestBuilder(this.client)
  }

  /**
   * Get the underlying Axios instance
   */
  getAxiosInstance(): AxiosInstance {
    return this.client
  }
}

/**
 * RequestBuilder - Fluent Request Constructor
 */
export class RequestBuilder {
  private client: AxiosInstance
  private config: AxiosRequestConfig = {}

  constructor(client: AxiosInstance) {
    this.client = client
  }

  /**
   * Set request method
   */
  method(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'): this {
    this.config.method = method
    return this
  }

  /**
   * Set request URL
   */
  url(url: string): this {
    this.config.url = url
    return this
  }

  /**
   * Set request params (query string)
   */
  params(params: Record<string, unknown>): this {
    this.config.params = { ...this.config.params, ...params }
    return this
  }

  /**
   * Set request body data
   */
  data(data: unknown): this {
    this.config.data = data
    return this
  }

  /**
   * Set request headers
   */
  headers(headers: Record<string, string>): this {
    this.config.headers = { ...this.config.headers, ...headers }
    return this
  }

  /**
   * Set timeout
   */
  timeout(ms: number): this {
    this.config.timeout = ms
    return this
  }

  /**
   * Execute the request
   */
  async send<T>(): Promise<T> {
    const response = await this.client.request<T>(this.config)
    return response.data
  }

  /**
   * Execute and return full response
   */
  async sendRaw<T>(): Promise<AxiosResponse<T>> {
    return this.client.request<T>(this.config)
  }
}

// Export default instance factory
export function createHttpClient(config?: Partial<HttpClientConfig>): HttpClient {
  return new HttpClient(config)
}

