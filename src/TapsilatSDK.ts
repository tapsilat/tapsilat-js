import { HttpClient } from "./http/HttpClient";
import { ConfigManager } from "./config/ConfigManager";
import {
  validateBearerToken,
  isNonEmptyString,
  isPositiveNumber,
  hasValidDecimalPlaces,
  isInteger,
  isValidEmail,
} from "./utils/validators";
import {
  TapsilatConfig,
  PaginatedResponse,
  Order,
  OrderRefundRequest,
  OrderRefundResponse,
  OrderStatusResponse,
  OrderPaymentDetail,
  OrderCreateRequest,
  OrderCreateResponse,
  OrderPaymentTermCreateDTO,
  OrderPaymentTermUpdateDTO,
  OrderTermRefundRequest,
  PaymentTermResponse,
  PaymentTermDeleteRequest,
  PaymentTermRefundResponse,
  PaymentTermTerminateRequest,
  OrderTerminateRequest,
  OrderTerminateResponse,
} from "./types/index";
import { TapsilatValidationError, TapsilatError } from "./errors/TapsilatError";
import { handleError, handleResponse } from "./utils/response";
import { verifyHmacSignature } from "./utils/verify";

/**
 * Main SDK class for Tapsilat payment operations
 *
 * @summary Enterprise-grade TypeScript SDK for Tapsilat Payment Processing Platform
 * @description
 * The TapsilatSDK class provides a comprehensive interface for integrating with the Tapsilat payment platform.
 * It offers secure, efficient, and type-safe methods for managing orders, payments, refunds, and other
 * payment-related operations. The SDK includes built-in error handling, request validation, retry logic,
 * and comprehensive logging capabilities.
 *
 * Key features:
 * - Type-safe API with TypeScript support
 * - Built-in error handling with custom error types
 * - Automatic request/response validation
 * - Configurable retry mechanism
 * - Full compliance with Tapsilat API specifications
 */
export class TapsilatSDK {
  private readonly httpClient: HttpClient;
  private readonly configManager: ConfigManager;

  // SDK INITIALIZATION
  // Summary: Initializes the Tapsilat SDK with configuration options
  // Description: Creates and configures a new instance of the TapsilatSDK with the provided configuration
  /**
   * Creates a new TapsilatSDK instance
   *
   * @summary Initializes the Tapsilat SDK with configuration options
   * @description
   * Creates and configures a new instance of the TapsilatSDK with the provided configuration.
   * The constructor validates the bearer token, sets up the HTTP client with proper headers,
   * configures retry mechanisms, and initializes internal state for API communication.
   *
   * The SDK instance is immutable after creation - configuration cannot be changed without
   * creating a new instance. This ensures thread safety and predictable behavior.
   *
   * @param {TapsilatConfig} config - SDK configuration options
   * @param {string} config.bearerToken - API authentication token (required)
   * @param {string} [config.baseURL='https://api.tapsilat.com/v1'] - API base URL
   * @param {number} [config.timeout=30000] - Request timeout in milliseconds
   * @param {number} [config.maxRetries=3] - Maximum number of retry attempts
   * @param {number} [config.retryDelay=1000] - Delay between retries in milliseconds
   * @param {string} [config.version='v1'] - API version to use
   * @param {boolean} [config.debug=false] - Enable debug logging
   *
   * @throws {TapsilatValidationError} When bearer token is invalid, missing, or malformed
   * @throws {TypeError} When config parameter is not an object or missing required fields
   */
  constructor(config: TapsilatConfig) {
    validateBearerToken(config.bearerToken);
    this.configManager = new ConfigManager(config);
    this.httpClient = new HttpClient(this.configManager.getInternalConfig());
  }

