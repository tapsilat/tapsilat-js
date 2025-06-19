import { TapsilatError, TapsilatNetworkError } from "../errors/TapsilatError";
import { APIResponse } from "../types";

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
