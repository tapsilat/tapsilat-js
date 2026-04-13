/**
 * @module Types
 * @description Tapsilat SDK type definitions, interfaces, and API data structures
 */

// SDK CONFIGURATION
// Summary: Core configuration options for the Tapsilat SDK
// Description: Defines the settings used to initialize and configure SDK behavior
/**
 * @category Configuration
 * @summary Core configuration options for the Tapsilat SDK
 * @description Defines the settings used to initialize and configure SDK behavior including API connection parameters and retry logic
 * @interface TapsilatConfig
 */
export interface TapsilatConfig {
  bearerToken: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  version?: string;
  debug?: boolean;
}

// PAYMENT METHODS
// Summary: Supported payment method types in the Tapsilat system
// Description: Defines all available payment options that customers can use
/**
 * @category Payment Processing
 * @summary Supported payment method types in the Tapsilat system
 * @description Defines all available payment options that customers can use during checkout
 * @typedef {string} PaymentMethod
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
 * @category Payment Processing
 * @summary Possible states of a payment throughout its lifecycle
 * @description Defines all states a payment can be in from creation to completion or failure
 * @typedef {string} PaymentStatus
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
 * @category Payment Processing
 * @summary Supported currency codes for transactions
 * @description ISO currency codes supported by the payment processing system
 * @typedef {string} Currency
 */
export type Currency = "TRY" | "USD" | "EUR" | "GBP";

// PAYMENT REQUEST
// Summary: Data required to initiate a payment transaction
// Description: Contains required and optional fields for creating a new payment request
/**
 * @category Payment Processing
 * @summary Data required to initiate a payment transaction
 * @description Contains required and optional fields for creating a new payment request including amount, currency, and payment method
 * @interface PaymentRequest
 */
export interface PaymentRequest {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, unknown>;
  returnUrl?: string;
  webhookUrl?: string;
  customerId?: string;
}

// PAYMENT RESPONSE
// Summary: Data returned after processing a payment request
// Description: Contains payment details, status, and transaction identifiers
/**
 * @category Payment Processing
 * @summary Data returned after processing a payment request
 * @description Contains payment details, status, transaction identifiers, timestamps, and payment URLs
 * @interface PaymentResponse
 */
export interface PaymentResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  description?: string;
  metadata?: Record<string, unknown>;
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
 * @category Customer Data
 * @summary Customer identification and contact details
 * @description Essential information about a customer for payment processing, KYC, and communications
 * @interface Customer
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
 * @category Customer Data
 * @summary Physical address structure for shipping and billing
 * @description Standardized address format for customer locations with required and optional fields
 * @interface Address
 */
export interface Address {
  address?: string;
  city?: string;
  contact_name?: string;
  country?: string;
  zip_code?: string;
  district?: string;
  contact_phone?: string;
}

/**
 * @category Customer Data
 * @summary Billing address with tax information
 * @description Extended address structure for billing with tax and company details
 * @interface BillingAddress
 */
export interface BillingAddress extends Address {
  billing_type: "PERSONAL" | "BUSINESS" | "CORPORATE";
  citizenship?: string;
  neighbourhood?: string;
  street1?: string;
  street2?: string;
  street3?: string;
  vat_number?: string;
  tax_office?: string;
  title?: string;
}

/**
 * @category Order Management
 * @summary Item in the order basket
 * @description Represents a product or service in the order with pricing and categorization
 * @interface BasketItem
 */
export interface BasketItem {
  id?: string;
  name?: string;
  category1?: string;
  category2?: string;
  commission_amount?: number;
  coupon?: string;
  mcc?: string;
  item_type?: string;
  paid_amount?: number;
  payer?: BasketItemPayerDTO;
  price?: number;
  quantity?: number;
  quantity_float?: number;
  coupon_discount?: number;
  data?: string;
  quantity_unit?: string;
  sub_merchant_key?: string;
  sub_merchant_price?: string;
}

/**
 * @category Payment Processing
 * @summary Available payment options for customers
 * @description Different payment methods that can be enabled for an order
 * @typedef {string} PaymentOption
 */
export type PaymentOption =
  | "credit_card"
  | "bank_transfer"
  | "cash"
  | "debit_card"
  | "PAY_WITH_WALLET"
  | "PAY_WITH_CARD"
  | "PAY_WITH_LOAN"
  | "PAY_WITH_CASH"
  | "PAY_WITH_BANK";