  // ORDER CREATION
  // Summary: Create new payment order and get checkout URL
  // Description: Initiates payment process with buyer info and returns secure checkout URL
  /**
   * Creates a new order and returns a checkout URL
   *
   * @summary Initiates a new payment order with buyer information and generates checkout URL
   * @description
   * Creates a new payment order in the Tapsilat system with the provided order details.
   * This method performs comprehensive validation of all input parameters, creates the order
   * on the payment platform, and returns a checkout URL that customers can use to complete
   * their payment. The method supports multiple currencies, locales, and comprehensive
   * buyer information for compliance and fraud prevention.
   *
   * The returned checkout URL is valid for a limited time (typically 24 hours) and should
   * be presented to the customer immediately. The order status can be tracked using the
   * returned reference ID through the getOrderStatus method.
   *
   * @param {OrderCreateRequest} orderRequest - Complete order information
   * @param {number} orderRequest.amount - Payment amount (must be positive, max 2 decimal places)
   * @param {Currency} orderRequest.currency - Payment currency ('TRY', 'USD', 'EUR', 'GBP')
   * @param {Locale} orderRequest.locale - Display language ('tr' for Turkish, 'en' for English)
   * @param {Buyer} orderRequest.buyer - Customer information for payment processing
   * @param {string} orderRequest.buyer.name - Customer's first name (required)
   * @param {string} orderRequest.buyer.surname - Customer's last name (required)
   * @param {string} orderRequest.buyer.email - Customer's email address (required, validated)
   * @param {string} [orderRequest.buyer.phone] - Customer's phone number
   * @param {string} [orderRequest.buyer.identityNumber] - National ID or tax number
   * @param {Address} [orderRequest.buyer.shippingAddress] - Shipping address for physical goods
   * @param {Address} [orderRequest.buyer.billingAddress] - Billing address for invoicing
   * @param {string} [orderRequest.description] - Order description for customer reference
   * @param {string} [orderRequest.callbackUrl] - URL to redirect after payment completion
   * @param {string} [orderRequest.conversationId] - Custom tracking ID for your system
   * @param {Record<string, unknown>} [orderRequest.metadata] - Additional custom data
   *
   * @returns {Promise<OrderCreateResponse>} Promise resolving to order creation response
   * @returns {string} OrderCreateResponse.referenceId - Unique order identifier for tracking
   * @returns {string} OrderCreateResponse.conversationId - Echo of provided conversation ID
   * @returns {string} OrderCreateResponse.checkoutUrl - Payment page URL for customer
   * @returns {string} OrderCreateResponse.status - Initial order status (typically 'CREATED')
   * @returns {string} [OrderCreateResponse.qrCodeUrl] - QR code URL for mobile payments
   *
   * @throws {TapsilatValidationError} When input validation fails:
   *   - Amount is not positive or has more than 2 decimal places
   *   - Currency is not supported
   *   - Buyer information is incomplete or invalid
   *   - Email format is invalid
   *   - Required fields are missing
   * @throws {TapsilatNetworkError} When network request fails:
   *   - Connection timeout
   *   - DNS resolution failure
   *   - Network connectivity issues
   * @throws {TapsilatError} When API returns business logic errors:
   *   - Insufficient merchant balance
   *   - Currency not enabled for merchant
   *   - Buyer blocked due to fraud detection
   *   - Rate limiting exceeded
   */
  async createOrder(
    orderRequest: OrderCreateRequest
  ): Promise<OrderCreateResponse> {
    // Validate the order request directly
    // Check if request is null/undefined
    if (!orderRequest) {
      throw new TapsilatValidationError(
        "Order request cannot be null or undefined"
      );
    }

    // Validate amount - check if positive
    if (!isPositiveNumber(orderRequest.amount)) {
      throw new TapsilatValidationError("Amount must be a positive number", {
        provided: orderRequest.amount,
      });
    }

    // Validate amount - check decimal places
    if (!hasValidDecimalPlaces(orderRequest.amount)) {
      throw new TapsilatValidationError(
        "Amount must have maximum 2 decimal places",
        { provided: orderRequest.amount }
      );
    }

    // Validate currency
    if (!isNonEmptyString(orderRequest.currency)) {
      throw new TapsilatValidationError(
        "Currency is required and must be a non-empty string",
        { provided: orderRequest.currency }
      );
    }

    // Validate buyer information
    if (!orderRequest.buyer) {
      throw new TapsilatValidationError("Buyer information is required");
    }

    const { buyer } = orderRequest;

    if (!isNonEmptyString(buyer.name)) {
      throw new TapsilatValidationError(
        "Buyer name is required and must be a non-empty string",
        { provided: buyer.name }
      );
    }

    if (!isNonEmptyString(buyer.surname)) {
      throw new TapsilatValidationError(
        "Buyer surname is required and must be a non-empty string",
        { provided: buyer.surname }
      );
    }

    // Validate buyer email - check if provided
    if (!isNonEmptyString(buyer.email)) {
      throw new TapsilatValidationError(
        "Buyer email is required and must be a non-empty string",
        { provided: buyer.email }
      );
    }

    // Validate buyer email - check format
    if (!isValidEmail(buyer.email)) {
      throw new TapsilatValidationError(
        "Buyer email must be a valid email address",
        { provided: buyer.email }
      );
    }

    try {
      // Make the API request
      const createOrderResponse =
        await this.httpClient.post<OrderCreateResponse>(
          "/order/create",
          orderRequest
        );

      // Use our generic response handler
      return handleResponse(createOrderResponse, "Order creation");
    } catch (error) {
      // Use our generic error handler
      return handleError(error, "order creation");
    }
  }

  // ORDER RETRIEVAL BY REFERENCE ID
  // Summary: Get complete order details and information
  // Description: Retrieves full order data including buyer info, amounts, and current status
  /**
   * Gets an order by reference ID.
   *
   * @summary Retrieve complete order details and information
   * @description Gets complete order data including buyer info, amounts, and current status using the unique reference ID.
   *
   * @param referenceId - The unique reference ID of the order
   * @returns Promise resolving to the complete order details
   * @throws {TapsilatValidationError} When referenceId is invalid
   * @throws {TapsilatNetworkError} When API request fails due to network issues
   * @throws {TapsilatError} When API returns an error response
   */
  async getOrder(referenceId: string): Promise<Order> {
    // Validate input
    if (!isNonEmptyString(referenceId)) {
      throw new TapsilatValidationError(
        "Order referenceId is required and must be a non-empty string",
        { provided: referenceId }
      );
    }

    try {
      // Make the API request
      const getOrderResponse = await this.httpClient.get<Order>(
        `/order/${referenceId}`
      );

      // Use our generic response handler
      return handleResponse(getOrderResponse, "Order retrieval");
    } catch (error) {
      // Use our generic error handler
      return handleError(error, "order retrieval");
    }
  }

