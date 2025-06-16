// SDK CONFIGURATION
// Summary: Core configuration options for the Tapsilat SDK
// Description: Defines the settings used to initialize and configure SDK behavior
/**
 * API Configuration for the Tapsilat SDK
 * 
 * @summary Core configuration options for the Tapsilat SDK
 * @description Defines the settings used to initialize and configure SDK behavior including API connection parameters and retry logic
 */
export interface TapsilatConfig {
  maxRetries: number | undefined;
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
}

// PAYMENT METHODS
// Summary: Supported payment method types in the Tapsilat system
// Description: Defines all available payment options that customers can use
/**
 * Payment Methods supported by the Tapsilat API
 * 
 * @summary Supported payment method types in the Tapsilat system
 * @description Defines all available payment options that customers can use during checkout
 */
export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "digital_wallet"
  | "crypto";

// PAYMENT STATUS
// Summary: Possible states of a payment throughout its lifecycle
// Description: Defines all states a payment can be in from creation to completion or failure
/**
 * Payment Status values in the payment lifecycle
 * 
 * @summary Possible states of a payment throughout its lifecycle
 * @description Defines all states a payment can be in from creation to completion or failure
 */
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

// CURRENCY TYPES
// Summary: Supported currency codes for transactions
// Description: ISO currency codes supported by the payment processing system
/**
 * Currency types supported for payment transactions
 * 
 * @summary Supported currency codes for transactions
 * @description ISO currency codes supported by the payment processing system
 */
export type Currency = "TRY" | "USD" | "EUR" | "GBP";

// PAYMENT REQUEST
// Summary: Data required to initiate a payment transaction
// Description: Contains required and optional fields for creating a new payment request
/**
 * Payment Request data structure
 * 
 * @summary Data required to initiate a payment transaction
 * @description Contains required and optional fields for creating a new payment request including amount, currency, and payment method
 */
export interface PaymentRequest {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
  returnUrl?: string;
  webhookUrl?: string;
  customerId?: string;
}

// PAYMENT RESPONSE
// Summary: Data returned after processing a payment request
// Description: Contains payment details, status, and transaction identifiers
/**
 * Payment Response data structure
 * 
 * @summary Data returned after processing a payment request
 * @description Contains payment details, status, transaction identifiers, timestamps, and payment URLs
 */
export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  paymentUrl?: string;
  transactionId?: string;
  errorMessage?: string;
}

// CUSTOMER INFORMATION
// Summary: Customer identification and contact details
// Description: Essential information about a customer for payment processing
/**
 * Customer Information data structure
 * 
 * @summary Customer identification and contact details
 * @description Essential information about a customer for payment processing, KYC, and communications
 */
export interface Customer {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  address?: Address;
}

// ADDRESS
// Summary: Physical address structure for shipping and billing
// Description: Standardized address format for customer locations
/**
 * Address data structure
 * 
 * @summary Physical address structure for shipping and billing
 * @description Standardized address format for customer locations with required and optional fields
 */
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// REFUND REQUEST
// Summary: Information needed to process a refund
// Description: Data required to initiate full or partial refunds
/**
 * Refund Request data structure
 * 
 * @summary Information needed to process a refund
 * @description Data required to initiate full or partial refunds for completed payments
 */
export interface RefundRequest {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason?: string;
}

// REFUND RESPONSE
// Summary: Data returned after processing a refund request
// Description: Result of refund operation including status and details
/**
 * Refund Response data structure
 * 
 * @summary Data returned after processing a refund request
 * @description Contains refund details, status, amount, and related transaction identifiers
 */
export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  reason?: string;
  createdAt: string;
}

// WEBHOOK EVENT
// Summary: Notification data structure for system events
// Description: Event payload sent to webhook endpoints when events occur
/**
 * Webhook Event data structure
 * 
 * @summary Notification data structure for system events
 * @description Event payload sent to webhook endpoints when important events occur in the payment lifecycle
 */
export interface WebhookEvent {
  id: string;
  type: "payment.completed" | "payment.failed" | "refund.completed";
  data: PaymentResponse | RefundResponse;
  createdAt: string;
}

// API ERROR
// Summary: Standardized error format returned by the API
// Description: Structured error information with code, message and details
/**
 * API Error data structure
 * 
 * @summary Standardized error format returned by the API
 * @description Structured error information with code, message and optional additional details
 */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// API RESPONSE
// Summary: Generic API response wrapper for all endpoints
// Description: Standard structure containing success status, data payload, and error information
/**
 * HTTP Response wrapper for API calls
 * 
 * @summary Generic API response wrapper for all endpoints
 * @description Standard structure containing success status, data payload, and error information
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// PAGINATION PARAMETERS
// Summary: Query parameters for paginated API requests
// Description: Controls paging behavior and sorting of list results
/**
 * Pagination Parameters for list operations
 * 
 * @summary Query parameters for paginated API requests
 * @description Controls paging behavior and sorting of list results with page numbers, limits, and sorting options
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// PAGINATED RESPONSE
// Summary: Standardized response format for paginated list operations
// Description: Contains both the data items and pagination metadata
/**
 * Paginated Response structure for list operations
 * 
 * @summary Standardized response format for paginated list operations
 * @description Contains both the requested data items and pagination metadata for navigation
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// SDK-SPECIFIC TYPES

// LOCALE
// Summary: Supported language codes for the API interface
// Description: Language preferences for API responses and UI elements
/**
 * Supported locales for the Tapsilat API
 * 
 * @summary Supported language codes for the API interface
 * @description Language preferences that determine text content in API responses and UI elements
 */
export type Locale = "tr" | "en";

// BUYER INFORMATION
// Summary: Customer details required for order processing
// Description: Comprehensive identification and contact information about the buyer
/**
 * Represents the buyer information
 * Based on BuyerDTO from the Python SDK
 * 
 * @summary Customer details required for order processing
 * @description Comprehensive identification and contact information about the buyer including name, contact details, and addresses
 */
export interface Buyer {
  name: string;
  surname: string;
  email: string;
  phone?: string;
  identityNumber?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
}

// ORDER CREATE REQUEST
// Summary: Data structure for creating a new payment order
// Description: Contains all required and optional fields to initiate an order
/**
 * Represents the data required to create a new order
 * Based on OrderCreateDTO from the Python SDK
 * 
 * @summary Data structure for creating a new payment order
 * @description Contains all required and optional fields to initiate an order including amount, currency, customer information, and callback URLs
 */
export interface OrderCreateRequest {
  amount: number;
  currency: Currency;
  locale: Locale;
  buyer: Buyer;
  description?: string;
  callbackUrl?: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}

// ORDER CREATE RESPONSE
// Summary: Data returned after successful order creation
// Description: Contains order identifiers and payment URLs
/**
 * Represents the response received after creating an order
 * 
 * @summary Data returned after successful order creation
 * @description Contains order identifiers, tracking references, checkout URLs, and status information
 */
export interface OrderCreateResponse {
  referenceId: string;
  conversationId: string;
  checkoutUrl: string;
  status: string;
  qrCodeUrl?: string;
}
