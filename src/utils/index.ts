import { APIResponse } from "../types";
import { TapsilatError, TapsilatNetworkError } from "../errors/TapsilatError";
import crypto from "crypto";

// EMAIL VALIDATION
// Summary: Validates email format using basic regex pattern
// Description: Ensures email addresses conform to standard format with username, @ symbol, and domain
/**
 * Validates email format using basic regex pattern
 *
 * @summary Validates email format using basic regex pattern
 * @description Ensures email addresses conform to standard format with username, @ symbol, and domain
 *
 * @param email - Email address to validate
 * @returns True if email matches required format, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// API RESPONSE HANDLING
// Summary: Process API responses consistently across the SDK
// Description: Validates response structure, extracts data or converts API errors to domain errors
/**
 * Generic response handler - consistent way to handle API responses
 *
 * @summary Process API responses consistently across the SDK
 * @description Validates response structure, extracts data or converts API errors to domain errors
 *
 * @param response - The API response to process
 * @param errorContext - Descriptive context for error messages
 * @returns The data from a successful response
 * @throws {TapsilatError} On any response error
 */
export const handleResponse = <T>(
  response: APIResponse<T>,
  errorContext: string
): T => {
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

// ERROR HANDLING
// Summary: Centralized error handling for consistent error reporting
// Description: Processes caught errors and ensures they are properly converted to TapsilatError types
/**
 * Generic error handler - consistent way to handle errors
 *
 * @summary Centralized error handling for consistent error reporting
 * @description Processes caught errors and ensures they are properly converted to TapsilatError types
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

// WEBHOOK SIGNATURE VERIFICATION
// Summary: Security verification of webhook payloads using HMAC-SHA256
// Description: Computes expected signature from payload and secret, compares with provided signature
/**
 * Verifies HMAC-SHA256 signature for webhook security
 *
 * @summary Security verification of webhook payloads using HMAC-SHA256
 * @description Computes expected signature from payload and secret, compares with provided signature
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
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return `sha256=${expectedSignature}` === signature;
};