  // ORDER LISTING WITH PAGINATION
  // Summary: Retrieve paginated list of merchant orders
  // Description: Gets orders with pagination support, filtering, and sorting options
  /**
   * Lists orders with pagination support.
   *
   * @summary Retrieve paginated list of merchant orders
   * @description Gets orders with pagination support, filtering, and sorting options.
   *
   * @param params - Optional pagination parameters (page number and items per page)
   * @returns Promise resolving to paginated list of orders
   * @throws {TapsilatNetworkError} When API request fails due to network issues
   * @throws {TapsilatError} When API returns an error response
   */
  async getOrders(
    params: { page?: number; per_page?: number } = {}
  ): Promise<PaginatedResponse<Order>> {
    try {
      // Validate pagination parameters if provided
      // Check if page is defined
      if (params.page !== undefined) {
        // Check if page is integer
        if (!isInteger(params.page)) {
          throw new TapsilatValidationError("Page number must be an integer", {
            provided: params.page,
          });
        }

        // Check if page is positive
        if (params.page < 1) {
          throw new TapsilatValidationError(
            "Page number must be greater than 0",
            { provided: params.page }
          );
        }
      }

      // Check if per_page is defined
      if (params.per_page !== undefined) {
        // Check if per_page is integer
        if (!isInteger(params.per_page)) {
          throw new TapsilatValidationError(
            "Items per page must be an integer",
            { provided: params.per_page }
          );
        }

        // Check if per_page is positive
        if (params.per_page < 1) {
          throw new TapsilatValidationError(
            "Items per page must be greater than 0",
            { provided: params.per_page }
          );
        }
      }

      // Make the API request
      const getOrdersResponse = await this.httpClient.get<
        PaginatedResponse<Order>
      >("/order/list", { params: params });

      // Use our generic response handler
      return handleResponse(getOrdersResponse, "Order listing");
    } catch (error) {
      // Use our generic error handler
      return handleError(error, "order listing");
    }
  }

  // ORDER CANCELLATION
  // Summary: Cancel a pending order before payment completion
  // Description: Cancels unpaid order and prevents further payment processing
  /**
   * Cancels an order by reference_id.
   *
   * @summary Cancel a pending order before payment completion
   * @description Cancels unpaid order and prevents further payment processing.
   *
   * @param referenceId - The unique reference ID of the order to cancel
   * @returns Promise resolving to the canceled order details
   * @throws {TapsilatValidationError} When referenceId is invalid
   * @throws {TapsilatError} When API returns an error response or order cannot be canceled
   */
  async cancelOrder(referenceId: string): Promise<Order> {
    // Validate referenceId
    if (!isNonEmptyString(referenceId)) {
      throw new TapsilatValidationError(
        "Order referenceId is required and must be a non-empty string",
        { provided: referenceId }
      );
    }

    const cancelOrderResponse = await this.httpClient.post<Order>(
      "/order/cancel",
      {
        reference_id: referenceId,
      }
    );

    // Check if API call was successful
    if (!cancelOrderResponse.success) {
      throw new TapsilatError(
        cancelOrderResponse.error?.message ||
          "Order cancellation API call failed",
        cancelOrderResponse.error?.code || "CANCELLATION_API_FAILED"
      );
    }

    // Check if response data exists
    if (!cancelOrderResponse.data) {
      throw new TapsilatError(
        "Order cancellation response data is missing",
        "CANCELLATION_DATA_MISSING"
      );
    }

    return cancelOrderResponse.data;
  }