// REFUND REQUEST
// Summary: Information needed to process a refund
// Description: Data required to initiate full or partial refunds
/**
 * @category Refunds
 * @summary Information needed to process a refund
 * @description Data required to initiate full or partial refunds for completed payments
 * @interface RefundRequest
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
 * @category Refunds
 * @summary Data returned after processing a refund request
 * @description Contains refund details, status, amount, and related transaction identifiers
 * @interface RefundResponse
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
 * @category Webhooks
 * @summary Notification data structure for system events
 * @description Event payload sent to webhook endpoints when important events occur in the payment lifecycle
 * @interface WebhookEvent
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
 * @category Error Handling
 * @summary Standardized error format returned by the API
 * @description Structured error information with code, message and optional additional details
 * @interface APIError
 */
export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

// API RESPONSE
// Summary: Generic API response wrapper for all endpoints
// Description: Standard structure containing success status, data payload, and error information
/**
 * @category HTTP
 * @summary Generic API response wrapper for all endpoints
 * @description Standard structure containing success status, data payload, and error information
 * @interface APIResponse
 */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  status?: number;
  headers?: Record<string, string>;
}

// PAGINATION PARAMETERS
// Summary: Query parameters for paginated API requests
// Description: Controls paging behavior and sorting of list results
/**
 * @category HTTP
 * @summary Query parameters for paginated API requests
 * @description Controls paging behavior and sorting of list results with page numbers, limits, and sorting options
 * @interface PaginationParams
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
 * @category HTTP
 * @summary Standardized response format for paginated list operations
 * @description Contains both the requested data items and pagination metadata for navigation
 * @interface PaginatedResponse
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
 * @category Localization
 * @summary Supported language codes for the API interface
 * @description Language preferences that determine text content in API responses and UI elements
 * @typedef {string} Locale
 */
export type Locale = "tr" | "en";

// BUYER INFORMATION
// Summary: Customer details required for order processing
// Description: Comprehensive identification and contact information about the buyer
/**
 * @category Order Management
 * @summary Customer details required for order processing
 * @description Comprehensive identification and contact information about the buyer including name, contact details, and addresses
 * @interface Buyer
 */
export interface Buyer {
  id?: string;
  name: string;
  surname: string;
  birth_date?: string;
  email: string;
  gsm_number?: string;
  identity_number?: string;
  registration_address?: string;
  city?: string;
  country?: string;
  title?: string;
  zip_code?: string;
  ip?: string;
  registration_date?: string;
  last_login_date?: string;
}

// ORDER CREATE REQUEST
// Summary: Data structure for creating a new payment order
// Description: Contains all required and optional fields to initiate an order
/**
 * @category Order Management
 * @summary Data structure for creating a new payment order
 * @description Contains all required and optional fields to initiate an order including amount, currency, customer information, and callback URLs
 * @interface OrderCreateRequest
 */
export interface OrderMetadata {
  key: string;
  value: string;
}

export interface OrderCreateRequest {
  amount: number;
  tax_amount?: number;
  locale: Locale;
  three_d_force?: boolean;
  currency: Currency;
  checkout_design?: CheckoutDesignDTO;
  shipping_address?: ShippingAddressDTO;
  basket_items?: BasketItem[];
  billing_address?: BillingAddress;
  buyer: Buyer;
  consents?: OrderConsent[];
  conversation_id?: string;
  external_reference_id?: string;
  order_cards?: OrderCardDTO[];
  paid_amount?: number;
  partial_payment?: boolean;
  payment_mode?: string;
  payment_methods?: boolean;
  payment_options?: PaymentOption[];
  payment_success_url?: string;
  payment_failure_url?: string;
  payment_terms?: PaymentTermDTO[];
  pf_sub_merchant?: OrderPFSubMerchantDTO;
  redirect_failure_url?: string;
  redirect_success_url?: string;
  enabled_installments?: number[];
  metadata?: OrderMetadata[];
  sub_organization?: SubOrganizationDTO;
  submerchants?: SubmerchantDTO[];
}

// ORDER CREATE RESPONSE
// Summary: Data returned after successful order creation
// Description: Contains order identifiers and payment URLs
/**
 * @category Order Management
 * @summary Data returned after successful order creation
 * @description Contains order identifiers, tracking references, checkout URLs, and status information
 * @interface OrderCreateResponse
 */
export interface OrderCreateResponse {
  code?: number;
  id?: string;
  message?: string;
  organization_id?: string;
  order_id?: string;
  reference_id: string;
  checkout_url?: string;
  conversation_id?: string;
  status?: string;
  qr_code_url?: string;
}

/**
 * @category Order Management
 * @summary Complete order information including buyer, payment, and status details
 * @description Contains all information related to an order including creation and update timestamps
 * @interface Order
 */
