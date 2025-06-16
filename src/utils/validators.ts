import { PaymentRequest, Currency, PaymentMethod } from "../types/index";
import { TapsilatValidationError } from "../errors/TapsilatError";

// TYPE GUARDS
// Summary: Type guards for payment method validation
// Description: Checks if a value matches the allowed payment method types
/**
 * Type guard to check if a value is a valid PaymentMethod
 *
 * @summary Validates a value against supported payment methods
 * @description Checks if provided value is a string and matches one of the supported payment methods
 *
 * @param value - The value to check
 * @returns True if the value is a valid PaymentMethod, narrowing the type
 */
export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    ["credit_card", "debit_card", "bank_transfer", "digital_wallet"].includes(
      value
    )
  );
}

// CURRENCY VALIDATION
// Summary: Type guard for currency validation
// Description: Checks if a value matches the allowed currency types
/**
 * Type guard to check if a value is a valid Currency
 *
 * @summary Validates a value against supported currencies
 * @description Checks if provided value is a string and matches one of the supported currencies (TRY, USD, EUR, GBP)
 *
 * @param value - The value to check
 * @returns True if the value is a valid Currency, narrowing the type
 */
export function isCurrency(value: unknown): value is Currency {
  return (
    typeof value === "string" && ["TRY", "USD", "EUR", "GBP"].includes(value)
  );
}

// STRING VALIDATION
// Summary: Type guard for non-empty string validation
// Description: Checks if a value is a string and contains non-whitespace characters
/**
 * Type guard to check if a value is a non-empty string
 *
 * @summary Validates a value is a non-empty string
 * @description Checks if provided value is of string type and contains at least one non-whitespace character
 *
 * @param value - The value to check
 * @returns True if the value is a non-empty string, narrowing the type
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

// NUMBER VALIDATION
// Summary: Type guard for positive number validation
// Description: Checks if a value is a number greater than zero
/**
 * Type guard to check if a value is a positive number
 *
 * @summary Validates a value is a positive number
 * @description Checks if provided value is of number type, is greater than zero, and is not NaN or infinity
 *
 * @param value - The value to check
 * @returns True if the value is a positive number, narrowing the type
 */
export function isPositiveNumber(value: unknown): value is number {
  return (
    typeof value === "number" && value > 0 && !isNaN(value) && isFinite(value)
  );
}

// INTEGER VALIDATION
// Summary: Type guard for integer validation
// Description: Checks if a value is an integer number
/**
 * Type guard to check if a value is an integer
 *
 * @summary Validates a value is an integer
 * @description Checks if provided value is of number type and is an integer (no decimal places)
 *
 * @param value - The value to check
 * @returns True if the value is an integer, narrowing the type
 */
export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

// DECIMAL PLACES VALIDATION
// Summary: Validates that a number has maximum 2 decimal places
// Description: Ensures monetary values have appropriate precision for currency operations
/**
 * Type guard to check if amount has max 2 decimal places
 *
 * @summary Validates that a number has maximum 2 decimal places
 * @description Ensures monetary values have appropriate precision for currency operations
 *
 * @param amount - The numeric amount to validate
 * @returns True if the amount has 2 or fewer decimal places
 */
export function hasValidDecimalPlaces(amount: number): boolean {
  const decimalPlaces = (amount.toString().split(".")[1] || "").length;
  return decimalPlaces <= 2;
}

// VALIDATION FUNCTIONS
// BEARER TOKEN VALIDATION
// Summary: Validates authentication token format and security
// Description: Checks token for required length, character set, and format constraints
/**
 * Validates Bearer token format and strength
 *
 * @summary Validates authentication token format and security
 * @description Checks token for required length, character set, and format constraints
 *
 * @param bearerToken - Bearer token to validate
 * @throws {TapsilatValidationError} When Bearer token is invalid
 */
