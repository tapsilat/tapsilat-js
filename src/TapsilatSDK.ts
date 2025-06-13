import { HttpClient } from "./http/HttpClient";
import {
  validateBearerToken,
  isNonEmptyString,
  isPositiveNumber,
  hasValidDecimalPlaces,
} from "./utils/validators";
import {
  APIResponse,
  TapsilatConfig,
  PaginatedResponse,
  Order,
  OrderRefundRequest,
  OrderRefundResponse,
  OrderStatusResponse,
  OrderPaymentDetail,
  Address,
  Currency,
} from "./types";
import {
  TapsilatError,
  TapsilatValidationError,
  TapsilatNetworkError,
} from "./errors/TapsilatError";

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

/**
 * Main SDK class for Tapsilat payment operations
 *
 * @example
 * ```typescript
 * const tapsilat = new TapsilatSDK({
 *   bearerToken: 'your-bearer-token',
 *   baseURL: 'https://api.tapsilat.com/v1'
 * });
 *
 * const payment = await tapsilat.createPayment({
 *   amount: 100.50,
 *   currency: 'TRY',
 *   paymentMethod: 'credit_card'
 * });
 * ```
 */
export class TapsilatSDK {
  private readonly httpClient: HttpClient;
  private readonly config: TapsilatConfig;

  /**
   * Creates a new TapsilatSDK instance
   *
   * @param config - SDK configuration options
   * @throws {TapsilatValidationError} When Bearer token is invalid
   */
  constructor(config: TapsilatConfig) {
    validateBearerToken(config.bearerToken);
    this.config = config;
    this.httpClient = new HttpClient(config);
  }

  // Order Operations

  /**
   * Creates a new order and returns a checkout URL.
   *
   * @param orderRequest - The order details including amount, currency, and buyer information
   * @returns Promise resolving to the created order response including reference ID and checkout URL
   * @throws {TapsilatValidationError} When order request data is invalid
   * @throws {TapsilatNetworkError} When API request fails due to network issues
   * @throws {TapsilatError} When API returns an error response
   *
   * @example
   * ```typescript
   * try {
   *   const orderResponse = await tapsilat.createOrder({
   *     amount: 100.50,
   *     currency: 'TRY',
   *     locale: 'en',
   *     buyer: {
   *       name: 'John',
   *       surname: 'Doe',
   *       email: 'john.doe@example.com'
   *     }
   *   });
   *   console.log(`Checkout URL: ${orderResponse.checkoutUrl}`);
   * } catch (error) {
   *   console.error(`Order creation failed: ${error.message}`);
   * }
   * ```
   */
  async createOrder(
    orderRequest: OrderCreateRequest
  ): Promise<OrderCreateResponse> {
    // Validate the order request
    this.validateOrderRequest(orderRequest);

    try {
      // Make the API request
      const response = await this.httpClient.post<OrderCreateResponse>(
        "/order/create",
        orderRequest
      );

      // Use our generic response handler
      return this.handleResponse(response, "Order creation");
    } catch (error) {
      // Use our generic error handler
      this.handleError(error, "order creation");
    }
  }