export interface Order extends OrderCreateResponse {
  amount: number | string; // API returns string, but we might want to parse it
  currency: Currency;
  buyer?: Buyer;
  description?: string;
  createdAt?: string; // ISO 8601 date string
  updatedAt?: string; // ISO 8601 date string
  metadata?: Record<string, unknown>;
  // Additional fields from API response
  id?: string;
  name?: string;
  email?: string;
  total?: string;
  checkout_url?: string;
  organization?: string;
  unpaid_amount?: number;
}

/**
 * @category Order Management
 * @summary Response payload for order detail retrieval
 * @description Swagger-aligned response schema for GET /order/{id}
 * @interface GetOrderResponse
 */
export interface GetOrderResponse {
  amount?: string;
  basket_items?: BasketItemDTO[];
  billing_address?: BillingAddressDTO;
  buyer?: BuyerDTO;
  checkout_design?: CheckoutDesignDTO;
  checkout_url?: string;
  conversation_id?: string;
  created_at?: string;
  currency?: string;
  external_reference_id?: string;
  locale?: string;
  metadata?: MetadataDTO[];
  paid_amount?: string;
  payment_failure_url?: string;
  payment_options?: string[];
  payment_success_url?: string;
  payment_terms?: PaymentTermDTO[];
  redirect_failure_url?: string;
  redirect_success_url?: string;
  reference_id?: string;
  refunded_amount?: string;
  shipping_address?: ShippingAddressDTO;
  status?: number;
  status_enum?: string;
  total?: string;
}

/**
 * @category Order Management
 * @summary Query parameters for order listing
 * @description Swagger-aligned query options for GET /order/list
 * @interface GetOrdersRequest
 */
export interface GetOrdersRequest {
  page?: number;
  per_page?: number;
  start_date?: string;
  end_date?: string;
  organization_id?: string;
  related_reference_id?: string;
  buyer_id?: string;
  status?: number;
}

/**
 * @category Order Management
 * @summary Single list item returned by order listing
 * @description Swagger-aligned row schema for GET /order/list
 * @interface GetOrdersListItem
 */
export interface GetOrdersListItem {
  checkout_url?: string;
  email?: string;
  id?: string;
  metadata?: MetadataDTO[];
  name?: string;
  organization?: string;
  organization_id?: string;
  paid_amount?: number;
  paid_term_count?: number;
  reference_id?: string;
  refund_date?: string;
  status?: number;
  total?: string;
  total_term_count?: number;
  unpaid_amount?: number;
}

/**
 * @category Order Management
 * @summary Response payload for order listing
 * @description Swagger-aligned response schema for GET /order/list
 * @interface GetOrdersResponse
 */
export interface GetOrdersResponse {
  page?: number;
  per_page?: number;
  rows?: GetOrdersListItem[];
  total?: number;
  total_pages?: number;
}

/**
 * @category Order Management
 * @summary Request payload for order cancellation
 * @description Swagger-aligned request schema for POST /order/cancel
 * @interface CancelOrderRequest
 */
export interface CancelOrderRequest {
  reference_id: string;
}

/**
 * @category Order Management
 * @summary Response payload for order cancellation
 * @description Swagger-aligned response schema for POST /order/cancel
 * @interface CancelOrderResponse
 */
export interface CancelOrderResponse {
  is_success?: boolean;
  message?: string;
  status?: string;
}

/**
 * @category Refunds
 * @summary Refund request information for an order
 * @description Contains the data needed to process a refund for a specific order
 * @interface OrderRefundRequest
 */
export interface OrderRefundRequest {
  reference_id: string;
  amount: number;
  order_item_id?: string;
  order_item_payment_id?: string;
}

/**
 * @category Refunds
 * @summary Response data after processing a refund request
 * @description Contains information about the processed refund including status and amount
 * @interface OrderRefundResponse
 */
export interface OrderRefundResponse {
  is_success?: boolean;
  message?: string;
  refundId?: string;
  referenceId?: string;
  status?: string; // e.g., 'succeeded', 'pending', 'failed'
  amount?: number;
  currency?: Currency;
  createdAt?: string;
}

/**
 * @category Order Management
 * @summary Order status information
 * @description Swagger-aligned response payload for GET /order/{id}/status
 * @interface OrderStatusResponse
 */
export interface OrderStatusResponse {
  error_code?: string;
  status?: string;
}

/**
 * @category System
 * @summary System order status item
 * @description Represents a single status entry returned by the system order statuses endpoint
 * @interface SystemOrderStatus
 */
export interface SystemOrderStatus {
  code?: number;
  message?: string;
}

/**
 * @category System
 * @summary Response for system order statuses
 * @description API response payload for listing available system order statuses
 * @interface GetSystemOrderStatusesResponse
 */