  // ORDER STATUS RETRIEVAL
  // Summary: Retrieves real-time payment status and tracking information for a specific order
  // Description: Queries the payment platform to retrieve current status of an order using its reference ID
  /**
   * Gets the current status of an order by reference ID
   *
   * @summary Retrieves real-time payment status and tracking information for a specific order
   * @description
   * Queries the Tapsilat payment platform to retrieve the current status of an order using its
   * unique reference ID. This method provides real-time information about payment progress,
   * completion status, and last update timestamp. It's essential for tracking payment flow
   * and implementing proper order state management in your application.
   *
   * The status information includes payment state (CREATED, PENDING_PAYMENT, COMPLETED, CANCELLED),
   * last update timestamp, and any relevant status metadata. This method should be used to:
   * - Check if a payment has been completed after redirecting from checkout
   * - Monitor payment status for pending transactions
   * - Verify order state before fulfilling goods/services
   * - Implement webhook verification and status synchronization
   *
   * @param {string} referenceId - Unique order reference identifier from order creation
   *
   * @returns {Promise<OrderStatusResponse>} Promise resolving to current order status information
   * @returns {string} OrderStatusResponse.referenceId - Echo of the provided reference ID
   * @returns {string} OrderStatusResponse.status - Current payment status (CREATED, PENDING_PAYMENT, COMPLETED, CANCELLED, FAILED)
   * @returns {string} OrderStatusResponse.lastUpdatedAt - ISO 8601 timestamp of last status change
   *
   * @throws {TapsilatValidationError} When input validation fails:
   *   - Reference ID is null, undefined, or empty string
   *   - Reference ID format is invalid (should match order ID pattern)
   * @throws {TapsilatNetworkError} When network request fails:
   *   - Connection timeout during status check
   *   - DNS resolution failure
   *   - Network connectivity issues
   * @throws {TapsilatError} When API returns business logic errors:
   *   - ORDER_NOT_FOUND: Order with given reference ID doesn't exist
   *   - ACCESS_DENIED: Order belongs to different merchant
   *   - RATE_LIMIT_EXCEEDED: Too many status check requests
   */
  async getOrderStatus(referenceId: string): Promise<OrderStatusResponse> {
    // Validate input using proper validation
    if (!isNonEmptyString(referenceId)) {
      throw new TapsilatValidationError(
        "Order referenceId is required and must be a non-empty string",
        { provided: referenceId }
      );
    }

    try {
      // Make the API request
      const getOrderStatusResponse =
        await this.httpClient.get<OrderStatusResponse>(
          `/order/${referenceId}/status`
        );

      // Use our generic response handler
      return handleResponse(getOrderStatusResponse, "Order status retrieval");
    } catch (error) {
      // Use our generic error handler
      return handleError(error, "order status retrieval");
    }
  }

  // ORDER REFUND OPERATIONS
  // Summary: Process partial refund for a completed order
  // Description: Refunds specified amount from a paid order and returns transaction details
  /**
   * Partially refunds an order.
   * Based on `refund_order` from the Python SDK.
   *
   * @summary Process partial refund for a completed order
   * @description Refunds specified amount from a paid order and returns transaction details.
   *
   * @param refundData - The refund details, including referenceId and amount.
   * @returns Promise resolving to the refund transaction details.
   * @throws {TapsilatError} When API returns an error response or refund fails
   */
  async refundOrder(
    refundData: OrderRefundRequest
  ): Promise<OrderRefundResponse> {
    const refundOrderResponse = await this.httpClient.post<OrderRefundResponse>(
      "/order/refund",
      refundData
    );

    if (!refundOrderResponse.success) {
      throw new TapsilatError(
        refundOrderResponse.error?.message || "Order refund failed",
        refundOrderResponse.error?.code || "REFUND_FAILED"
      );
    }

    if (!refundOrderResponse.data) {
      throw new TapsilatError(
        "Order refund response data is missing",
        "REFUND_DATA_MISSING"
      );
    }

    return refundOrderResponse.data;
  }

  // ORDER FULL REFUND OPERATIONS
  // Summary: Process full refund for a completed order
  // Description: Refunds entire order amount and returns transaction details
  /**
   * Fully refunds an order by its reference ID.
   * Based on `refund_all_order` from the Python SDK.
   *
   * @summary Process full refund for a completed order
   * @description Refunds entire order amount and returns transaction details.
   *
   * @param referenceId - The unique identifier of the order to fully refund.
   * @returns Promise resolving to the refund transaction details.
   * @throws {TapsilatError} When API returns an error response or full refund fails
   */
  async refundAllOrder(referenceId: string): Promise<OrderRefundResponse> {
    const refundAllOrderResponse =
      await this.httpClient.post<OrderRefundResponse>("/order/refund-all", {
        reference_id: referenceId,
      });

    if (!refundAllOrderResponse.success) {
      throw new TapsilatError(
        refundAllOrderResponse.error?.message || "Full order refund failed",
        refundAllOrderResponse.error?.code || "FULL_REFUND_FAILED"
      );
    }

    if (!refundAllOrderResponse.data) {
      throw new TapsilatError(
        "Full order refund response data is missing",
        "FULL_REFUND_DATA_MISSING"
      );
    }

    return refundAllOrderResponse.data;
  }

  // ORDER PAYMENT DETAILS
  // Summary: Retrieve detailed payment transaction information for an order
  // Description: Gets payment method, amount, status, and card info for order transactions
  /**
   * Retrieves the payment details for an order.
   * Based on `get_order_payment_details` from the Python SDK.
   *
   * @summary Retrieve detailed payment transaction information for an order
   * @description Gets payment method, amount, status, and card info for order transactions.
   *
   * @param referenceId - The unique identifier of the order.
   * @param conversationId - Optional conversation ID for more specific querying.
   * @returns Promise resolving to a list of payment details.
   * @throws {TapsilatValidationError} When referenceId is invalid
   * @throws {TapsilatError} When API returns an error response or payment details are missing
   */
  async getOrderPaymentDetails(
    referenceId: string,
    conversationId?: string
  ): Promise<OrderPaymentDetail[]> {
    if (!isNonEmptyString(referenceId))
      throw new TapsilatValidationError(
        "Reference ID is required and must be a non-empty string"
      );

    const getOrderPaymentDetailsResponse = conversationId
      ? await this.httpClient.post<OrderPaymentDetail[]>(
          "/order/payment-details",
          {
            conversation_id: conversationId,
          }
        )
      : await this.httpClient.get<OrderPaymentDetail[]>(
          `/order/${referenceId}/payment-details`
        );

    if (!getOrderPaymentDetailsResponse.success)
      throw new TapsilatError(
        getOrderPaymentDetailsResponse.error?.message ||
          "Payment details API call failed",
        getOrderPaymentDetailsResponse.error?.code ||
          "PAYMENT_DETAILS_API_FAILED"
      );

    if (!getOrderPaymentDetailsResponse.data)
      throw new TapsilatError(
        "Payment details response data is missing",
        "PAYMENT_DETAILS_DATA_MISSING"
      );

    return getOrderPaymentDetailsResponse.data;
  }

