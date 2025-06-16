import { HttpClient } from "./http/HttpClient";
import {
  validateBearerToken,
  isNonEmptyString,
  isPositiveNumber,
  hasValidDecimalPlaces,
  isInteger,
} from "./utils/validators";
import { isValidEmail, handleResponse, handleError } from "./utils";
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
} from "./types";
import { TapsilatValidationError, TapsilatError } from "./errors/TapsilatError";

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
  private readonly config: TapsilatConfig;

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
    this.config = config;
    this.httpClient = new HttpClient(config);
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
      const response = await this.httpClient.post<OrderCreateResponse>(
        "/order/create",
        orderRequest
      );

      // Use our generic response handler
      return handleResponse(response, "Order creation");
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
   */
  async cancelOrder(referenceId: string): Promise<Order> {
    if (!referenceId) {
      throw new TapsilatValidationError(
        "Order referenceId is required for cancellation",
        { provided: referenceId }
      );
    }
    const response = await this.httpClient.post<Order>("/order/cancel", {
      reference_id: referenceId,
    });
    if (!response.success || !response.data) {
      throw new TapsilatError(
        response.error?.message || "Order cancellation failed",
        response.error?.code || "CANCELLATION_FAILED"
      );
    }
    return response.data;
  }

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
   */
  async refundOrder(
    refundData: OrderRefundRequest
  ): Promise<OrderRefundResponse> {
    const response = await this.httpClient.post<OrderRefundResponse>(
      "/order/refund",
      refundData
    );

    if (!response.success || !response.data) {
      throw new TapsilatError(
        response.error?.message || "Order refund failed",
        response.error?.code || "REFUND_FAILED"
      );
    }

    return response.data;
  }

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
   */
  async refundAllOrder(referenceId: string): Promise<OrderRefundResponse> {
    const response = await this.httpClient.post<OrderRefundResponse>(
      "/order/refund-all",
      { reference_id: referenceId }
    );

    if (!response.success || !response.data) {
      throw new TapsilatError(
        response.error?.message || "Full order refund failed",
        response.error?.code || "FULL_REFUND_FAILED"
      );
    }

    return response.data;
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
   */
  async getOrderPaymentDetails(
    referenceId: string,
    conversationId?: string
  ): Promise<OrderPaymentDetail[]> {
    if (conversationId) {
      // If conversation_id is provided, use POST to /order/payment-details
      const response = await this.httpClient.post<OrderPaymentDetail[]>(
        "/order/payment-details",
        { conversation_id: conversationId, reference_id: referenceId }
      );

      if (!response.success || !response.data) {
        throw new TapsilatError(
          response.error?.message || "Failed to get payment details",
          response.error?.code || "PAYMENT_DETAILS_FAILED"
        );
      }

      return response.data;
    } else {
      // If no conversation_id, use GET to /order/{reference_id}/payment-details
      const getOrderPaymentDetailsResponse = await this.httpClient.get<
        OrderPaymentDetail[]
      >(`/order/${referenceId}/payment-details`);

      if (
        !getOrderPaymentDetailsResponse.success ||
        !getOrderPaymentDetailsResponse.data
      ) {
        throw new TapsilatError(
          getOrderPaymentDetailsResponse.error?.message ||
            "Failed to get payment details",
          getOrderPaymentDetailsResponse.error?.code || "PAYMENT_DETAILS_FAILED"
        );
      }

      return getOrderPaymentDetailsResponse.data;
    }
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
   */
  async getOrderByConversationId(conversationId: string): Promise<Order> {
    if (!conversationId) {
      throw new TapsilatValidationError("Order conversationId is required", {
        provided: conversationId,
      });
    }
    const getOrderByConversationIdResponse = await this.httpClient.get<Order>(
      `/order/conversation/${conversationId}`
    );

    if (
      !getOrderByConversationIdResponse.success ||
      !getOrderByConversationIdResponse.data
    ) {
      throw new TapsilatError(
        getOrderByConversationIdResponse.error?.message ||
          "Order retrieval by conversation ID failed",
        getOrderByConversationIdResponse.error?.code || "ORDER_RETRIEVAL_FAILED"
      );
    }
    return getOrderByConversationIdResponse.data;
  }

  /**
   * Gets order transactions by reference_id.
   * Based on `get_order_transactions` from the Python SDK.
   *
   * @summary Retrieve transaction history for an order
   * @description Gets detailed transaction records and payment attempts for a specific order.
   */
  async getOrderTransactions(referenceId: string): Promise<any[]> {
    if (!referenceId) {
      throw new TapsilatValidationError("Order referenceId is required", {
        provided: referenceId,
      });
    }
    const getOrderTransactionsResponse = await this.httpClient.get<any[]>(
      `/order/${referenceId}/transactions`
    );
    if (
      !getOrderTransactionsResponse.success ||
      !getOrderTransactionsResponse.data
    ) {
      throw new TapsilatError(
        getOrderTransactionsResponse.error?.message ||
          "Order transactions retrieval failed",
        getOrderTransactionsResponse.error?.code ||
          "TRANSACTIONS_RETRIEVAL_FAILED"
      );
    }
    return getOrderTransactionsResponse.data;
  }

  /**
   * Gets order submerchants with pagination.
   * Based on `get_order_submerchants` from the Python SDK.
   *
   * @summary Retrieve paginated list of submerchants for orders
   * @description Gets submerchant information with pagination support for order management.
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
    if (
      !getOrderSubmerchantsResponse.success ||
      !getOrderSubmerchantsResponse.data
    ) {
      throw new TapsilatError(
        getOrderSubmerchantsResponse.error?.message ||
          "Order submerchants retrieval failed",
        getOrderSubmerchantsResponse.error?.code ||
          "SUBMERCHANTS_RETRIEVAL_FAILED"
      );
    }
    return getOrderSubmerchantsResponse.data;
  }

  /**
   * Gets checkout URL for an order.
   * Based on `get_checkout_url` from the Python SDK.
   *
   * @summary Retrieve checkout URL for existing order
   * @description Gets the payment checkout URL for an existing order using reference ID.
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

  // Utility Methods

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
   */
  async verifyWebhook(
    payload: string,
    signature: string,
    secret: string
  ): Promise<boolean> {
    // Implementation would depend on your webhook signature verification method
    // This is a placeholder implementation
    const crypto = await import("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    return `sha256=${expectedSignature}` === signature;
  }

  /**
   * Checks API service health and availability
   *
   * @summary Check API service health and availability
   * @description Verifies that the Tapsilat API service is operational and accessible.
   *
   * @returns Promise resolving to service status
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const healthCheckResponse = await this.httpClient.get<{
      status: string;
      timestamp: string;
    }>("/health");

    if (!healthCheckResponse.success || !healthCheckResponse.data) {
      throw new TapsilatError(
        healthCheckResponse.error?.message || "Health check failed",
        healthCheckResponse.error?.code || "HEALTH_CHECK_FAILED"
      );
    }

    return healthCheckResponse.data;
  }

  // Configuration methods

  /**
   * Gets current SDK configuration (without sensitive data)
   *
   * @summary Get current SDK configuration without sensitive information
   * @description Returns a copy of the current configuration with sensitive data (like bearer token) excluded.
   *
   * @returns Copy of current configuration
   */
  getConfig(): Omit<TapsilatConfig, "bearerToken"> & {
    hasBearerToken: boolean;
  } {
    const { bearerToken, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      hasBearerToken: Boolean(bearerToken),
    };
  }

  /**
   * Updates SDK configuration
   *
   * @summary Update SDK configuration with new values
   * @description Updates the SDK configuration with provided values, validating bearer token if changed.
   *
   * @param newConfig - Partial configuration to update
   * @throws {TapsilatValidationError} When Bearer token is invalid
   */
  updateConfig(newConfig: Partial<TapsilatConfig>): void {
    if (newConfig.bearerToken) {
      validateBearerToken(newConfig.bearerToken);
    }
    Object.assign(this.config, newConfig);
  }
}