export interface GetSystemOrderStatusesResponse {
  rows?: SystemOrderStatus[];
}

/**
 * @category Payment Processing
 * @summary Payment transaction details
 * @description Contains information about a payment transaction including method, amount, and card details
 * @interface OrderPaymentDetail
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

export interface OrderPaymentDetailInfoResponse {
  id?: string;
  paid_date?: string;
  paid_date_timestamp?: number;
  reference_id?: string;
  refunded_amount?: number;
  status?: string;
}

export interface OrderPaymentDetailOrderPaymentStatusResponse {
  acquirere_response?: string;
  code?: string;
  expiry_month?: string;
  expiry_year?: string;
  is_error?: boolean;
  masked_pan?: string;
  message?: string;
}

export interface OrderPaymentDetailsResponse {
  auth_code?: string;
  batch_no?: string;
  card_holder_name?: string;
  card_number?: string;
  is_three_ds?: boolean;
  mdstatus?: string;
  order_id?: string;
  payment_id?: string;
  payment_transaction_id?: string;
  reference_id?: string;
  rrn?: string;
}

export interface OrderPaymentDetailRuleResponse {
  id?: string;
  name?: string;
}

export interface OrderPaymentDetailVposResponse {
  acquirer?: string;
  bank_code?: string;
  commission_rate?: string;
  id?: string;
  name?: string;
}

export interface GetOrderPaymentDetailsResponse {
  conversation_id?: string;
  id?: string;
  order?: OrderPaymentDetailInfoResponse;
  order_payment_status?: OrderPaymentDetailOrderPaymentStatusResponse;
  organization_id?: string;
  paymentDetails?: OrderPaymentDetailsResponse;
  rule?: OrderPaymentDetailRuleResponse;
  vpos?: OrderPaymentDetailVposResponse;
  vposResponse?: string;
}

/**
 * @category API DTOs
 * @summary API representation of buyer information
 * @description Contains buyer details as formatted in the API responses
 * @interface BuyerDTO
 */
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

/**
 * @category API DTOs
 * @summary Payment responsibility information for basket items
 * @description Details of the entity responsible for paying a specific basket item
 * @interface BasketItemPayerDTO
 */
export interface BasketItemPayerDTO {
  address?: string;
  reference_id?: string;
  tax_office?: string;
  title?: string;
  type?: string;
  vat?: string;
}

/**
 * @category API DTOs
 * @summary Individual item in an order basket
 * @description Details about a product or service being purchased including price and quantity
 * @interface BasketItemDTO
 */
