import { APIResponse } from "../types";

export type RequestInterceptor = (
  url: string,
  options: RequestInit
) =>
  | Promise<{ url: string; options: RequestInit }>
  | { url: string; options: RequestInit };

export type ResponseInterceptor = (
  response: APIResponse<any>,
  request: { url: string; options: RequestInit }
) => Promise<APIResponse<any>> | APIResponse<any>;

export type ErrorInterceptor = (
  error: Error,
  request: { url: string; options: RequestInit }
) => Promise<never | APIResponse<any>> | never | APIResponse<any>;

export class InterceptorManager {
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  // Request interceptors
  addRequestInterceptor(interceptor: RequestInterceptor): number {
    this.requestInterceptors.push(interceptor);
    return this.requestInterceptors.length - 1;
  }

  removeRequestInterceptor(id: number): void {
    if (this.requestInterceptors[id]) {
      delete this.requestInterceptors[id];
    }
  }

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

  // Response interceptors
  addResponseInterceptor(interceptor: ResponseInterceptor): number {
    this.responseInterceptors.push(interceptor);
    return this.responseInterceptors.length - 1;
  }

  removeResponseInterceptor(id: number): void {
    if (this.responseInterceptors[id]) {
      delete this.responseInterceptors[id];
    }
  }

  async executeResponseInterceptors<T>(
    response: APIResponse<T>,
    request: { url: string; options: RequestInit }
  ): Promise<APIResponse<T>> {
    let currentResponse = response;

    for (const interceptor of this.responseInterceptors) {
      if (interceptor) {
        currentResponse = await interceptor(currentResponse, request);
      }
    }

    return currentResponse;
  }

  // Error interceptors
  addErrorInterceptor(interceptor: ErrorInterceptor): number {
    this.errorInterceptors.push(interceptor);
    return this.errorInterceptors.length - 1;
  }

  removeErrorInterceptor(id: number): void {
    if (this.errorInterceptors[id]) {
      delete this.errorInterceptors[id];
    }
  }

  async executeErrorInterceptors(
    error: Error,
    request: { url: string; options: RequestInit }
  ): Promise<never | APIResponse<any>> {
    for (const interceptor of this.errorInterceptors) {
      if (interceptor) {
        try {
          return await interceptor(error, request);
        } catch (interceptorError) {
          // Continue to next interceptor if this one fails
          continue;
        }
      }
    }

    // If no interceptor handled the error, re-throw
    throw error;
  }

  // Clear all interceptors
  clear(): void {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
  }
}

// Built-in interceptors
export const createLoggingInterceptor = (
  debug: boolean = false
): {
  request: RequestInterceptor;
  response: ResponseInterceptor;
  error: ErrorInterceptor;
} => ({
  request: (url, options) => {
    if (debug) {
      console.log(`🔄 API Request: ${options.method} ${url}`);
      console.log("Headers:", options.headers);
      if (options.body) {
        console.log("Body:", options.body);
      }
    }
    return { url, options };
  },

  response: (response, request) => {
    if (debug) {
      console.log(`✅ API Response: ${request.options.method} ${request.url}`);
      console.log("Success:", response.success);
      if (response.error) {
        console.log("Error:", response.error);
      }
    }
    return response;
  },

  error: (error, request) => {
    if (debug) {
      console.error(`❌ API Error: ${request.options.method} ${request.url}`);
      console.error("Error:", error.message);
    }
    throw error;
  },
});

export const createTimingInterceptor = (): {
  request: RequestInterceptor;
  response: ResponseInterceptor;
} => {
  const timings = new Map<string, number>();

  return {
    request: (url, options) => {
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

    response: (response, request) => {
      const requestId = (request.options.headers as any)?.["X-Request-ID"];
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
