import { APIError } from '../types';

export class TapsilatError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

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

  static fromAPIError(apiError: APIError): TapsilatError {
    return new TapsilatError(apiError.message, apiError.code, apiError.details);
  }
}

export class TapsilatNetworkError extends TapsilatError {
  public readonly statusCode?: number;

  constructor(message: string, code: string, statusCode?: number, details?: Record<string, any>) {
    super(message, code, details);
    this.name = 'TapsilatNetworkError';
    this.statusCode = statusCode;
  }
}

export class TapsilatValidationError extends TapsilatError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'TapsilatValidationError';
  }
}

export class TapsilatAuthenticationError extends TapsilatError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'TapsilatAuthenticationError';
  }
}

export class TapsilatRateLimitError extends TapsilatError {
  public readonly retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'TapsilatRateLimitError';
    this.retryAfter = retryAfter;
  }
} 