export interface BasketItemDTO {
  category1?: string;
  category2?: string;
  commission_amount?: number;
  coupon?: string;
  coupon_discount?: number;
  data?: string;
  id?: string;
  item_type?: string;
  mcc?: string;
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

/**
 * @category API DTOs
 * @summary Address information for billing purposes
 * @description Complete billing address information including tax details
 * @interface BillingAddressDTO
 */
export interface BillingAddressDTO {
  address?: string;
  billing_type?: string;
  citizenship?: string;
  city?: string;
  contact_name?: string;
  contact_phone?: string;
  country?: string;
  district?: string;
  neighbourhood?: string;
  street1?: string;
  street2?: string;
  street3?: string;
  tax_office?: string;
  title?: string;
  vat_number?: string;
  zip_code?: string;
}

/**
 * @category UI Customization
 * @summary Customization options for the checkout page
 * @description Visual design parameters for customizing the checkout experience
 * @interface CheckoutDesignDTO
 */
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

/**
 * @category API DTOs
 * @summary Custom metadata for orders and transactions
 * @description Key-value pairs for storing additional information with orders
 * @interface MetadataDTO
 */
export interface MetadataDTO {
  key: string;
  value: string;
}

/**
 * @category Payment Processing
 * @summary Card information for processing an order
 * @description Identifies a saved card to use for payment
 * @interface OrderCardDTO
 */
export interface OrderCardDTO {
  card_id: string;
  card_sequence: number;
}

/**
 * @category Payment Processing
 * @summary Individual payment term for an order
 * @description Details for installment or partial payments with due dates and status
 * @interface PaymentTermDTO
 */
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

/**
 * @category Submerchant
 * @summary Payment facilitation submerchant details
 * @description Information about a submerchant in a payment facilitation flow
 * @interface OrderPFSubMerchantDTO
 */
export interface OrderPFSubMerchantDTO {
  address?: string;
  city?: string;
  country?: string;
  country_iso_code?: string;
  id?: string;
  mcc?: string;
  name?: string;
  national_id?: string;
  org_id?: string;
  postal_code?: string;
  submerchant_nin?: string;
  submerchant_url?: string;
  switch_id?: string;
  terminal_no?: string;
}

/**
 * @category API DTOs
 * @summary Address information for shipping
 * @description Complete shipping address information including tracking details
 * @interface ShippingAddressDTO
 */
export interface ShippingAddressDTO {
  address?: string;
  city?: string;
  contact_name?: string;
  country?: string;
  shipping_date?: string;
  tracking_code?: string;
  zip_code?: string;
}

/**
 * @category Submerchant
 * @summary Details for sub-organization relationships
 * @description Information about a subsidiary organization for payment processing
 * @interface SubOrganizationDTO
 */
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

/**
 * @category Submerchant
 * @summary Payment information for submerchants
 * @description Defines how payments are split with submerchants
 * @interface SubmerchantDTO
 */
export interface SubmerchantDTO {
  amount?: number;
  merchant_reference_id?: string;
  order_basket_item_id?: string;
}

/**
 * @category Order Management
 * @summary Order consent information
 * @description Title and URL for legal consents required during order creation
 * @interface OrderConsent
 */
export interface OrderConsent {
  title?: string;
  url?: string;
}

/**
 * @category API DTOs
 * @summary Comprehensive order creation request
 * @description Full API request structure for creating an order with all possible options
 * @interface OrderCreateDTO
 */
export interface OrderCreateDTO {
  amount: number;
  currency: Currency;
  locale: Locale;
  buyer: BuyerDTO;
  basket_items?: BasketItemDTO[];
  billing_address?: BillingAddressDTO;
  checkout_design?: CheckoutDesignDTO;
  consents?: OrderConsent[];
  conversation_id?: string;
  enabled_installments?: number[];
  external_reference_id?: string;
  metadata?: MetadataDTO[];
  order_cards?: OrderCardDTO[];
  paid_amount?: number;
  partial_payment?: boolean;
  payment_failure_url?: string;
  payment_mode?: string;
  payment_methods?: boolean;
  payment_options?: string[];
  payment_success_url?: string;
  payment_terms?: PaymentTermDTO[];
  pf_sub_merchant?: OrderPFSubMerchantDTO;
  redirect_failure_url?: string;
  redirect_success_url?: string;
  shipping_address?: ShippingAddressDTO;
  sub_organization?: SubOrganizationDTO;
  submerchants?: SubmerchantDTO[];
  tax_amount?: number;
  three_d_force?: boolean;
}

/**
 * @category Refunds
 * @summary Data structure for requesting a refund
 * @description Contains the necessary information to process a refund for an order
 * @interface RefundOrderDTO
 */
export interface RefundOrderDTO {
  amount: number;
  reference_id: string;
  order_item_id?: string;
  order_item_payment_id?: string;
}

/**
 * @category Refunds
 * @summary Data structure for requesting a full refund
 * @description Contains the order reference required to fully refund an order
 * @interface RefundAllOrderDTO
 */
export interface RefundAllOrderDTO {
  reference_id: string;
}

/**
 * @category Payment Processing
 * @summary Data structure for order payment detail query
 * @description Request payload for POST /order/payment-details
 * @interface OrderPaymentDetailDTO
 */
export interface OrderPaymentDetailDTO {
  conversation_id?: string;
  reference_id?: string;
}

/**
 * @category Payment Terms
 * @summary Data for creating a payment term
 * @description Structure for creating a new payment term for an existing order
 * @interface OrderPaymentTermCreateDTO
 */
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

/**
 * @category Payment Terms
 * @summary Data for updating a payment term
 * @description Structure for updating an existing payment term
 * @interface OrderPaymentTermUpdateDTO
 */
export interface OrderPaymentTermUpdateDTO {
  term_reference_id: string;
  amount?: number;
  due_date?: string;
  paid_date?: string;
  required?: boolean;
  status?: string;
  term_sequence?: number;
}

/**
 * @category Refunds
 * @summary Request to refund a specific payment term
 * @description Data required to process a refund for a specific payment term
 * @interface OrderTermRefundRequest
 */
export interface OrderTermRefundRequest {
  term_id: string;
  amount: number;
  reference_id?: string;
  term_payment_id?: string;
}

/**
 * @category Order Management
 * @summary Basic order creation response
 * @description Minimal response information after order creation
 * @interface OrderResponse
 */
export interface OrderResponse {
  reference_id: string;
  checkout_url: string;
  order_id?: string;
}

// PAYMENT TERM MANAGEMENT TYPES
// Summary: Types for managing payment terms and installments
// Description: Payment term operations including creation, update, deletion, and refunding

/**
 * @category Payment Terms
 * @summary Response data from payment term operations
 * @description Standard response structure for payment term API operations
 * @interface PaymentTermResponse
 */
export interface PaymentTermResponse {
  term_reference_id: string;
  order_id: string;
  amount: number;
  due_date: string;
  status: string;
  term_sequence: number;
  required: boolean;
  created_at: string;
  updated_at?: string;
  paid_date?: string;
  data?: string;
}

export interface OrderPaymentTermActionResponse {
  code?: number;
  message?: string;
}

/**
 * @category Payment Terms
 * @summary Request data for deleting a payment term
 * @description Contains the identifier needed to delete a specific payment term
 * @interface PaymentTermDeleteRequest
 */
export interface PaymentTermDeleteRequest {
  order_id?: string;
  term_reference_id: string;
}

/**
 * @category Payment Terms
 * @summary Response from payment term refund operation
 * @description Contains details about a processed payment term refund
 * @interface PaymentTermRefundResponse
 */
export interface PaymentTermRefundResponse {
  code?: number;
  is_success?: boolean;
  message?: string;
  refund_id?: string;
  term_reference_id?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  refund_reference_id?: string;
}

/**
 * @category Payment Terms
 * @summary Request to terminate a payment term
 * @description Data required to terminate an active payment term
 * @interface PaymentTermTerminateRequest
 */
export interface PaymentTermTerminateRequest {
  term_reference_id: string;
  reason?: string;
}

/**
 * @category Order Management
 * @summary Request to terminate an order
 * @description Data required to terminate an active order
 * @interface OrderTerminateRequest
 */
export interface OrderTerminateRequest {
  reference_id: string;
  reason?: string;
}

/**
 * @category Order Management
 * @summary Response from order termination
 * @description Contains details about a terminated order
 * @interface OrderTerminateResponse
 */
export interface OrderTerminateResponse {
  code?: number;
  message?: string;
  reference_id?: string;
  status?: string;
  terminated_at?: string;
  reason?: string;
}

// VALIDATION TYPES
// Summary: Types for validation utility functions
// Description: Input and output types for GSM number and installment validation

/**
 * @category Validation
 * @summary GSM number validation result
 * @description Contains the validation result and cleaned phone number
 * @interface GsmValidationResult
 */
export interface GsmValidationResult {
  isValid: boolean;
  cleanedNumber?: string;
  error?: string;
  originalNumber: string;
}

/**
 * @category Validation
 * @summary Installments validation result
 * @description Contains the validation result for installment values
 * @interface InstallmentsValidationResult
 */
export interface InstallmentsValidationResult {
  isValid: boolean;
  validatedInstallments: number[];
  error?: string;
  originalInput: string | number | number[];
}

// SUBSCRIPTION TYPES
export interface SubscriptionGetRequest {
  external_reference_id?: string;
  reference_id?: string;
}

export interface SubscriptionCancelRequest {
  external_reference_id?: string;
  reference_id?: string;
}

export interface CancelSubscriptionResponse {
  code?: number;
  message?: string;
}

export interface SubscriptionBilling {
  address?: string;
  city?: string;
  contact_name?: string;
  country?: string;
  vat_number?: string;
  zip_code?: string;
}

export interface SubscriptionUser {
  address?: string;
  city?: string;
  country?: string;
  email?: string;
  first_name?: string;
  id?: string;
  identity_number?: string;
  last_name?: string;
  phone?: string;
  zip_code?: string;
}

export interface SubscriptionCreateRequest {
  amount?: number;
  billing?: SubscriptionBilling;
  card_id?: string;
  currency?: string;
  cycle?: number;
  external_reference_id?: string;
  failure_url?: string;
  payment_date?: number;
  period?: number;
  success_url?: string;
  title?: string;
  user?: SubscriptionUser;
  price_option?: SubscriptionPriceOption;
}

export interface SubscriptionPriceOption {
  count: number;
  price: number;
}

export interface SubscriptionRedirectRequest {
  subscription_id?: string;
}

export interface SubscriptionOrder {
  amount?: string;
  currency?: string;
  payment_date?: string;
  payment_url?: string;
  reference_id?: string;
  status?: string;
}

export interface SubscriptionDetail {
  amount?: string;
  currency?: string;
  due_date?: string;
  external_reference_id?: string;
  is_active?: boolean;
  orders?: SubscriptionOrder[];
  payment_date?: number;
  payment_status?: string;
  period?: number;
  title?: string;
}

export interface SubscriptionListItem {
  amount?: string;
  currency?: string;
  external_reference_id?: string;
  is_active?: boolean;
  payment_date?: number;
  payment_status?: string;
  period?: number;
  reference_id?: string;
  title?: string;
}

export interface ListSubscriptionsResponse {
  page?: number;
  per_page?: number;
  rows?: SubscriptionListItem[];
  total?: number;
  total_pages?: number;
}

export interface SubscriptionCreateResponse {
  code?: number;
  message?: string;
  order_reference_id?: string;
  reference_id?: string;
}

export interface SubscriptionRedirectResponse {
  url?: string;
}

export interface OrganizationSettings {
  ttl?: number;
  retry_count?: number;
  allow_payment?: boolean;
  session_ttl?: number;
  custom_checkout?: boolean;
  domain_address?: string;
  checkout_domain?: string;
  subscription_domain?: string;
}

export interface OrderTransaction {
  amount?: string;
  amount_float?: number;
  currency?: string;
  date?: string;
  id?: string;
  receiver?: string;
  reference_id?: string;
  sender?: string;
  status?: string;
  [key: string]: unknown;
}

export interface GetOrderTransactionsResponse {
  orderTX?: OrderTransaction[];
}

export interface OrderSubmerchant {
  acquirer?: string;
  email?: string;
  id?: string;
  labels?: string;
  name?: string;
  status?: string;
  submerchant_key?: string;
  submerchant_type?: string;
  [key: string]: unknown;
}

export interface GetOrderSubmerchantsResponse {
  page?: number;
  per_page?: number;
  row?: OrderSubmerchant[];
  total?: number;
  total_pages?: number;
}

/**
 * @category Order Management
 * @summary Request for order accounting
 * @description Data required to process accounting for an order
 * @interface OrderAccountingRequest
 */
export interface OrderAccountingRequest {
  order_reference_id: string;
}

/**
 * @category Order Management
 * @summary Response for order accounting
 * @description API response payload returned after order accounting operation
 * @interface OrderAccountingResponse
 */
export interface OrderAccountingResponse {
  code?: number;
  message?: string;
}

/**
 * @category Order Management
 * @summary Request to add an item to the basket
 * @description Data required to add a new item to an existing order basket
 * @interface AddBasketItemRequest
 */
export interface AddBasketItemRequest {
  order_reference_id: string;
  basket_item: BasketItemDTO;
}

/**
 * @category Order Management
 * @summary Request to remove an item from the basket
 * @description Data required to remove an item from an existing order basket
 * @interface RemoveBasketItemRequest
 */
export interface RemoveBasketItemRequest {
  order_reference_id: string;
  basket_item_id: string;
}

/**
 * @category Order Management
 * @summary Request to update a basket item
 * @description Data required to update an existing item in an order basket
 * @interface UpdateBasketItemRequest
 */
export interface UpdateBasketItemRequest {
  order_reference_id: string;
  basket_item: BasketItemDTO;
}

export interface AddBasketItemResponse {
  code?: number;
  message?: string;
}

export interface RemoveBasketItemResponse {
  code?: number;
  message?: string;
}

export interface UpdateBasketItemResponse {
  code?: number;
  message?: string;
}

export interface OrderManualCallbackRequest {
  conversation_id?: string;
  reference_id: string;
}

export interface OrderManualCallbackResponse {
  code?: number;
  message?: string;
}

export interface OrderRelatedUpdateRequest {
  reference_id: string;
  related_reference_id: string;
}

export interface OrderRelatedUpdateResponse {
  code?: number;
  is_success?: boolean;
  message?: string;
}

/**
 * @category Organization
 * @summary Webhook callback URL configuration
 * @description Configuration for various webhook callback endpoints
 * @interface CallbackURLDTO
 */
export interface CallbackURLDTO {
  callback_url?: string;
  cancel_callback_url?: string;
  fail_callback_url?: string;
  refund_callback_url?: string;
}

/**
 * @category Organization
 * @summary Organization business types
 * @enum {number}
 */
export enum BusinessType {
  INDIVIDUAL = 0,
  CORPORATE = 1,
}

/**
 * @category Organization
 * @summary Request to create a business entity
 * @description Comprehensive data for creating a new business entity in an organization
 * @interface OrgCreateBusinessRequest
 */
export interface OrgCreateBusinessRequest {
  address: string;
  business_name: string;
  business_type: BusinessType;
  email: string;
  first_name: string;
  identity_number: string;
  last_name: string;
  phone: string;
  tax_number: string;
  tax_office: string;
  zip_code: string;
}

export interface OrgCreateBusinessResponse {
  code?: number;
  message?: string;
}

export interface OrganizationResponse {
  message?: string;
}

export interface OrganizationCurrency {
  code?: string;
  currency_unit?: string;
  id?: string;
  name?: string;
  symbol?: string;
}

export interface GetOrganizationCurrenciesResponse {
  currencies?: OrganizationCurrency[];
}

export interface UserLimit {
  currency?: string;
  id?: string;
  max_daily_transaction_amount?: number;
  max_daily_transaction_count?: number;
  max_expense_amount?: number;
  max_income_amount?: number;
  max_monthly_transaction_amount?: number;
  max_monthly_transaction_count?: number;
  max_topup_amount?: number;
  max_wallet_balance?: number;
  max_withdrawal_amount?: number;
}

export interface GetUserLimitResponse {
  user_limits?: UserLimit[];
}

/**
 * @category Organization
 * @summary Request for user limit information
 * @description Data required to fetch limits for a specific user
 * @interface GetUserLimitRequest
 */
export interface GetUserLimitRequest {
  user_id: string;
  [key: string]: unknown;
}

/**
 * @category Organization
 * @summary Request to set user limits
 * @description Data required to set a specific limit for a user
 * @interface SetLimitUserRequest
 */
export interface SetLimitUserRequest {
  limit_id: string;
  user_id: string;
}

export interface SetLimitUserResponse {
  code?: number;
  message?: string;
}

export interface OrganizationLimit extends UserLimit {
  name?: string;
}

export interface GetOrganizationLimitsResponse {
  limits?: OrganizationLimit[];
}

export interface GetMetaResponse {
  data?: string;
}

export interface OrganizationScope {
  create?: boolean;
  delete?: boolean;
  entity?: string;
  read?: boolean;
  update?: boolean;
}

export interface GetOrganizationScopesResponse {
  scopes?: OrganizationScope[];
}

export interface GetSuborganizationsRequest {
  page?: number;
  per_page?: number;
}

export interface OrganizationSuborganization {
  id?: string;
  name?: string;
}

export interface GetSubOrganizationListResponse {
  page?: number;
  per_page?: number;
  rows?: OrganizationSuborganization[];
  total?: number;
  total_pages?: number;
}

/**
 * @category Organization
 * @summary Request for VPOS list
 * @description Parameters for filtering and retrieving virtual POS terminals
 * @interface GetVposRequest
 */
export interface GetVposRequest {
  currency_id: string;
  [key: string]: unknown;
}

export interface OrganizationVpos {
  id?: string;
  name?: string;
}

export interface GetVposResponse {
  organization_vpos?: OrganizationVpos[];
}

/**
 * @category Organization
 * @summary Request to create an organization user
 * @description Comprehensive data for creating a new user within an organization
 * @interface OrgCreateUserRequest
 */
export interface OrgCreateUserRequest {
  conversation_id: string;
  email: string;
  first_name: string;
  identity_number: string;
  is_mail_verified: boolean;
  last_name: string;
  phone: string;
  reference_id: string;
}

export interface OrgCreateUserResponse {
  code?: number;
  message?: string;
  user_id?: string;
}

export type OrgCreateUserReq = OrgCreateUserRequest;
export type OrgCreateUserRes = OrgCreateUserResponse;

/**
 * @category Organization
 * @summary Request to verify a user
 * @description Data required to verify a user's account
 * @interface OrgUserVerifyRequest
 */
export interface OrgUserVerifyRequest {
  user_id: string;
}

export interface OrgUserVerifyResponse {
  code?: number;
  message?: string;
}

export type OrgUserVerifyReq = OrgUserVerifyRequest;
export type OrgUserVerifyRes = OrgUserVerifyResponse;

/**
 * @category Organization
 * @summary Request to verify user's mobile number
 * @description Data required to initiate or complete mobile number verification
 * @interface OrgUserMobileVerifyRequest
 */
export interface OrgUserMobileVerifyRequest {
  user_id: string;
}

export interface OrgUserMobileVerifyResponse {
  code?: number;
  message?: string;
}

export type OrgUserMobileVerifyReq = OrgUserMobileVerifyRequest;
export type OrgUserMobileVerifyRes = OrgUserMobileVerifyResponse;

/**
 * @category Order Management
 * @summary Request for order post-authorization
 * @description Data required to process post-authorization for an order
 * @interface OrderPostAuthRequest
 */
export interface OrderPostAuthRequest {
  amount: number;
  reference_id: string;
}

/**
 * @category Order Management
 * @summary Response for order post-authorization
 * @description API response payload returned after post-authorization operation
 * @interface OrderPostAuthResponse
 */
export interface OrderPostAuthResponse {
  code?: number;
  is_success?: boolean;
  message?: string;
}
