/**
 * @category HTTP
 * @module Interceptors
 */
import { APIResponse } from "../types/index";

/**
 * @category Interceptors
 * @summary Function type for modifying HTTP requests before they are sent
 * @description Allows preprocessing of URL and request options before the API call is made
 * @typedef {Function} RequestInterceptor
 */
export type RequestInterceptor = (
  url: string,
  options: RequestInit
) =>
  | Promise<{ url: string; options: RequestInit }>
  | { url: string; options: RequestInit };

/**
 * @category Interceptors
 * @summary Function type for processing HTTP responses before returning to caller
 * @description Allows transformation and analysis of API responses after receiving them but before they reach the calling code
 * @typedef {Function} ResponseInterceptor
 */
export type ResponseInterceptor = (
  response: APIResponse<unknown>,
  request: { url: string; options: RequestInit }
) => Promise<APIResponse<unknown>> | APIResponse<unknown>;

/**
 * @category Interceptors
 * @summary Function type for handling errors that occur during HTTP requests
 * @description Provides opportunity to recover from errors, transform them, or perform logging operations before they propagate
 * @typedef {Function} ErrorInterceptor
 */
export type ErrorInterceptor = (
  error: Error,
  request: { url: string; options: RequestInit }
) => Promise<never | APIResponse<unknown>> | never | APIResponse<unknown>;

/**
 * @category HTTP
 * @summary Central registry and execution engine for all HTTP interceptors
 * @description Maintains lists of request, response and error interceptors and provides methods to execute them in sequence
 * @class InterceptorManager
 */
export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  /**
   * Adds a request interceptor to the chain
   *
   * @summary Register a new request interceptor function
   * @description Adds a new interceptor to process requests before they are sent
   *
   * @param interceptor - The request interceptor function to add
   * @returns The index of the added interceptor (can be used to remove it later)
   */
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    this.requestInterceptors.push(interceptor);
    return this.requestInterceptors.length - 1;
  }

  /**
   * Removes a previously added request interceptor
   *
   * @summary Unregister a request interceptor by its ID
   * @description Removes the request interceptor at the specified position
   *
   * @param id - The index of the interceptor to remove
   */
  removeRequestInterceptor(id: number): void {
    if (this.requestInterceptors[id]) {
      delete this.requestInterceptors[id];
    }
  }

  /**
   * Runs all registered request interceptors in sequence
   *
   * @summary Process a request through all interceptors
   * @description Executes each registered request interceptor in order, passing modified url and options to each
   *
   * @param url - The initial request URL
   * @param options - The initial request options
   * @returns Modified URL and options after all interceptors have processed them
   */
  async executeRequestInterceptors(
    url: string,
    options: RequestInit
  ): Promise<{ url: string; options: RequestInit }> {
    let currentUrl = url;
    let currentOptions = options;

    for (const interceptor of this.requestInterceptors) {
      if (interceptor) {
        const result = await interceptor(currentUrl, currentOptions);
        currentUrl = result.url;
        currentOptions = result.options;
      }
    }

    return { url: currentUrl, options: currentOptions };
  }

  /**
   * @summary Register a new response interceptor function
   * @description Adds a new interceptor to process responses before they are returned to the caller
   *
   * @param interceptor - The response interceptor function to add
   * @returns The index of the added interceptor (can be used to remove it later)
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): number {
    this.responseInterceptors.push(interceptor);
    return this.responseInterceptors.length - 1;
  }

  /**
   * @summary Unregister a response interceptor by its ID
   * @description Removes the response interceptor at the specified position
   *
   * @param id - The index of the interceptor to remove
   */
  removeResponseInterceptor(id: number): void {
    if (this.responseInterceptors[id]) {
      delete this.responseInterceptors[id];
    }
  }

  /**
   * @summary Process a response through all interceptors
   * @description Executes each registered response interceptor in order
   *
   * @param response - The API response to process
   * @param request - The original request information
   * @returns Modified response after all interceptors have processed it
   */
  async executeResponseInterceptors<T>(
    response: APIResponse<T>,
    request: { url: string; options: RequestInit }
  ): Promise<APIResponse<T>> {
    let currentResponse = response;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor) {
        currentResponse = (await interceptor(
          currentResponse as APIResponse<unknown>,
          request
        )) as APIResponse<T>;
      }
    }

    return currentResponse;
  }

  /**
   * @summary Register a new error interceptor function
   * @description Adds a new interceptor to process errors before they are thrown
   *
   * @param interceptor - The error interceptor function to add
   * @returns The index of the added interceptor (can be used to remove it later)
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): number {
    this.errorInterceptors.push(interceptor);
    return this.errorInterceptors.length - 1;
  }

  /**
   * @summary Unregister an error interceptor by its ID
   * @description Removes the error interceptor at the specified position
   *
   * @param id - The index of the interceptor to remove
   */
  removeErrorInterceptor(id: number): void {
    if (this.errorInterceptors[id]) {
      delete this.errorInterceptors[id];
    }
  }

  /**
   * @summary Process an error through all interceptors
   * @description Executes each registered error interceptor in order until one handles the error
   *
   * @param error - The error that occurred during the request
   * @param request - The original request information
   * @returns Either a recovery response or throws the error if no interceptors handle it
   */
  async executeErrorInterceptors(
    error: Error,
    request: { url: string; options: RequestInit }
  ): Promise<never | APIResponse<unknown>> {
    for (const interceptor of this.errorInterceptors) {
      if (interceptor) {
        try {
          return await interceptor(error, request);
        } catch {
          // Continue to next interceptor if this one fails
          continue;
        }
      }
    }

    // If no interceptor handled the error, re-throw
    throw error;
  }

  /**
   * @summary Remove all registered interceptors
   * @description Clears all request, response, and error interceptors at once
   */
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
  }
}