  // ORDER LOOKUP BY CONVERSATION ID
  // Summary: Find order using conversation ID instead of reference ID
  // Description: Alternative lookup method for orders using custom conversation identifier
  /**
   * Gets an order by conversation_id.
   * Based on `get_order_by_conversation_id` from the Python SDK.
   *
   * @summary Find order using conversation ID instead of reference ID
   * @description Alternative lookup method for orders using custom conversation identifier.
   *
   * @param conversationId - The custom conversation identifier used when creating the order
   * @returns Promise resolving to the complete order details
   * @throws {TapsilatValidationError} When conversationId is invalid
   * @throws {TapsilatError} When API returns an error response
   */
  async getOrderByConversationId(conversationId: string): Promise<Order> {
    // Validate conversationId
    if (!isNonEmptyString(conversationId)) {
      throw new TapsilatValidationError(
        "Order conversationId is required and must be a non-empty string",
        { provided: conversationId }
      );
    }

    const getOrderByConversationIdResponse = await this.httpClient.get<Order>(
      `/order/conversation/${conversationId}`
    );

    if (!getOrderByConversationIdResponse.success)
      throw new TapsilatError(
        getOrderByConversationIdResponse.error?.message ||
          "Order retrieval by conversation ID failed",
        getOrderByConversationIdResponse.error?.code || "ORDER_RETRIEVAL_FAILED"
      );

    if (!getOrderByConversationIdResponse.data)
      throw new TapsilatError(
        "Order response data is missing",
        "ORDER_DATA_MISSING"
      );

    return getOrderByConversationIdResponse.data;
  }

  // ORDER TRANSACTION HISTORY
  // Summary: Retrieve transaction history for an order
  // Description: Gets detailed transaction records and payment attempts for a specific order
  /**
   * Gets order transactions by reference_id.
   * Based on `get_order_transactions` from the Python SDK.
   *
   * @summary Retrieve transaction history for an order
   * @description Gets detailed transaction records and payment attempts for a specific order.
   *
   * @param referenceId - The unique reference ID of the order
   * @returns Promise resolving to array of transaction records
   * @throws {TapsilatValidationError} When referenceId is invalid
   * @throws {TapsilatError} When API returns an error response
   */
  async getOrderTransactions(referenceId: string): Promise<any[]> {
    // Validate referenceId
    if (!isNonEmptyString(referenceId)) {
      throw new TapsilatValidationError(
        "Order referenceId is required and must be a non-empty string",
        { provided: referenceId }
      );
    }
    const getOrderTransactionsResponse = await this.httpClient.get<any[]>(
      `/order/${referenceId}/transactions`
    );

    if (!getOrderTransactionsResponse.success)
      throw new TapsilatError(
        getOrderTransactionsResponse.error?.message ||
          "Order transactions retrieval failed",
        getOrderTransactionsResponse.error?.code ||
          "TRANSACTIONS_RETRIEVAL_FAILED"
      );
    if (!getOrderTransactionsResponse.data)
      throw new TapsilatError(
        "Order transactions response data is missing",
        "TRANSACTIONS_DATA_MISSING"
      );

    return getOrderTransactionsResponse.data;
  }

  // ORDER SUBMERCHANT LISTING
  // Summary: Retrieve paginated list of submerchants for orders
  // Description: Gets submerchant information with pagination support for order management
  /**
   * Gets order submerchants with pagination.
   * Based on `get_order_submerchants` from the Python SDK.
   *
   * @summary Retrieve paginated list of submerchants for orders
   * @description Gets submerchant information with pagination support for order management.
   *
   * @param params - Optional pagination parameters (page number and items per page)
   * @returns Promise resolving to paginated list of submerchants
   * @throws {TapsilatError} When API returns an error response
   */
  async getOrderSubmerchants(
    params: { page?: number; per_page?: number } = {}
  ): Promise<any> {
    const getOrderSubmerchantsResponse = await this.httpClient.get<any>(
      "/order/submerchants",
      {
        params: params,
      }
    );

    if (!getOrderSubmerchantsResponse.success)
      throw new TapsilatError(
        getOrderSubmerchantsResponse.error?.message ||
          "Order submerchants retrieval failed",
        getOrderSubmerchantsResponse.error?.code ||
          "SUBMERCHANTS_RETRIEVAL_FAILED"
      );
    if (!getOrderSubmerchantsResponse.data)
      throw new TapsilatError(
        "Order submerchants response data is missing",
        "SUBMERCHANTS_DATA_MISSING"
      );

    return getOrderSubmerchantsResponse.data;
  }

