import { TapsilatConfig, APIResponse } from "../types";
import {
  TapsilatError,
  TapsilatNetworkError,
  TapsilatAuthenticationError,
  TapsilatValidationError,
  TapsilatRateLimitError,
} from "../errors/TapsilatError";
import { InterceptorManager } from "./interceptors";

/**
 * Configuration options for individual HTTP requests
 */
export interface RequestConfig extends Omit<RequestInit, "method" | "body"> {
  timeout?: number;
  retries?: number;
  baseURL?: string;
  maxRetries?: number;
}

/**
 * HTTP methods supported by the client
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Generic constraint for request body types
 */
export type RequestBody =
  | Record<string, unknown>
  | Record<string, any>
  | object
  | unknown[]
  | string
  | FormData;

/**
 * HTTP Client for making API requests with comprehensive error handling,
 * retry logic, and request/response interceptors
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
 */
export class HttpClient {
  private readonly config: TapsilatConfig;
  private readonly interceptors = new InterceptorManager();

  constructor(config: TapsilatConfig) {
    this.config = config;
  }

  /**
   * GET request method overloads
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
   * POST request method overloads
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
   * PUT request method overloads
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
   * PATCH request method overloads
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
   * DELETE request method overloads
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
   * Core request method with comprehensive error handling and retry logic
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
    const fullUrl = this.buildUrl(url, config?.baseURL);
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
    try {
      return await this.interceptors.executeErrorInterceptors(lastError!, {
        url: interceptedUrl,
        options: interceptedOptions,
      });
    } catch (finalError) {
      throw finalError;
    }
  }

  /**
   * Makes the actual HTTP request with timeout handling
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
   * Processes the fetch response and converts to APIResponse format
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
    } catch (parseError) {
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
   * Creates appropriate error based on response status and data
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
      case 429:
        const rateLimitInfo = this.extractRateLimitInfo(response);
        return new TapsilatRateLimitError(
          errorMessage || "Rate limit exceeded",
          rateLimitInfo.resetTime
            ? Math.floor(
                (rateLimitInfo.resetTime.getTime() - Date.now()) / 1000
              )
            : undefined
        );
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
   * Extracts error message from response data
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
   * Extracts validation details from error response
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
   * Extracts rate limit information from response headers
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
   * Builds the complete URL for the request
   */
  private buildUrl(url: string, customBaseURL?: string): string {
    const baseURL =
      customBaseURL || this.config.baseURL || "https://api.tapsilat.com/v1";

    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    const base = baseURL.replace(/\/+$/, "");
    const path = url.replace(/^\/+/, "");

    return `${base}/${path}`;
  }

  /**
   * Builds RequestInit options for the fetch request
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
   * Determines if an error should prevent retrying
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
   * Calculates retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  /**
   * Utility method to create delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Interceptor management methods

  /**
   * Gets the interceptor manager for advanced request/response handling
   *
   * @returns InterceptorManager instance
   */
  getInterceptors(): InterceptorManager {
    return this.interceptors;
  }

  /**
   * Adds a request interceptor
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
   * Adds a response interceptor
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
   * Adds an error interceptor
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