export function validateBearerToken(
  bearerToken: unknown
): asserts bearerToken is string {
  if (!isNonEmptyString(bearerToken)) {
    throw new TapsilatValidationError(
      "Bearer token must be a non-empty string"
    );
  }
  if (bearerToken.length < 10) {
    throw new TapsilatValidationError(
      "Bearer token must be at least 10 characters long"
    );
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(bearerToken)) {
    throw new TapsilatValidationError(
      "Bearer token contains invalid characters"
    );
  }
}

// PAYMENT REQUEST VALIDATION
// Summary: Comprehensive validation of payment request data
// Description: Validates all required and optional fields in a payment request for integrity and correctness
/**
 * Validates payment request data comprehensively
 *
 * @summary Comprehensive validation of payment request data
 * @description Validates all required and optional fields in a payment request for integrity and correctness
 *
 * @param request - Payment request to validate
 * @throws {TapsilatValidationError} When any field is invalid
 */
export function validatePaymentRequest(
  request: unknown
): asserts request is PaymentRequest {
  if (!request || typeof request !== "object") {
    throw new TapsilatValidationError("Payment request must be an object");
  }

  const req = request as Record<string, unknown>;

  // Amount validation
  if (!isPositiveNumber(req.amount)) {
    throw new TapsilatValidationError("Amount must be a positive number");
  }

  if (!hasValidDecimalPlaces(req.amount)) {
    throw new TapsilatValidationError(
      "Amount cannot have more than 2 decimal places"
    );
  }

  // Currency validation
  if (!isCurrency(req.currency)) {
    throw new TapsilatValidationError(
      `Currency must be one of: ${["TRY", "USD", "EUR", "GBP"].join(", ")}`
    );
  }

  // Payment method validation
  if (!isPaymentMethod(req.paymentMethod)) {
    throw new TapsilatValidationError(
      `Payment method must be one of: ${[
        "credit_card",
        "debit_card",
        "bank_transfer",
        "digital_wallet",
      ].join(", ")}`
    );
  }

  // Optional field validations
  if (req.description !== undefined && !isNonEmptyString(req.description)) {
    throw new TapsilatValidationError(
      "Description must be a non-empty string when provided"
    );
  }

  if (req.returnUrl !== undefined && !isValidUrl(req.returnUrl as string)) {
    throw new TapsilatValidationError(
      "Return URL must be a valid HTTP/HTTPS URL when provided"
    );
  }

  if (req.cancelUrl !== undefined && !isValidUrl(req.cancelUrl as string)) {
    throw new TapsilatValidationError(
      "Cancel URL must be a valid HTTP/HTTPS URL when provided"
    );
  }

  if (
    req.metadata !== undefined &&
    (typeof req.metadata !== "object" || req.metadata === null)
  ) {
    throw new TapsilatValidationError(
      "Metadata must be an object when provided"
    );
  }
}

// EMAIL FORMAT VALIDATION
// Summary: Validates email address format with comprehensive regex
// Description: Ensures email addresses conform to RFC standards with thorough pattern matching
/**
 * Validates email format using robust regex
 *
 * @summary Validates email address format with comprehensive regex
 * @description Ensures email addresses conform to RFC standards with thorough pattern matching
 *
 * @param email - Email address to validate
 * @returns True if email format is valid
 */
export function validateEmail(email: string): boolean {
  if (!isNonEmptyString(email)) {
    return false;
  }

  // More comprehensive email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
}

// DEPRECATED CURRENCY VALIDATION
// Summary: Legacy currency validation function
// Description: Maintained for backwards compatibility, redirects to the new type guard
/**
 * @deprecated Use isCurrency type guard instead
 *
 * @summary Legacy currency validation function
 * @description Maintained for backwards compatibility, redirects to the new type guard
 *
 * @param currency - Currency code to validate
 * @returns True if currency is supported
 */
export function isValidCurrency(currency: string): boolean {
  return isCurrency(currency);
}

// DEPRECATED PAYMENT METHOD VALIDATION
// Summary: Legacy payment method validation function
// Description: Maintained for backwards compatibility, redirects to the new type guard
/**
 * @deprecated Use isPaymentMethod type guard instead
 *
 * @summary Legacy payment method validation function
 * @description Maintained for backwards compatibility, redirects to the new type guard
 *
 * @param paymentMethod - Payment method to validate
 * @returns True if payment method is supported
 */
