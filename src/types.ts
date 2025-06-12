export interface TapsilatConfig {
  bearerToken: string;
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
  // Python SDK'da sadece bu üç alan zorunlu, diğer alanlar opsiyonel olarak eklenebilir ama birebir uyum için kaldırıldı.
}

/**
 * Represents the data required to create a new order.
 * Based on OrderCreateDTO from the Python SDK.
 */
export interface OrderCreateRequest {
  amount: number;
  currency: string;
  locale: string;
  buyer: Buyer;
  // Python SDK'da description, callbackUrl, conversationId, metadata yok. Gerekirse opsiyonel olarak eklenebilir ama birebir uyum için kaldırıldı.
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
  reference_id: string;
  amount: number;
  // Python SDK'da reason yok, gerekirse eklenebilir.
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

export interface BuyerDTO {
  name: string;
  surname: string;
  birth_date?: string;
  city?: string;
  country?: string;
  email?: string;
  gsm_number?: string;
  id?: string;
  identity_number?: string;
  ip?: string;
  last_login_date?: string;
  registration_address?: string;
  registration_date?: string;
  title?: string;
  zip_code?: string;
}

export interface BasketItemPayerDTO {
  address?: string;
  reference_id?: string;
  tax_office?: string;
  title?: string;
  type?: string;
  vat?: string;
}

export interface BasketItemDTO {
  category1?: string;
  category2?: string;
  commission_amount?: number;
  coupon?: string;
  coupon_discount?: number;
  data?: string;
  id?: string;
  item_type?: string;
  name?: string;
  paid_amount?: number;
  payer?: BasketItemPayerDTO;
  price?: number;
  quantity?: number;
  quantity_float?: number;
  quantity_unit?: string;
  sub_merchant_key?: string;
  sub_merchant_price?: string;
}

export interface BillingAddressDTO {
  address?: string;
  billing_type?: string;
  citizenship?: string;
  city?: string;
  contact_name?: string;
  contact_phone?: string;
  country?: string;
  district?: string;
  tax_office?: string;
  title?: string;
  vat_number?: string;
  zip_code?: string;
}

export interface CheckoutDesignDTO {
  input_background_color?: string;
  input_text_color?: string;
  label_text_color?: string;
  left_background_color?: string;
  logo?: string;
  order_detail_html?: string;
  pay_button_color?: string;
  redirect_url?: string;
  right_background_color?: string;
  text_color?: string;
}

export interface MetadataDTO {
  key: string;
  value: string;
}

export interface OrderCardDTO {
  card_id: string;
  card_sequence: number;
}

export interface PaymentTermDTO {
  amount?: number;
  data?: string;
  due_date?: string;
  paid_date?: string;
  required?: boolean;
  status?: string;
  term_reference_id?: string;
  term_sequence?: number;
}

export interface OrderPFSubMerchantDTO {
  address?: string;
  city?: string;
  country?: string;
  country_iso_code?: string;
  id?: string;
  mcc?: string;
  name?: string;
  org_id?: string;
  postal_code?: string;
  submerchant_nin?: string;
  submerchant_url?: string;
  terminal_no?: string;
}

export interface ShippingAddressDTO {
  address?: string;
  city?: string;
  contact_name?: string;
  country?: string;
  shipping_date?: string;
  tracking_code?: string;
  zip_code?: string;
}

export interface SubOrganizationDTO {
  acquirer?: string;
  address?: string;
  contact_first_name?: string;
  contact_last_name?: string;
  currency?: string;
  email?: string;
  gsm_number?: string;
  iban?: string;
  identity_number?: string;
  legal_company_title?: string;
  organization_name?: string;
  sub_merchant_external_id?: string;
  sub_merchant_key?: string;
  sub_merchant_type?: string;
  tax_number?: string;
  tax_office?: string;
}

export interface SubmerchantDTO {
  amount?: number;
  merchant_reference_id?: string;
  order_basket_item_id?: string;
}

export interface OrderCreateDTO {
  amount: number;
  currency: string;
  locale: string;
  buyer: BuyerDTO;
  basket_items?: BasketItemDTO[];
  billing_address?: BillingAddressDTO;
  checkout_design?: CheckoutDesignDTO;
  conversation_id?: string;
  enabled_installments?: number[];
  external_reference_id?: string;
  metadata?: MetadataDTO[];
  order_cards?: OrderCardDTO;
  paid_amount?: number;
  partial_payment?: boolean;
  payment_failure_url?: string;
  payment_methods?: boolean;
  payment_options?: string[];
  payment_success_url?: string;
  payment_terms?: PaymentTermDTO[];
  pf_sub_merchant?: OrderPFSubMerchantDTO;
  shipping_address?: ShippingAddressDTO;
  sub_organization?: SubOrganizationDTO;
  submerchants?: SubmerchantDTO[];
  tax_amount?: number;
  three_d_force?: boolean;
}

export interface RefundOrderDTO {
  amount: number;
  reference_id: string;
  order_item_id?: string;
  order_item_payment_id?: string;
}

export interface OrderPaymentTermCreateDTO {
  order_id: string;
  term_reference_id: string;
  amount: number;
  due_date: string;
  term_sequence: number;
  required: boolean;
  status: string;
  data?: string;
  paid_date?: string;
}

export interface OrderPaymentTermUpdateDTO {
  term_reference_id: string;
  amount?: number;
  due_date?: string;
  paid_date?: string;
  required?: boolean;
  status?: string;
  term_sequence?: number;
}

export interface OrderTermRefundRequest {
  term_id: string;
  amount: number;
  reference_id?: string;
  term_payment_id?: string;
}

export interface OrderResponse {
  reference_id: string;
  checkout_url: string;
  order_id?: string;
  // Diğer dönen alanlar...
} 