  // ORDER CHECKOUT URL RETRIEVAL
  // Summary: Retrieve checkout URL for existing order
  // Description: Gets the payment checkout URL for an existing order using reference ID
  /**
   * Gets checkout URL for an order.
   * Based on `get_checkout_url` from the Python SDK.
   *
   * @summary Retrieve checkout URL for existing order
   * @description Gets the payment checkout URL for an existing order using reference ID.
   *
   * @param referenceId - The unique reference ID of the order
   * @returns Promise resolving to the checkout URL string
   * @throws {TapsilatError} When checkout URL is not found in order response
   */
  async getCheckoutUrl(referenceId: string): Promise<string> {
    const order = await this.getOrder(referenceId);
    if (order && (order as any).checkout_url) {
      return (order as any).checkout_url;
    }
    throw new TapsilatError(
      "Checkout URL not found in order response",
      "CHECKOUT_URL_NOT_FOUND"
    );
  }

  // WEBHOOK SIGNATURE VERIFICATION
  // Summary: Validate webhook signature for security verification
  // Description: Verifies the authenticity of webhook payloads using HMAC signature validation
  /**
   * Verifies webhook signature for security
   *
   * @summary Validate webhook signature for security verification
   * @description Verifies the authenticity of webhook payloads using HMAC signature validation.
   *
   * @param payload - Raw webhook payload string
   * @param signature - Webhook signature from headers
   * @param secret - Your webhook secret key
   * @returns Promise resolving to true if signature is valid
   * @throws {TapsilatValidationError} When input validation fails for payload, signature or secret
   */
  async verifyWebhook(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    if (!isNonEmptyString(payload))
      throw new TapsilatValidationError(
        "Webhook payload is required and must be a non-empty string"
      );
    if (!isNonEmptyString(signature))
      throw new TapsilatValidationError(
        "Webhook signature is required and must be a non-empty string"
      );
    if (!isNonEmptyString(secret))
      throw new TapsilatValidationError(
        "Webhook secret is required and must be a non-empty string"
      );

    return verifyHmacSignature(payload, signature, secret);
  }

  // API HEALTH STATUS CHECK
  // Summary: Check API service health and availability
  // Description: Verifies that the Tapsilat API service is operational and accessible
  /**
   * Checks API service health and availability
   *
   * @summary Check API service health and availability
   * @description Verifies that the Tapsilat API service is operational and accessible.
   *
   * @returns Promise resolving to service status with status string and timestamp
   * @throws {TapsilatError} When API health check fails or returns invalid data
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const healthCheckResponse = await this.httpClient.get<{
      status: string;
      timestamp: string;
    }>("/health");

    if (!healthCheckResponse.success)
      throw new TapsilatError(
        healthCheckResponse.error?.message || "Health check failed",
        healthCheckResponse.error?.code || "HEALTH_CHECK_FAILED"
      );

    if (!healthCheckResponse.data)
      throw new TapsilatError(
        "Health check response data is missing",
        "HEALTH_CHECK_DATA_MISSING"
      );

    return healthCheckResponse.data;
  }

  // CONFIGURATION MANAGEMENT
  // Summary: Access to the configuration manager for advanced configuration management
  // Description: Provides direct access to the ConfigManager instance for configuration operations
  /**
   * Gets the configuration manager instance
   *
   * @summary Access to the configuration manager for advanced configuration management
   * @description
   * Provides direct access to the ConfigManager instance for configuration operations.
   * Use this to get, update, or manage SDK configuration settings.
   *
   * @example
   * ```typescript
   * const sdk = new TapsilatSDK(config);
   * const configManager = sdk.getConfigManager();
   *
   * // Get config (without sensitive data)
   * console.log(configManager.getConfig());
   *
   * // Update config
   * configManager.updateConfig({ timeout: 60000 });
   * ```
   *
   * @returns ConfigManager instance for configuration operations
   */
  getConfigManager(): ConfigManager {
    return this.configManager;
  }

  // PAYMENT TERM MANAGEMENT
  // Summary: Create, update, delete, and manage payment terms for orders
  // Description: Full lifecycle management of payment terms including installments and refunds