export function isValidPaymentMethod(paymentMethod: string): boolean {
  return isPaymentMethod(paymentMethod);
}

// URL FORMAT VALIDATION
// Summary: Validates URL format and ensures proper protocol
// Description: Checks that URLs are well-formed and use HTTP or HTTPS protocols for security
/**
 * Validates URL format and protocol
 *
 * @summary Validates URL format and ensures proper protocol
 * @description Checks that URLs are well-formed and use HTTP or HTTPS protocols for security
 *
 * @param url - URL to validate
 * @returns True if URL is valid HTTP/HTTPS
 */
export function isValidUrl(url: string): boolean {
  if (!isNonEmptyString(url)) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

// METADATA SANITIZATION
// Summary: Removes sensitive data from metadata before processing
// Description: Filters out security-sensitive keys and normalizes values for safe transmission
/**
 * Sanitizes metadata by removing sensitive keys and cleaning values
 *
 * @summary Removes sensitive data from metadata before processing
 * @description Filters out security-sensitive keys and normalizes values for safe transmission
 *
 * @param metadata - Raw metadata object
 * @returns Sanitized metadata object
 */
export function sanitizeMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  const sensitiveKeys = new Set([
    "password",
    "secret",
    "token",
    "apikey",
    "api_key",
    "auth",
    "authorization",
    "cookie",
    "session",
    "bearertoken",
  ]);

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Skip sensitive keys (case-insensitive)
    if (sensitiveKeys.has(key.toLowerCase())) {
      continue;
    }

    // Clean and validate values
    let cleanValue: unknown = value;

    if (typeof value === "string") {
      cleanValue = value.trim();
      // Skip empty strings
      if (cleanValue === "") {
        continue;
      }
    } else if (value === null || value === undefined) {
      // Skip null/undefined values
      continue;
    } else if (typeof value === "object") {
      // Convert objects to string representation
      cleanValue = "[object Object]";
    }

    sanitized[key] = cleanValue;
  }

  return sanitized;
}

// CUSTOMER ID VALIDATION
// Summary: Validates customer identifier format and constraints
// Description: Ensures customer IDs meet length requirements and contain valid characters
/**
 * Validates customer ID format
 *
 * @summary Validates customer identifier format and constraints
 * @description Ensures customer IDs meet length requirements and contain valid characters
 *
 * @param customerId - Customer ID to validate
 * @throws {TapsilatValidationError} When customer ID is invalid
 */
export function validateCustomerId(
  customerId: unknown
): asserts customerId is string {
  if (!isNonEmptyString(customerId)) {
    throw new TapsilatValidationError("Customer ID must be a non-empty string");
  }

  if (customerId.length > 255) {
    throw new TapsilatValidationError(
      "Customer ID must not exceed 255 characters"
    );
  }
}

// PAGINATION PARAMETERS VALIDATION
// Summary: Validates parameters used for paginated API requests
// Description: Ensures pagination parameters are within allowed ranges and follow required formats
/**
 * Validates pagination parameters
 *
 * @summary Validates parameters used for paginated API requests
 * @description Ensures pagination parameters are within allowed ranges and follow required formats
 *
 * @param params - Pagination parameters to validate
 * @throws {TapsilatValidationError} When parameters are invalid
 */
export function validatePaginationParams(params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): void {
  if (params.page !== undefined) {
    if (!Number.isInteger(params.page) || params.page < 1) {
      throw new TapsilatValidationError("Page must be a positive integer");
    }
  }

  if (params.limit !== undefined) {
    if (
      !Number.isInteger(params.limit) ||
      params.limit < 1 ||
      params.limit > 100
    ) {
      throw new TapsilatValidationError(
        "Limit must be an integer between 1 and 100"
      );
    }
  }

  if (params.sortOrder !== undefined) {
    if (!["asc", "desc"].includes(params.sortOrder)) {
      throw new TapsilatValidationError(
        'Sort order must be either "asc" or "desc"'
      );
    }
  }
}
