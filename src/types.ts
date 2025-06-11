export interface TapsilatConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  version?: string;
  debug?: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  status?: number;
  headers?: Record<string, string>;
}

export interface APIError {
  message: string;
  code: string;
  details?: Record<string, any>;
}

export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface PaymentRequest {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
  customerId?: string;
}

export interface PaymentResponse {
  id: string;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
  metadata?: Record<string, any>;
  customerId?: string;
  paymentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: Currency;
  status: 'pending' | 'completed' | 'failed';
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id?: string;
  email: string;
  name: string;
  phone?: string;
  address?: Address;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Address {
  street: string;
  city: string;
  country: string;
  postalCode: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface WebhookEvent {
  id: string;
  type: 'payment.completed' | 'payment.failed' | 'payment.cancelled' | 'refund.completed' | 'refund.failed';
  data: PaymentResponse | RefundResponse;
  createdAt: string;
  signature: string;
}

/**
 * Supported locales for the Tapsilat API.
 */
export type Locale = 'tr' | 'en';

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

/**
 * Represents a full order object with all details.
 */
export interface Order extends OrderCreateResponse {
  amount: number;
  currency: Currency;
  buyer: Buyer;
  description?: string;
  createdAt: string; // ISO 8601 date string
  updatedAt: string; // ISO 8601 date string
  metadata?: Record<string, unknown>;
}

/**
 * Represents the data needed to request a refund for an order.
 */
export interface OrderRefundRequest {
  referenceId: string;
  amount: number;
  reason?: string;
}

/**
 * Represents the response received after a refund request.
 */
export interface OrderRefundResponse {
  refundId: string;
  referenceId: string;
  status: string; // e.g., 'succeeded', 'pending', 'failed'
  amount: number;
  currency: Currency;
  createdAt: string;
}

/**
 * Represents the status of an order.
 */
export interface OrderStatusResponse {
  referenceId: string;
  status: string; // e.g., 'CREATED', 'PENDING_PAYMENT', 'COMPLETED', 'CANCELLED'
  lastUpdatedAt: string;
}

/**
 * Represents the details of a payment transaction associated with an order.
 */
export interface OrderPaymentDetail {
  transactionId: string;
  paymentMethod: string; // 'credit_card', 'bank_transfer', etc.
  amount: number;
  currency: Currency;
  status: string; // 'succeeded', 'failed'
  paidAt: string;
  cardInfo?: {
    binNumber: string;
    lastFourDigits: string;
    cardAssociation: string;
  };
} 