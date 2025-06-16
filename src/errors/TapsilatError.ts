/**
 * @category Errors
 * @module TapsilatError
 */
import { APIError } from '../types';

/**
 * @category Errors
 * @summary Base error class for Tapsilat SDK
 * @description Foundation error class for all Tapsilat-specific errors with error code and details support
 * @class TapsilatError
 * @extends Error
 */
export class TapsilatError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  /**
   * @summary Creates a new TapsilatError instance
   * @description Initializes base error with message, code and optional details
   * 
   * @param message - Human-readable error message
   * @param code - Error code for programmatic identification
   * @param details - Optional additional error context
   */
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = 'TapsilatError';
    this.code = code;
    this.details = details;
    
    // Maintain proper stack trace for where our error was thrown
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, TapsilatError);
    }
  }

  /**
   * @summary Creates a TapsilatError from an API error response
   * @description Factory method to convert API error format to a TapsilatError instance
   * 
   * @param apiError - API error object from response
   * @returns New TapsilatError instance with properties from API error
   */
  static fromAPIError(apiError: APIError): TapsilatError {
    return new TapsilatError(apiError.message, apiError.code, apiError.details);
  }
}

/**
 * @category Errors
 * @summary Network-related error class for HTTP issues
 * @description Error class for network and HTTP-specific problems including status codes
 * @class TapsilatNetworkError
 * @extends TapsilatError
 */
export class TapsilatNetworkError extends TapsilatError {
  public readonly statusCode?: number;

  /**
   * @summary Creates a new network error instance
   * @description Initializes network error with message, code, status code and optional details
   * 
   * @param message - Human-readable error message
   * @param code - Error code for programmatic identification
   * @param statusCode - HTTP status code if applicable
   * @param details - Optional additional error context
   */
  constructor(message: string, code: string, statusCode?: number, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'TapsilatNetworkError';
    this.statusCode = statusCode;
  }
}

/**
 * @category Errors
 * @summary Error class for validation failures
 * @description Error class for data validation issues with field-specific error details
 * @class TapsilatValidationError
 * @extends TapsilatError
 */
export class TapsilatValidationError extends TapsilatError {
  /**
   * @summary Creates a new validation error instance
   * @description Initializes validation error with message and optional field-specific details
   * 
   * @param message - Human-readable error message
   * @param details - Optional field-specific validation errors
   */
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'TapsilatValidationError';
  }
}

/**
 * @category Errors
 * @summary Error class for authentication issues
 * @description Error class for problems related to API keys, authentication tokens, or permissions
 * @class TapsilatAuthenticationError
 * @extends TapsilatError
 */
export class TapsilatAuthenticationError extends TapsilatError {
  /**
   * @summary Creates a new authentication error instance
   * @description Initializes authentication error with an optional custom message
   * 
   * @param message - Human-readable error message (defaults to 'Authentication failed')
   */
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'TapsilatAuthenticationError';
  }
}

/**
 * @category Errors
 * @summary Error class for rate limit exceeded issues
 * @description Error class for API rate limiting with information about when to retry
 * @class TapsilatRateLimitError
 * @extends TapsilatError
 */
export class TapsilatRateLimitError extends TapsilatError {
  public readonly retryAfter?: number;

  /**
   * @summary Creates a new rate limit error instance
   * @description Initializes rate limit error with message and optional retry-after seconds
   * 
   * @param message - Human-readable error message (defaults to 'Rate limit exceeded')
   * @param retryAfter - Optional seconds to wait before retrying
   */
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'TapsilatRateLimitError';
    this.retryAfter = retryAfter;
  }
} 