  /**
   * Validates an order request object
   * @private
   */
  private validateOrderRequest(orderRequest: OrderCreateRequest): void {
    // Check if request is null/undefined
    if (!orderRequest) {
      throw new TapsilatValidationError(
        "Order request cannot be null or undefined"
      );
    }

    // Validate amount
    if (
      !isPositiveNumber(orderRequest.amount) ||
      !hasValidDecimalPlaces(orderRequest.amount)
    ) {
      throw new TapsilatValidationError(
        "Amount must be a positive number with maximum 2 decimal places",
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

    if (!isNonEmptyString(buyer.email) || !this.isValidEmail(buyer.email)) {
      throw new TapsilatValidationError(
        "Buyer email is required and must be a valid email address",
        { provided: buyer.email }
      );
    }
  }

  /**
   * Basic email validation
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generic response handler - consistent way to handle API responses across SDK methods
   * @private
   *
   * @param response - The API response to process
   * @param errorContext - Descriptive context for error messages
   * @returns The data from a successful response
   * @throws {TapsilatError} On any response error
   */
  private handleResponse<T>(response: APIResponse<T>, errorContext: string): T {
    if (!response.success || !response.data) {
      // Convert API errors to domain-specific errors
      if (response.error) {
        throw TapsilatError.fromAPIError(response.error);
      }

      throw new TapsilatError(
        `${errorContext} failed with no error details`,
        "UNKNOWN_ERROR"
      );
    }

    return response.data;
  }

  /**
   * Generic error handler - consistent way to handle errors across SDK methods
   * @private
   *
   * @param error - The caught error to process
   * @param errorContext - Descriptive context for error messages
   * @throws {TapsilatError} Always throws an appropriate error type
   */
  private handleError(error: unknown, errorContext: string): never {
    // Rethrow TapsilatErrors as-is
    if (error instanceof TapsilatError) {
      throw error;
    }

    // Convert generic errors to TapsilatNetworkError
    throw new TapsilatNetworkError(
      error instanceof Error
        ? error.message
        : `Unknown error during ${errorContext}`,
      "NETWORK_ERROR"
    );
  }

  /**
   * Gets an order by reference ID.
   *
   * @param referenceId - The unique reference ID of the order
   * @returns Promise resolving to the complete order details
   * @throws {TapsilatValidationError} When referenceId is invalid
   * @throws {TapsilatNetworkError} When API request fails due to network issues
   * @throws {TapsilatError} When API returns an error response
   *
   * @example
   * ```typescript
   * try {
   *   const order = await tapsilat.getOrder("ord_123456789");
   *   console.log(`Order amount: ${order.amount} ${order.currency}`);
   * } catch (error) {
   *   console.error(`Failed to get order: ${error.message}`);
   * }
   * ```
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
      const response = await this.httpClient.get<Order>(
        `/order/${referenceId}`
      );

      // Use our generic response handler
      return this.handleResponse(response, "Order retrieval");
    } catch (error) {
      // Use our generic error handler
      this.handleError(error, "order retrieval");
    }
  }

  /**
   * Lists orders with pagination support.
   *
   * @param params - Optional pagination parameters (page number and items per page)
   * @returns Promise resolving to paginated list of orders
   * @throws {TapsilatNetworkError} When API request fails due to network issues
   * @throws {TapsilatError} When API returns an error response
   *
   * @example
   * ```typescript
   * try {
   *   // Get the second page with 20 items per page
   *   const orderList = await tapsilat.getOrders({ page: 2, per_page: 20 });
   *   console.log(`Total orders: ${orderList.total}`);
   *   orderList.rows.forEach(order => {
   *     console.log(`Order ${order.referenceId}: ${order.amount} ${order.currency}`);
   *   });
   * } catch (error) {
   *   console.error(`Failed to list orders: ${error.message}`);
   * }
   * ```
   */
  async getOrders(
    params: { page?: number; per_page?: number } = {}
  ): Promise<PaginatedResponse<Order>> {
    try {
      // Validate pagination parameters if provided
      if (
        params.page !== undefined &&
        (!Number.isInteger(params.page) || params.page < 1)
      ) {
        throw new TapsilatValidationError(
          "Page number must be a positive integer",
          { provided: params.page }
        );
      }

      if (
        params.per_page !== undefined &&
        (!Number.isInteger(params.per_page) || params.per_page < 1)
      ) {
        throw new TapsilatValidationError(
          "Items per page must be a positive integer",
          { provided: params.per_page }
        );
      }

      // Make the API request
      const response = await this.httpClient.get<PaginatedResponse<Order>>(
        "/order/list",
        { params: params }
      );

      // Use our generic response handler
      return this.handleResponse(response, "Order listing");
    } catch (error) {
      // Use our generic error handler
      this.handleError(error, "order listing");
    }
  }

  /**
   * Cancels an order by reference_id.
   */
  async cancelOrder(referenceId: string): Promise<Order> {
    if (!referenceId) {
      throw new Error("Order referenceId is required for cancellation");
    }
    const response = await this.httpClient.post<Order>("/order/cancel", {
      reference_id: referenceId,
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Order cancellation failed");
    }
    return response.data;
  }

  /**
   * Gets the status of an order by reference ID.
   *
   * @param referenceId - The unique reference ID of the order
   * @returns Promise resolving to the current order status, including status code and last update time
   * @throws {TapsilatValidationError} When referenceId is invalid
   * @throws {TapsilatNetworkError} When API request fails due to network issues
   * @throws {TapsilatError} When API returns an error response
   *
   * @example
   * ```typescript
   * try {
   *   const orderStatus = await tapsilat.getOrderStatus("ord_123456789");
   *   console.log(`Order status: ${orderStatus.status}`);
   * } catch (error) {
   *   if (error instanceof TapsilatValidationError) {
   *     console.error("Invalid reference ID format");
   *   } else if (error instanceof TapsilatError) {
   *     console.error(`API error: ${error.message}`);
   *   }
   * }
   * ```
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
      const response = await this.httpClient.get<OrderStatusResponse>(
        `/order/${referenceId}/status`
      );

      // Use our generic response handler
      return this.handleResponse(response, "Order status retrieval");
    } catch (error) {
      // Use our generic error handler
      this.handleError(error, "order status retrieval");
    }
  }

  /**
   * Partially refunds an order.
   * Based on `refund_order` from the Python SDK.
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
      throw new Error(response.error?.message || "Order refund failed");
    }

    return response.data;
  }

  /**
   * Fully refunds an order by its reference ID.
   * Based on `refund_all_order` from the Python SDK.
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
      throw new Error(response.error?.message || "Full order refund failed");
    }

    return response.data;
  }

  /**
   * Retrieves the payment details for an order.
   * Based on `get_order_payment_details` from the Python SDK.
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
        throw new Error(
          response.error?.message || "Failed to get payment details"
        );
      }

      return response.data;
    } else {
      // If no conversation_id, use GET to /order/{reference_id}/payment-details
      const response = await this.httpClient.get<OrderPaymentDetail[]>(
        `/order/${referenceId}/payment-details`
      );

      if (!response.success || !response.data) {
        throw new Error(
          response.error?.message || "Failed to get payment details"
        );
      }

      return response.data;
    }
  }

  /**
   * Gets an order by conversation_id.
   * Based on `get_order_by_conversation_id` from the Python SDK.
   */
  async getOrderByConversationId(conversationId: string): Promise<Order> {
    if (!conversationId) {
      throw new Error("Order conversationId is required");
    }
    const response = await this.httpClient.get<Order>(
      `/order/conversation/${conversationId}`
    );
    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || "Order retrieval by conversation ID failed"
      );
    }
    return response.data;
  }

  /**
   * Gets order transactions by reference_id.
   * Based on `get_order_transactions` from the Python SDK.
   */
  async getOrderTransactions(referenceId: string): Promise<any[]> {
    if (!referenceId) {
      throw new Error("Order referenceId is required");
    }
    const response = await this.httpClient.get<any[]>(
      `/order/${referenceId}/transactions`
    );
    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || "Order transactions retrieval failed"
      );
    }
    return response.data;
  }

  /**
   * Gets order submerchants with pagination.
   * Based on `get_order_submerchants` from the Python SDK.
   */
  async getOrderSubmerchants(
    params: { page?: number; per_page?: number } = {}
  ): Promise<any> {
    const response = await this.httpClient.get<any>("/order/submerchants", {
      params: params,
    });
    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || "Order submerchants retrieval failed"
      );
    }
    return response.data;
  }

  /**
   * Gets checkout URL for an order.
   * Based on `get_checkout_url` from the Python SDK.
   */
  async getCheckoutUrl(referenceId: string): Promise<string> {
    const order = await this.getOrder(referenceId);
    if (order && (order as any).checkout_url) {
      return (order as any).checkout_url;
    }
    throw new Error("Checkout URL not found in order response");
  }

  // Utility Methods

  /**
   * Verifies webhook signature for security
   *
   * @param payload - Raw webhook payload string
   * @param signature - Webhook signature from headers
   * @param secret - Your webhook secret key
   * @returns Promise resolving to true if signature is valid
   *
   * @example
   * ```typescript
   * const isValid = await sdk.verifyWebhook(
   *   JSON.stringify(req.body),
   *   req.headers['x-tapsilat-signature'],
   *   'your-webhook-secret'
   * );
   * ```
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
   * @returns Promise resolving to service status
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.httpClient.get<{
      status: string;
      timestamp: string;
    }>("/health");

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Health check failed");
    }

    return response.data;
  }

  // Configuration methods

  /**
   * Gets current SDK configuration (without sensitive data)
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