  /**
   * Creates a new payment term for an existing order
   *
   * @summary Create payment term for installment or partial payment
   * @description
   * Creates a new payment term for an existing order, enabling installment payments
   * or partial payment collection. Payment terms allow splitting order amounts
   * across multiple payments with specific due dates and requirements.
   *
   * @param {OrderPaymentTermCreateDTO} termData - Payment term creation data
   * @param {string} termData.order_id - Reference ID of the existing order
   * @param {string} termData.term_reference_id - Unique identifier for this payment term
   * @param {number} termData.amount - Amount for this payment term
   * @param {string} termData.due_date - Due date for this payment (ISO 8601 format)
   * @param {number} termData.term_sequence - Sequence number for this term
   * @param {boolean} termData.required - Whether this payment term is required
   * @param {string} termData.status - Initial status of the payment term
   * @param {string} [termData.data] - Additional metadata for the term
   * @param {string} [termData.paid_date] - Date when payment was completed
   *
   * @returns {Promise<PaymentTermResponse>} Promise resolving to created payment term details
   * @throws {TapsilatValidationError} When input validation fails
   * @throws {TapsilatError} When API returns an error response
   */
  async createOrderTerm(
    termData: OrderPaymentTermCreateDTO
  ): Promise<PaymentTermResponse> {
    // Validate required fields
    if (!isNonEmptyString(termData.order_id)) {
      throw new TapsilatValidationError(
        "Order ID is required and must be a non-empty string",
        { provided: termData.order_id }
      );
    }

    if (!isNonEmptyString(termData.term_reference_id)) {
      throw new TapsilatValidationError(
        "Term reference ID is required and must be a non-empty string",
        { provided: termData.term_reference_id }
      );
    }

    if (!isPositiveNumber(termData.amount)) {
      throw new TapsilatValidationError("Amount must be a positive number", {
        provided: termData.amount,
      });
    }

    if (!hasValidDecimalPlaces(termData.amount)) {
      throw new TapsilatValidationError(
        "Amount must have maximum 2 decimal places",
        { provided: termData.amount }
      );
    }

    if (!isNonEmptyString(termData.due_date)) {
      throw new TapsilatValidationError(
        "Due date is required and must be a non-empty string",
        { provided: termData.due_date }
      );
    }

    if (!isInteger(termData.term_sequence)) {
      throw new TapsilatValidationError("Term sequence must be an integer", {
        provided: termData.term_sequence,
      });
    }

    if (typeof termData.required !== "boolean") {
      throw new TapsilatValidationError("Required field must be a boolean", {
        provided: termData.required,
      });
    }

    if (!isNonEmptyString(termData.status)) {
      throw new TapsilatValidationError(
        "Status is required and must be a non-empty string",
        { provided: termData.status }
      );
    }

    try {
      const createTermResponse =
        await this.httpClient.post<PaymentTermResponse>(
          "/order/term/create",
          termData
        );

      return handleResponse(createTermResponse, "Payment term creation");
    } catch (error) {
      return handleError(error, "payment term creation");
    }
  }

  /**
   * Updates an existing payment term
   *
   * @summary Update payment term details
   * @description
   * Updates an existing payment term with new information such as amount,
   * due date, status, or other metadata. This allows for flexible management
   * of installment payments and payment schedules.
   *
   * @param {OrderPaymentTermUpdateDTO} updateData - Payment term update data
   * @param {string} updateData.term_reference_id - Reference ID of the term to update
   * @param {number} [updateData.amount] - New amount for the payment term
   * @param {string} [updateData.due_date] - New due date (ISO 8601 format)
   * @param {string} [updateData.paid_date] - Date when payment was completed
   * @param {boolean} [updateData.required] - Whether this payment term is required
   * @param {string} [updateData.status] - New status of the payment term
   * @param {number} [updateData.term_sequence] - New sequence number
   *
   * @returns {Promise<PaymentTermResponse>} Promise resolving to updated payment term details
   * @throws {TapsilatValidationError} When input validation fails
   * @throws {TapsilatError} When API returns an error response
   */
  async updateOrderTerm(
    updateData: OrderPaymentTermUpdateDTO
  ): Promise<PaymentTermResponse> {
    // Validate required fields
    if (!isNonEmptyString(updateData.term_reference_id)) {
      throw new TapsilatValidationError(
        "Term reference ID is required and must be a non-empty string",
        { provided: updateData.term_reference_id }
      );
    }

    // Validate optional amount if provided
    if (updateData.amount !== undefined) {
      if (!isPositiveNumber(updateData.amount)) {
        throw new TapsilatValidationError("Amount must be a positive number", {
          provided: updateData.amount,
        });
      }

      if (!hasValidDecimalPlaces(updateData.amount)) {
        throw new TapsilatValidationError(
          "Amount must have maximum 2 decimal places",
          { provided: updateData.amount }
        );
      }
    }

    // Validate optional term sequence if provided
    if (updateData.term_sequence !== undefined) {
      if (!isInteger(updateData.term_sequence)) {
        throw new TapsilatValidationError("Term sequence must be an integer", {
          provided: updateData.term_sequence,
        });
      }
    }

    // Validate optional required field if provided
    if (
      updateData.required !== undefined &&
      typeof updateData.required !== "boolean"
    ) {
      throw new TapsilatValidationError("Required field must be a boolean", {
        provided: updateData.required,
      });
    }

    try {
      const updateTermResponse =
        await this.httpClient.post<PaymentTermResponse>(
          "/order/term/update",
          updateData
        );

      return handleResponse(updateTermResponse, "Payment term update");
    } catch (error) {
      return handleError(error, "payment term update");
    }
  }

