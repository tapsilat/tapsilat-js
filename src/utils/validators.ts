import { PaymentRequest, Currency, PaymentMethod } from "../types";
import { TapsilatValidationError } from "../errors/TapsilatError";

// Type Guards
/**
 * Type guard to check if a value is a valid PaymentMethod
 */
export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    ["credit_card", "debit_card", "bank_transfer", "digital_wallet"].includes(
      value
    )
  );
}

/**
 * Type guard to check if a value is a valid Currency
 */
export function isCurrency(value: unknown): value is Currency {
  return (
    typeof value === "string" && ["TRY", "USD", "EUR", "GBP"].includes(value)
  );
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return (
    typeof value === "number" && value > 0 && !isNaN(value) && isFinite(value)
  );
}

/**
 * Type guard to check if a value is an integer
 */
export function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

/**
 * Type guard to check if amount has max 2 decimal places
 */
export function hasValidDecimalPlaces(amount: number): boolean {
  const decimalPlaces = (amount.toString().split(".")[1] || "").length;
  return decimalPlaces <= 2;
}

// Validation Functions
/**
 * Validates Bearer token format and strength
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

/**
 * Validates payment request data comprehensively
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

/**
 * Validates email format using robust regex
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

/**
 * @deprecated Use isCurrency type guard instead
 */
export function isValidCurrency(currency: string): boolean {
  return isCurrency(currency);
}

/**
 * @deprecated Use isPaymentMethod type guard instead
 */
export function isValidPaymentMethod(paymentMethod: string): boolean {
  return isPaymentMethod(paymentMethod);
}

/**
 * Validates URL format and protocol
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

/**
 * Sanitizes metadata by removing sensitive keys and cleaning values
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

/**
 * Validates customer ID format
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

/**
 * Validates pagination parameters
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
