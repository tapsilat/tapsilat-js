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
  address: string;
  city: string;
  contact_name: string;
  country: string;
  zip_code: string;
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
  billing_type: "PERSONAL" | "CORPORATE";
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
  id: string;
  name: string;
  category1: string;
  category2?: string;
  item_type: string;
  price: number;
  quantity: number;
  coupon_discount?: number;
  data?: string;
  quantity_unit?: string;
}

/**
 * @category Payment Processing
 * @summary Available payment options for customers
 * @description Different payment methods that can be enabled for an order
 * @typedef {string} PaymentOption
 */
export type PaymentOption =
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
  email: string;
  gsm_number?: string;
  identity_number?: string;
  registration_address?: string;
  city?: string;
  country?: string;
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
export interface OrderCreateRequest {
  amount: number;
  tax_amount?: number;
  locale: Locale;
  three_d_force?: boolean;
  currency: Currency;
  shipping_address?: Address;
  basket_items: BasketItem[];
  billing_address: BillingAddress;
  buyer: Buyer;
  conversation_id?: string;
  partial_payment?: boolean;
  payment_methods?: boolean;
  payment_options?: PaymentOption[];
  payment_success_url?: string;
  payment_failure_url?: string;
  enabled_installments?: number[];
  metadata?: Record<string, unknown>;
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
  order_id: string;
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
 * @category Refunds
 * @summary Refund request information for an order
 * @description Contains the data needed to process a refund for a specific order
 * @interface OrderRefundRequest
 */
export interface OrderRefundRequest {
  reference_id: string;
  amount: number;
  // Python SDK'da reason yok, gerekirse eklenebilir.
}

/**
 * @category Refunds
 * @summary Response data after processing a refund request
 * @description Contains information about the processed refund including status and amount
 * @interface OrderRefundResponse
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
 * @category Order Management
 * @summary Order status information
 * @description Provides the current status of an order and when it was last updated
 * @interface OrderStatusResponse
 */
export interface OrderStatusResponse {
  referenceId: string;
  status: string; // e.g., 'CREATED', 'PENDING_PAYMENT', 'COMPLETED', 'CANCELLED'
  lastUpdatedAt: string;
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
  org_id?: string;
  postal_code?: string;
  submerchant_nin?: string;
  submerchant_url?: string;
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
 * @category API DTOs
 * @summary Comprehensive order creation request
 * @description Full API request structure for creating an order with all possible options
 * @interface OrderCreateDTO
 */
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

/**
 * @category Payment Terms
 * @summary Request data for deleting a payment term
 * @description Contains the identifier needed to delete a specific payment term
 * @interface PaymentTermDeleteRequest
 */
export interface PaymentTermDeleteRequest {
  term_reference_id: string;
}

/**
 * @category Payment Terms
 * @summary Response from payment term refund operation
 * @description Contains details about a processed payment term refund
 * @interface PaymentTermRefundResponse
 */
export interface PaymentTermRefundResponse {
  refund_id: string;
  term_reference_id: string;
  amount: number;
  status: string;
  created_at: string;
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
  reference_id: string;
  status: string;
  terminated_at: string;
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
  id: string;
  date: string;
  amount: number;
  type: string;
  status: string;
  [key: string]: unknown;
}

export interface OrderSubmerchant {
  id: string;
  name: string;
  [key: string]: unknown;
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
 * @summary Request for order post-authorization
 * @description Data required to process post-authorization for an order
 * @interface OrderPostAuthRequest
 */
export interface OrderPostAuthRequest {
  amount: number;
  reference_id: string;
}
