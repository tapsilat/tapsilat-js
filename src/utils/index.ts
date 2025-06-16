import { APIResponse } from "../types";
import { TapsilatError, TapsilatNetworkError } from "../errors/TapsilatError";
import crypto from 'crypto';

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generic response handler - consistent way to handle API responses
 * 
 * @param response - The API response to process
 * @param errorContext - Descriptive context for error messages
 * @returns The data from a successful response
 * @throws {TapsilatError} On any response error
 */
export const handleResponse = <T>(response: APIResponse<T>, errorContext: string): T => {
  if (!response.success || !response.data) {
    // Convert API errors to domain-specific errors
    if (response.error) {
      throw TapsilatError.fromAPIError(response.error);
    }

    throw new TapsilatError(
      `${errorContext} failed with no error details`,
      "UNKNOWN_ERROR"
    );
  }

  return response.data;
};

/**
 * Generic error handler - consistent way to handle errors
 * 
 * @param error - The caught error to process
 * @param errorContext - Descriptive context for error messages
 * @throws {TapsilatError} Always throws an appropriate error type
 */
export const handleError = (error: unknown, errorContext: string): never => {
  // Rethrow TapsilatErrors as-is
  if (error instanceof TapsilatError) {
    throw error;
  }

  // Convert generic errors to TapsilatNetworkError
  throw new TapsilatNetworkError(
    error instanceof Error
      ? error.message
      : `Unknown error during ${errorContext}`,
    "NETWORK_ERROR"
  );
};

/**
 * Verifies HMAC-SHA256 signature for webhook security
 * 
 * @param payload - Raw webhook payload string
 * @param signature - Webhook signature from headers (should include "sha256=" prefix)
 * @param secret - Your webhook secret key
 * @returns true if signature is valid, false otherwise
 */
export const verifyHmacSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return `sha256=${expectedSignature}` === signature;
};
