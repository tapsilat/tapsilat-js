import { HttpClient, RequestConfig } from "../http/HttpClient";
import { TapsilatValidationError } from "../errors/TapsilatError";
import { APIResponse } from "../types/index";
import { isNonEmptyString } from "../utils/validators";
import {
  handleError,
  handleOptionalResponse,
  handleResponse,
} from "../utils/response";

/**
 * Shared request handling for the SDK's grouped services
 *
 * @summary Base class for API service groups
 * @description Unwraps responses, converts failures to TapsilatError and builds version 2 request configs.
 */
export abstract class ServiceBase {
  constructor(protected readonly httpClient: HttpClient) {}

  /** Runs a request and returns its data, throwing on failure or an empty body */
  protected async request<T>(
    context: string,
    call: () => Promise<APIResponse<T>>
  ): Promise<T> {
    try {
      return handleResponse(await call(), context);
    } catch (error) {
      return handleError(error, context.toLowerCase());
    }
  }

  /** Runs a request whose successful response may have an empty body */
  protected async requestOptional<T>(
    context: string,
    call: () => Promise<APIResponse<T>>
  ): Promise<T | undefined> {
    try {
      return handleOptionalResponse(await call(), context);
    } catch (error) {
      return handleError(error, context.toLowerCase());
    }
  }

  /** Request config for version 2 routes, derived from the configured base URL */
  protected v2(config: RequestConfig = {}): RequestConfig {
    return { ...config, baseURL: this.httpClient.versionedBaseURL("v2") };
  }

  /** Throws when a required identifier is missing and returns it URL-encoded */
  protected id(value: string, name: string): string {
    if (!isNonEmptyString(value)) {
      throw new TapsilatValidationError(
        `${name} is required and must be a non-empty string`,
        { provided: value }
      );
    }
    return encodeURIComponent(value);
  }
}