/**
 * @category Built-in Interceptors
 * @summary Creates a set of interceptors for logging API requests, responses, and errors
 * @description Provides detailed logging of HTTP activity when debug mode is enabled
 *
 * @param debug - When true, enables console logging of API activities
 * @returns Object containing request, response, and error interceptors for logging
 */
export const createLoggingInterceptor = (
  debug: boolean = false
): {
  request: RequestInterceptor;
  response: ResponseInterceptor;
  error: ErrorInterceptor;
} => ({
  request: (url, options): { url: string; options: RequestInit } => {
    if (debug) {
      console.log(`🔄 API Request: ${options.method} ${url}`);
      console.log("Headers:", options.headers);
      if (options.body) {
        console.log("Body:", options.body);
      }
    }
    return { url, options };
  },

  response: (response, request): APIResponse<unknown> => {
    if (debug) {
      console.log(`✅ API Response: ${request.options.method} ${request.url}`);
      console.log("Success:", response.success);
      if (response.error) {
        console.log("Error:", response.error);
      }
    }
    return response;
  },

  error: (error, request): never => {
    if (debug) {
      console.error(`❌ API Error: ${request.options.method} ${request.url}`);
      console.error("Error:", error.message);
    }
    throw error;
  },
});

/**
 * @category Built-in Interceptors
 * @summary Creates interceptors for measuring API request/response times
 * @description Tracks the duration of API calls and logs performance metrics
 *
 * @returns Object containing request and response interceptors for timing measurement
 */
export const createTimingInterceptor = (): {
  request: RequestInterceptor;
  response: ResponseInterceptor;
} => {
  const timings = new Map<string, number>();

  return {
    request: (url, options): { url: string; options: RequestInit } => {
      const requestId = `${options.method}-${url}-${Date.now()}`;
      timings.set(requestId, Date.now());

      return {
        url,
        options: {
          ...options,
          headers: {
            ...options.headers,
            "X-Request-ID": requestId,
          },
        },
      };
    },

    response: (response, request): APIResponse<unknown> => {
      const headers = request.options.headers as Record<string, unknown>;
      const requestId = headers?.["X-Request-ID"] as string;
      if (requestId && timings.has(requestId)) {
        const startTime = timings.get(requestId)!;
        const duration = Date.now() - startTime;
        console.log(
          `⏱️ API call took ${duration}ms: ${request.options.method} ${request.url}`
        );
        timings.delete(requestId);
      }
      return response;
    },
  };
};
