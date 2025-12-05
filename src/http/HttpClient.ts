/**
 * @category HTTP
 * @module HttpClient
 */
import { TapsilatConfig, APIResponse } from "../types/index";
import {
  TapsilatError,
  TapsilatNetworkError,
  TapsilatAuthenticationError,
  TapsilatValidationError,
  TapsilatRateLimitError,
} from "../errors/TapsilatError";
import { InterceptorManager } from "./interceptors";

/**
 * @category HTTP
 * @summary Configuration options for individual HTTP requests
 * @description Extends RequestInit with additional Tapsilat-specific options for HTTP requests
 * @interface RequestConfig
 */
export interface RequestConfig extends Omit<RequestInit, "method" | "body"> {
  timeout?: number;
  retries?: number;
  baseURL?: string;
  maxRetries?: number;
  params?: Record<string, unknown>;
}

/**
 * @category HTTP
 * @summary HTTP methods supported by the client
 * @description The standard HTTP methods available for API requests
 * @typedef {string} HttpMethod
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * @category HTTP
 * @summary Generic constraint for request body types
 * @description Types that can be sent as HTTP request bodies
 * @typedef {object|array|string|FormData} RequestBody
 */
export type RequestBody =
  | Record<string, unknown>
  | Record<string, unknown>
  | object
  | unknown[]
  | string
  | FormData;

/**
 * @category HTTP
 * @summary HTTP Client for making API requests to Tapsilat services
 * @description Provides a robust client with comprehensive error handling,
 * retry logic, and request/response interceptors for interacting with the Tapsilat API
 *
 * @example
 * ```typescript
 * const client = new HttpClient({
 *   apiKey: 'your-api-key',
 *   baseURL: 'https://api.example.com/v1'
 * });
 *
 * const data = await client.get<UserResponse>('/users/123');
 * ```
 * @class HttpClient
 */
export class HttpClient {
  private readonly config: TapsilatConfig;
  private readonly interceptors = new InterceptorManager();

  /**
   * @summary Creates a new HTTP client instance
   * @description Initializes the HTTP client with the provided configuration
   *
   * @param config - The configuration for the Tapsilat API client
   */
  constructor(config: TapsilatConfig) {
    this.config = config;
  }

