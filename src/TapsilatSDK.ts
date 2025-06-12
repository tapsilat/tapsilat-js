import { HttpClient, RequestBody } from "./http/HttpClient";
import {
  validateBearerToken,
  validatePaymentRequest,
  sanitizeMetadata,
} from "./utils/validators";
import {
  TapsilatConfig,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  Customer,
  PaginationParams,
  PaginatedResponse,
  APIResponse,
  APIError,
  Order,
  OrderRefundRequest,
  OrderRefundResponse,
  OrderStatusResponse,
  OrderPaymentDetail,
  Address,
  Currency,
} from "./types";

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
   */
  async createOrder(orderRequest: OrderCreateRequest): Promise<OrderCreateResponse> {
    const response = await this.httpClient.post<OrderCreateResponse>(
      "/order/create",
      orderRequest
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Order creation failed");
    }
    return response.data;
  }

  /**
   * Gets an order by reference_id.
   */
  async getOrder(referenceId: string): Promise<Order> {
    if (!referenceId) {
      throw new Error("Order referenceId is required");
    }
    const response = await this.httpClient.post<Order>(
      "/order/get",
      { reference_id: referenceId }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Order retrieval failed");
    }
    return response.data;
  }

  /**
   * Lists orders (page, per_page).
   */
  async getOrders(params: { page?: number; per_page?: number } = {}): Promise<PaginatedResponse<Order>> {
    const response = await this.httpClient.post<PaginatedResponse<Order>>(
      "/order/list",
      params
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Order list failed");
    }
    return response.data;
  }

  /**
   * Cancels an order by reference_id.
   */
  async cancelOrder(referenceId: string): Promise<Order> {
    if (!referenceId) {
      throw new Error("Order referenceId is required for cancellation");
    }
    const response = await this.httpClient.post<Order>(
      "/order/cancel",
      { reference_id: referenceId }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Order cancellation failed");
    }
    return response.data;
  }

  /**
   * Gets the status of an order by reference_id.
   */
  async getOrderStatus(referenceId: string): Promise<OrderStatusResponse> {
    if (!referenceId) {
      throw new Error("Order referenceId is required for status");
    }
    const response = await this.httpClient.post<OrderStatusResponse>(
      "/order/status",
      { reference_id: referenceId }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Order status retrieval failed");
    }
    return response.data;
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
      "/orders/refund",
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
      `/orders/${referenceId}/refund-all`
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
    const queryParams = new URLSearchParams();
    if (conversationId) {
      queryParams.append("conversationId", conversationId);
    }
    const queryString = queryParams.toString();
    const url = `/orders/${referenceId}/payment-details${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await this.httpClient.get<OrderPaymentDetail[]>(url);

    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || "Failed to get payment details"
      );
    }

    return response.data;
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
  getConfig(): Omit<TapsilatConfig, "bearerToken"> & { hasBearerToken: boolean } {
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