  /**
   * Deletes a payment term
   *
   * @summary Delete payment term
   * @description
   * Permanently deletes a payment term from an order. This action cannot be undone.
   * Only unpaid payment terms can be deleted.
   *
   * @param {PaymentTermDeleteRequest} deleteData - Payment term deletion data
   * @param {string} deleteData.term_reference_id - Reference ID of the term to delete
   *
   * @returns {Promise<PaymentTermResponse>} Promise resolving to deleted payment term details
   * @throws {TapsilatValidationError} When input validation fails
   * @throws {TapsilatError} When API returns an error response
   */
  async deleteOrderTerm(
    deleteData: PaymentTermDeleteRequest
  ): Promise<PaymentTermResponse> {
    // Validate required fields
    if (!isNonEmptyString(deleteData.term_reference_id)) {
      throw new TapsilatValidationError(
        "Term reference ID is required and must be a non-empty string",
        { provided: deleteData.term_reference_id }
      );
    }

    try {
      const deleteTermResponse =
        await this.httpClient.post<PaymentTermResponse>(
          "/order/term/delete",
          deleteData
        );

      return handleResponse(deleteTermResponse, "Payment term deletion");
    } catch (error) {
      return handleError(error, "payment term deletion");
    }
  }

  /**
   * Refunds a specific payment term
   *
   * @summary Refund payment term
   * @description
   * Processes a refund for a specific payment term. This allows partial refunds
   * at the payment term level rather than the entire order level.
   *
   * @param {OrderTermRefundRequest} refundData - Payment term refund data
   * @param {string} refundData.term_id - ID of the term to refund
   * @param {number} refundData.amount - Amount to refund
   * @param {string} [refundData.reference_id] - Optional reference ID
   * @param {string} [refundData.term_payment_id] - Optional term payment ID
   *
   * @returns {Promise<PaymentTermRefundResponse>} Promise resolving to refund details
   * @throws {TapsilatValidationError} When input validation fails
   * @throws {TapsilatError} When API returns an error response
   */
  async refundOrderTerm(
    refundData: OrderTermRefundRequest
  ): Promise<PaymentTermRefundResponse> {
    // Validate required fields
    if (!isNonEmptyString(refundData.term_id)) {
      throw new TapsilatValidationError(
        "Term ID is required and must be a non-empty string",
        { provided: refundData.term_id }
      );
    }

    if (!isPositiveNumber(refundData.amount)) {
      throw new TapsilatValidationError("Amount must be a positive number", {
        provided: refundData.amount,
      });
    }

    if (!hasValidDecimalPlaces(refundData.amount)) {
      throw new TapsilatValidationError(
        "Amount must have maximum 2 decimal places",
        { provided: refundData.amount }
      );
    }

    try {
      const refundTermResponse =
        await this.httpClient.post<PaymentTermRefundResponse>(
          "/order/term/refund",
          refundData
        );

      return handleResponse(refundTermResponse, "Payment term refund");
    } catch (error) {
      return handleError(error, "payment term refund");
    }
  }

  /**
   * Terminates a payment term
   *
   * @summary Terminate payment term
   * @description
   * Terminates an active payment term, preventing further payments.
   * This is useful for canceling installment plans or payment schedules.
   *
   * @param {PaymentTermTerminateRequest} terminateData - Payment term termination data
   * @param {string} terminateData.term_reference_id - Reference ID of the term to terminate
   * @param {string} [terminateData.reason] - Optional reason for termination
   *
   * @returns {Promise<PaymentTermResponse>} Promise resolving to terminated term details
   * @throws {TapsilatValidationError} When input validation fails
   * @throws {TapsilatError} When API returns an error response
   */
  async terminateOrderTerm(
    terminateData: PaymentTermTerminateRequest
  ): Promise<PaymentTermResponse> {
    // Validate required fields
    if (!isNonEmptyString(terminateData.term_reference_id)) {
      throw new TapsilatValidationError(
        "Term reference ID is required and must be a non-empty string",
        { provided: terminateData.term_reference_id }
      );
    }

    try {
      const terminateTermResponse =
        await this.httpClient.post<PaymentTermResponse>(
          "/order/term/terminate",
          terminateData
        );

      return handleResponse(terminateTermResponse, "Payment term termination");
    } catch (error) {
      return handleError(error, "payment term termination");
    }
  }

  /**
   * Terminates an entire order
   *
   * @summary Terminate order
   * @description
   * Terminates an entire order, canceling all associated payment terms and
   * preventing any further payment processing. This is a more comprehensive
   * action than canceling individual payment terms.
   *
   * @param {OrderTerminateRequest} terminateData - Order termination data
   * @param {string} terminateData.reference_id - Reference ID of the order to terminate
   * @param {string} [terminateData.reason] - Optional reason for termination
   *
   * @returns {Promise<OrderTerminateResponse>} Promise resolving to terminated order details
   * @throws {TapsilatValidationError} When input validation fails
   * @throws {TapsilatError} When API returns an error response
   */
  async terminateOrder(
    terminateData: OrderTerminateRequest
  ): Promise<OrderTerminateResponse> {
    // Validate required fields
    if (!isNonEmptyString(terminateData.reference_id)) {
      throw new TapsilatValidationError(
        "Reference ID is required and must be a non-empty string",
        { provided: terminateData.reference_id }
      );
    }

    try {
      const terminateOrderResponse =
        await this.httpClient.post<OrderTerminateResponse>(
          "/order/terminate",
          terminateData
        );

      return handleResponse(terminateOrderResponse, "Order termination");
    } catch (error) {
      return handleError(error, "order termination");
    }
  }
}