  /**
   * @summary Performs GET requests to the API
   * @description Makes HTTP GET requests to retrieve data from the API
   */
  async get<T = unknown>(url: string): Promise<APIResponse<T>>;
  async get<T = unknown>(
    url: string,
    config: RequestConfig
  ): Promise<APIResponse<T>>;
  async get<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>("GET", url, undefined, config);
  }

  /**
   * @summary Performs POST requests to the API
   * @description Makes HTTP POST requests to send data to the API
   */
  async post<T = unknown>(url: string): Promise<APIResponse<T>>;
  async post<T = unknown>(
    url: string,
    body: RequestBody
  ): Promise<APIResponse<T>>;
  async post<T = unknown>(
    url: string,
    body: RequestBody,
    config: RequestConfig
  ): Promise<APIResponse<T>>;
  async post<T = unknown>(
    url: string,
    body?: RequestBody,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>("POST", url, body, config);
  }

  /**
   * @summary Performs PUT requests to the API
   * @description Makes HTTP PUT requests to update entire resources in the API
   */
  async put<T = unknown>(url: string): Promise<APIResponse<T>>;
  async put<T = unknown>(
    url: string,
    body: RequestBody
  ): Promise<APIResponse<T>>;
  async put<T = unknown>(
    url: string,
    body: RequestBody,
    config: RequestConfig
  ): Promise<APIResponse<T>>;
  async put<T = unknown>(
    url: string,
    body?: RequestBody,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>("PUT", url, body, config);
  }

  /**
   * @summary Performs PATCH requests to the API
   * @description Makes HTTP PATCH requests to update parts of resources in the API
   */
  async patch<T = unknown>(url: string): Promise<APIResponse<T>>;
  async patch<T = unknown>(
    url: string,
    body: RequestBody
  ): Promise<APIResponse<T>>;
  async patch<T = unknown>(
    url: string,
    body: RequestBody,
    config: RequestConfig
  ): Promise<APIResponse<T>>;
  async patch<T = unknown>(
    url: string,
    body?: RequestBody,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>("PATCH", url, body, config);
  }

  /**
   * @summary Performs DELETE requests to the API
   * @description Makes HTTP DELETE requests to remove resources from the API
   */
  async delete<T = unknown>(url: string): Promise<APIResponse<T>>;
  async delete<T = unknown>(
    url: string,
    config: RequestConfig
  ): Promise<APIResponse<T>>;
  async delete<T = unknown>(
    url: string,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    return this.request<T>("DELETE", url, undefined, config);
  }

  /**
   * @category HTTP Client
   * @summary Core request method with comprehensive error handling and retry logic
   * @description Handles all HTTP requests with error handling, retries, and interceptors
   *
   * @param method - HTTP method to use
   * @param url - Request URL (relative to baseURL)
   * @param body - Request body data
   * @param config - Additional request configuration
   * @returns Promise resolving to API response
   */
  private async request<T>(
    method: HttpMethod,
    url: string,
    body?: RequestBody,
    config?: RequestConfig
  ): Promise<APIResponse<T>> {
    const fullUrl = this.buildUrl(url, config?.baseURL, config?.params);
    const requestOptions = await this.buildRequestOptions(method, body, config);
    const maxRetries = config?.retries ?? this.config.maxRetries ?? 3;

    // Execute request interceptors
    const { url: interceptedUrl, options: interceptedOptions } =
      await this.interceptors.executeRequestInterceptors(
        fullUrl,
        requestOptions
      );

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.makeRequest<T>(
          interceptedUrl,
          interceptedOptions,
          config?.timeout
        );

        // Execute response interceptors
        const interceptedResponse =
          await this.interceptors.executeResponseInterceptors(response, {
            url: interceptedUrl,
            options: interceptedOptions,
          });

        return interceptedResponse;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (this.shouldNotRetry(lastError)) {
          break;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        await this.delay(this.calculateRetryDelay(attempt));
      }
    }

    // Execute error interceptors as last resort
    return this.interceptors.executeErrorInterceptors(lastError!, {
      url: interceptedUrl,
      options: interceptedOptions,
    }) as Promise<APIResponse<T>>;
  }

  /**
   * @category HTTP Client Internals
   * @summary Makes the actual HTTP request with timeout handling
   * @description Performs the fetch request with timeout handling and abort controller
   *
   * @param url - Full URL to request
   * @param options - Fetch request options
   * @param timeout - Optional timeout in milliseconds
   * @returns Promise resolving to API response
   */
  private async makeRequest<T>(
    url: string,
    options: RequestInit,
    timeout?: number
  ): Promise<APIResponse<T>> {
    const controller = new AbortController();
    const timeoutId = timeout
      ? setTimeout(() => controller.abort(), timeout)
      : null;

    try {
      const requestOptions: RequestInit = {
        ...options,
        signal: controller.signal,
      };

      const response = await fetch(url, requestOptions);

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      return await this.processResponse<T>(response);
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new TapsilatNetworkError("Request timeout", "TIMEOUT");
        }
        throw new TapsilatNetworkError(
          `Network request failed: ${error.message}`,
          "NETWORK_ERROR"
        );
      }

      throw new TapsilatNetworkError("Unknown network error", "UNKNOWN");
    }
  }

  /**
   * @category HTTP Client Internals
   * @summary Processes the fetch response and converts to APIResponse format
   * @description Parses the response and formats it according to the APIResponse interface
   *
   * @param response - The raw fetch Response object
   * @returns Processed API response
   */
  private async processResponse<T>(
    response: Response
  ): Promise<APIResponse<T>> {
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let responseData: unknown;

    try {
      if (isJson) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch {
      throw new TapsilatError("Failed to parse response body", "PARSE_ERROR");
    }

    // Handle successful responses
    if (response.ok) {
      return {
        success: true,
        data: responseData as T,
      };
    }

    // Handle error responses
    const error = this.createErrorFromResponse(response, responseData);

    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }

  /**
   * @category HTTP Client Internals
   * @summary Creates appropriate error based on response status and data
   * @description Maps HTTP status codes to specific Tapsilat error types
   *
   * @param response - The raw fetch Response object
   * @param data - The parsed response data
   * @returns Appropriate TapsilatError subclass instance
   */
  private createErrorFromResponse(
    response: Response,
    data: unknown
  ): TapsilatError {
    const status = response.status;
    const errorMessage = this.extractErrorMessage(data);

    switch (status) {
      case 401:
        return new TapsilatAuthenticationError(
          errorMessage || "Authentication failed - invalid API key"
        );
      case 403:
        return new TapsilatAuthenticationError(
          errorMessage || "Access forbidden - insufficient permissions"
        );
      case 400:
        return new TapsilatValidationError(
          errorMessage || "Invalid request data"
        );
      case 422:
        return new TapsilatValidationError(
          errorMessage || "Validation failed",
          this.extractValidationDetails(data)
        );
      case 429: {
        const rateLimitInfo = this.extractRateLimitInfo(response);
        return new TapsilatRateLimitError(
          errorMessage || "Rate limit exceeded",
          rateLimitInfo.resetTime
            ? Math.floor(
                (rateLimitInfo.resetTime.getTime() - Date.now()) / 1000
              )
            : undefined
        );
      }
      case 404:
        return new TapsilatError(
          errorMessage || "Resource not found",
          "NOT_FOUND"
        );
      case 500:
        return new TapsilatError(
          errorMessage || "Internal server error",
          "INTERNAL_ERROR"
        );
      case 502:
      case 503:
      case 504:
        return new TapsilatNetworkError(
          errorMessage || "Service temporarily unavailable",
          "SERVICE_UNAVAILABLE",
          status
        );
      default:
        return new TapsilatError(
          errorMessage || `HTTP ${status} error`,
          "HTTP_ERROR"
        );
    }
  }

  /**
   * @category HTTP Client Internals
   * @summary Extracts error message from response data
   * @description Attempts to find an error message in various locations within the response
   *
   * @param data - The parsed response data
   * @returns Error message if found
   */
  private extractErrorMessage(data: unknown): string | undefined {
    if (typeof data === "string") {
      return data;
    }

    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      return (obj.message || obj.error || obj.detail) as string;
    }

    return undefined;
  }

  /**
   * @category HTTP Client Internals
   * @summary Extracts validation details from error response
   * @description Parses field-specific validation errors from the API response
   *
   * @param data - The parsed response data
   * @returns Object mapping field names to error messages
   */
  private extractValidationDetails(
    data: unknown
  ): Record<string, string[]> | undefined {
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      return obj.errors as Record<string, string[]>;
    }
    return undefined;
  }

  /**
   * @category HTTP Client Internals
   * @summary Extracts rate limit information from response headers
   * @description Reads and parses rate limiting headers from the API response
   *
   * @param response - The raw fetch Response object
   * @returns Rate limit information including limits and reset time
   */
  private extractRateLimitInfo(response: Response): {
    limit?: number;
    remaining?: number;
    resetTime?: Date;
  } {
    const limit = response.headers.get("x-ratelimit-limit");
    const remaining = response.headers.get("x-ratelimit-remaining");
    const reset = response.headers.get("x-ratelimit-reset");

    return {
      limit: limit ? parseInt(limit, 10) : undefined,
      remaining: remaining ? parseInt(remaining, 10) : undefined,
      resetTime: reset ? new Date(parseInt(reset, 10) * 1000) : undefined,
    };
  }

  /**
   * @category HTTP Client Internals
   * @summary Builds the complete URL for the request
   * @description Constructs the full URL with base URL and query parameters
   *
   * @param url - The endpoint path or full URL
   * @param customBaseURL - Optional override for the base URL
   * @param params - Optional query parameters
   * @returns Complete request URL
   */
  private buildUrl(
    url: string,
    customBaseURL?: string,
    params?: Record<string, unknown>
  ): string {
    const baseURL =
      customBaseURL ||
      this.config.baseURL ||
      "https://acquiring.tapsilat.dev/api/v1";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const base = baseURL.replace(/\/+$/, "");
    const path = url.replace(/^\/+/, "");

    let fullUrl = `${base}/${path}`;

    // Add query parameters if provided
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += `?${queryString}`;
      }
    }

    return fullUrl;
  }

  /**
   * @category HTTP Client Internals
   * @summary Builds RequestInit options for the fetch request
   * @description Prepares headers and request configuration for fetch API
   *
   * @param method - The HTTP method to use
   * @param body - Optional request body
   * @param config - Additional request configuration
   * @returns Configured RequestInit object for fetch
   */
  private async buildRequestOptions(
    method: HttpMethod,
    body?: RequestBody,
    config?: RequestConfig
  ): Promise<RequestInit> {
    const headers = new Headers({
      "User-Agent": `TapsilatSDK/1.0.0`,
      Authorization: `Bearer ${this.config.bearerToken}`,
      Accept: "application/json",
      ...(config?.headers as Record<string, string>),
    });

    // Set content type for requests with body
    if (body && method !== "GET" && method !== "DELETE") {
      if (!(body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }
    }

    const options: RequestInit = {
      method,
      headers,
      ...config,
    };

    // Add body for non-GET/DELETE requests
    if (body && method !== "GET" && method !== "DELETE") {
      if (body instanceof FormData) {
        options.body = body;
      } else if (typeof body === "string") {
        options.body = body;
      } else {
        options.body = JSON.stringify(body);
      }
    }

    return options;
  }

  /**
   * @category HTTP Client Internals
   * @summary Determines if an error should prevent retrying
   * @description Checks error types to decide if retry attempts should be aborted
   *
   * @param error - The error that occurred
   * @returns Whether retry should be prevented for this error
   */
  private shouldNotRetry(error: Error): boolean {
    // Don't retry authentication, validation, or client errors
    return (
      error instanceof TapsilatAuthenticationError ||
      error instanceof TapsilatValidationError ||
      (error instanceof TapsilatError && error.code === "NOT_FOUND")
    );
  }

  /**
   * @category HTTP Client Internals
   * @summary Calculates retry delay with exponential backoff
   * @description Implements exponential backoff with jitter for retry attempts
   *
   * @param attempt - The current retry attempt number (0-indexed)
   * @returns Delay in milliseconds before next retry
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * @category HTTP Client Internals
   * @summary Utility method to create delay
   * @description Creates a promise that resolves after the specified time
   *
   * @param ms - Delay time in milliseconds
   * @returns Promise that resolves after the delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Interceptor management methods

  /**
   * @category Interceptors
   * @summary Gets the interceptor manager for advanced request/response handling
   * @description Provides access to the internal interceptor manager for custom handling
   *
   * @returns InterceptorManager instance
   */
  getInterceptors(): InterceptorManager {
    return this.interceptors;
  }

  /**
   * @category Interceptors
   * @summary Adds a request interceptor
   * @description Registers a function to intercept and modify requests before they are sent
   *
   * @param interceptor - Request interceptor function
   * @returns Interceptor ID for removal
   */
  addRequestInterceptor(
    interceptor: Parameters<InterceptorManager["addRequestInterceptor"]>[0]
  ): number {
    return this.interceptors.addRequestInterceptor(interceptor);
  }

  /**
   * @category Interceptors
   * @summary Adds a response interceptor
   * @description Registers a function to intercept and modify responses before they are returned
   *
   * @param interceptor - Response interceptor function
   * @returns Interceptor ID for removal
   */
  addResponseInterceptor(
    interceptor: Parameters<InterceptorManager["addResponseInterceptor"]>[0]
  ): number {
    return this.interceptors.addResponseInterceptor(interceptor);
  }

  /**
   * @category Interceptors
   * @summary Adds an error interceptor
   * @description Registers a function to intercept and potentially recover from errors
   *
   * @param interceptor - Error interceptor function
   * @returns Interceptor ID for removal
   */
  addErrorInterceptor(
    interceptor: Parameters<InterceptorManager["addErrorInterceptor"]>[0]
  ): number {
    return this.interceptors.addErrorInterceptor(interceptor);
  }
}
