// API Configuration
export interface TapsilatConfig {
  maxRetries: number | undefined;
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
}

// Payment Methods
export type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "digital_wallet"
  | "crypto";

// Payment Status
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";

// Currency types
export type Currency = "TRY" | "USD" | "EUR" | "GBP";

// Payment Request
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

// Payment Response
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

// Customer Information
export interface Customer {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  address?: Address;
}

// Address
export interface Address {
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

// Refund Request
export interface RefundRequest {
  paymentId: string;
  amount?: number; // If not provided, full refund
  reason?: string;
}

// Refund Response
export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  reason?: string;
  createdAt: string;
}

// Webhook Event
export interface WebhookEvent {
  id: string;
  type: "payment.completed" | "payment.failed" | "refund.completed";
  data: PaymentResponse | RefundResponse;
  createdAt: string;
}

// API Error
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// HTTP Response wrapper
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// SDK-specific types for orders and buyer information

/**
 * Supported locales for the Tapsilat API.
 */
export type Locale = "tr" | "en";

/**
 * Represents the buyer information.
 * Based on BuyerDTO from the Python SDK.
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

/**
 * Represents the data required to create a new order.
 * Based on OrderCreateDTO from the Python SDK.
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

/**
 * Represents the response received after creating an order.
 */
export interface OrderCreateResponse {
  referenceId: string;
  conversationId: string;
  checkoutUrl: string;
  status: string;
  qrCodeUrl?: string;
}
