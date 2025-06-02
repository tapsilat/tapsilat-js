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