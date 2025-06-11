import { HttpClient, RequestBody } from "./http/HttpClient";
import {
  validateApiKey,
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
 *   apiKey: 'your-api-key',
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
   * @throws {TapsilatValidationError} When API key is invalid
   */
  constructor(config: TapsilatConfig) {
    validateApiKey(config.apiKey);
    this.config = config;
    this.httpClient = new HttpClient(config);
  }

  // Payment Operations

  /**
   * Creates a new payment request
   *
   * @param paymentRequest - Payment details including amount, currency, and method
   * @returns Promise resolving to payment response with ID and status
   * @throws {TapsilatValidationError} When request data is invalid
   * @throws {TapsilatAuthenticationError} When API key is invalid
   * @throws {TapsilatNetworkError} When network request fails
   *
   * @example
   * ```typescript
   * const payment = await sdk.createPayment({
   *   amount: 150.75,
   *   currency: 'TRY',
   *   paymentMethod: 'credit_card',
   *   description: 'Product purchase'
   * });
   * ```
   */
  async createPayment(
    paymentRequest: PaymentRequest
  ): Promise<PaymentResponse> {
    validatePaymentRequest(paymentRequest);

    const sanitizedRequest = {
      ...paymentRequest,
      metadata: paymentRequest.metadata
        ? sanitizeMetadata(paymentRequest.metadata)
        : undefined,
    };

    const response = await this.httpClient.post<PaymentResponse>(
      "/payments",
      sanitizedRequest
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Payment creation failed");
    }

    return response.data;
  }

  /**
   * Retrieves a payment by ID
   *
   * @param paymentId - Unique payment identifier
   * @returns Promise resolving to payment details
   * @throws {Error} When payment ID is missing or payment not found
   *
   * @example
   * ```typescript
   * const payment = await sdk.getPayment('payment_123');
   * console.log('Status:', payment.status);
   * ```
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    const response = await this.httpClient.get<PaymentResponse>(
      `/payments/${paymentId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Payment retrieval failed");
    }

    return response.data;
  }

  /**
   * Retrieves a paginated list of payments
   *
   * @param params - Optional pagination and sorting parameters
   * @returns Promise resolving to paginated payment list
   *
   * @example
   * ```typescript
   * const payments = await sdk.getPayments({
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'createdAt',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  async getPayments(
    params?: PaginationParams
  ): Promise<PaginatedResponse<PaymentResponse>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = queryString ? `/payments?${queryString}` : "/payments";

    const response = await this.httpClient.get<
      PaginatedResponse<PaymentResponse>
    >(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Payments retrieval failed");
    }

    return response.data;
  }

  /**
   * Cancels a pending payment
   *
   * @param paymentId - Unique payment identifier
   * @returns Promise resolving to updated payment with cancelled status
   * @throws {Error} When payment ID is missing or cancellation fails
   *
   * @example
   * ```typescript
   * const cancelledPayment = await sdk.cancelPayment('payment_123');
   * ```
   */
  async cancelPayment(paymentId: string): Promise<PaymentResponse> {
    if (!paymentId) {
      throw new Error("Payment ID is required");
    }

    const response = await this.httpClient.patch<PaymentResponse>(
      `/payments/${paymentId}/cancel`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Payment cancellation failed");
    }

    return response.data;
  }

  // Order Operations

  /**
   * Creates a new order and returns a checkout URL.
   * Based on `create_order` from the Python SDK.
   *
   * @param orderRequest - Details of the order including buyer and amount.
   * @returns Promise resolving to the created order details with a checkout URL.
   * @throws {TapsilatValidationError} When request data is invalid.
   * @throws {TapsilatAuthenticationError} When API key is invalid.
   * @throws {TapsilatNetworkError} When network request fails.
   */
  async createOrder(
    orderRequest: OrderCreateRequest
  ): Promise<OrderCreateResponse> {
    // TODO: Add validation for orderRequest
    const response = await this.httpClient.post<OrderCreateResponse>(
      "/orders",
      orderRequest
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Order creation failed");
    }

    return response.data;
  }

  /**
   * Retrieves an order by its reference ID.
   * Based on `get_order` from the Python SDK.
   *
   * @param referenceId - The unique identifier of the order.
   * @returns Promise resolving to the full order details.
   * @throws {TapsilatValidationError} When referenceId is missing.
   * @throws {TapsilatNotFoundError} When the order is not found.
   * @throws {TapsilatNetworkError} When network request fails.
   */
  async getOrder(referenceId: string): Promise<Order> {
    if (!referenceId) {
      // TODO: Use TapsilatValidationError
      throw new Error("Order referenceId is required");
    }

    const response = await this.httpClient.get<Order>(`/orders/${referenceId}`);

    if (!response.success || !response.data) {
      // TODO: Use specific errors for 404 vs. other failures
      throw new Error(response.error?.message || "Order retrieval failed");
    }

    return response.data;
  }

  /**
   * Retrieves a paginated list of orders.
   * Based on `get_order_list` from the Python SDK.
   *
   * @param params - Optional pagination parameters (limit, page).
   * @returns Promise resolving to a paginated list of orders.
   */
  async getOrders(
    params?: PaginationParams
  ): Promise<PaginatedResponse<Order>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `/orders?${queryString}` : "/orders";

    const response = await this.httpClient.get<PaginatedResponse<Order>>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Orders retrieval failed");
    }

    return response.data;
  }

  /**
   * Cancels an order by its reference ID.
   * Based on `cancel_order` from the Python SDK.
   *
   * @param referenceId - The unique identifier of the order to cancel.
   * @returns Promise resolving to the updated order with a 'cancelled' status.
   */
  async cancelOrder(referenceId: string): Promise<Order> {
    if (!referenceId) {
      throw new Error("Order referenceId is required for cancellation");
    }

    const response = await this.httpClient.post<Order>(
      `/orders/${referenceId}/cancel`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Order cancellation failed");
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
   * Retrieves the current status of an order.
   * Based on `get_order_status` from the Python SDK.
   *
   * @param referenceId - The unique identifier of the order.
   * @returns Promise resolving to the order's status.
   */
  async getOrderStatus(referenceId: string): Promise<OrderStatusResponse> {
    const response = await this.httpClient.get<OrderStatusResponse>(
      `/orders/${referenceId}/status`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Failed to get order status");
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

  // Refund Operations

  /**
   * Creates a refund for a completed payment
   *
   * @param refundRequest - Refund details including payment ID and amount
   * @returns Promise resolving to refund response
   * @throws {Error} When payment ID is missing or refund creation fails
   *
   * @example
   * ```typescript
   * // Full refund
   * const refund = await sdk.createRefund({
   *   paymentId: 'payment_123',
   *   reason: 'Customer request'
   * });
   *
   * // Partial refund
   * const partialRefund = await sdk.createRefund({
   *   paymentId: 'payment_123',
   *   amount: 50.00,
   *   reason: 'Partial return'
   * });
   * ```
   */
  async createRefund(refundRequest: RefundRequest): Promise<RefundResponse> {
    if (!refundRequest.paymentId) {
      throw new Error("Payment ID is required for refund");
    }

    const response = await this.httpClient.post<RefundResponse>(
      "/refunds",
      refundRequest as RequestBody
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Refund creation failed");
    }

    return response.data;
  }

  /**
   * Retrieves a refund by ID
   *
   * @param refundId - Unique refund identifier
   * @returns Promise resolving to refund details
   */
  async getRefund(refundId: string): Promise<RefundResponse> {
    if (!refundId) {
      throw new Error("Refund ID is required");
    }

    const response = await this.httpClient.get<RefundResponse>(
      `/refunds/${refundId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Refund retrieval failed");
    }

    return response.data;
  }

  /**
   * Retrieves refunds, optionally filtered by payment ID
   *
   * @param paymentId - Optional payment ID to filter refunds
   * @param params - Optional pagination parameters
   * @returns Promise resolving to paginated refund list
   */
  async getRefunds(
    paymentId?: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<RefundResponse>> {
    const queryParams = new URLSearchParams();

    if (paymentId) queryParams.append("paymentId", paymentId);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = queryString ? `/refunds?${queryString}` : "/refunds";

    const response = await this.httpClient.get<
      PaginatedResponse<RefundResponse>
    >(url);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Refunds retrieval failed");
    }

    return response.data;
  }

  // Customer Operations

  /**
   * Creates a new customer record
   *
   * @param customer - Customer information
   * @returns Promise resolving to created customer with ID
   */
  async createCustomer(customer: Customer): Promise<Customer> {
    const response = await this.httpClient.post<Customer>(
      "/customers",
      customer as RequestBody
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Customer creation failed");
    }

    return response.data;
  }

  /**
   * Retrieves customer information by ID
   *
   * @param customerId - Unique customer identifier
   * @returns Promise resolving to customer details
   */
  async getCustomer(customerId: string): Promise<Customer> {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const response = await this.httpClient.get<Customer>(
      `/customers/${customerId}`
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Customer retrieval failed");
    }

    return response.data;
  }

  /**
   * Updates customer information
   *
   * @param customerId - Unique customer identifier
   * @param customer - Partial customer data to update
   * @returns Promise resolving to updated customer
   */
  async updateCustomer(
    customerId: string,
    customer: Partial<Customer>
  ): Promise<Customer> {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const response = await this.httpClient.put<Customer>(
      `/customers/${customerId}`,
      customer as RequestBody
    );

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || "Customer update failed");
    }

    return response.data;
  }

  /**
   * Deletes a customer record
   *
   * @param customerId - Unique customer identifier
   * @returns Promise resolving when deletion is complete
   */
  async deleteCustomer(customerId: string): Promise<void> {
    if (!customerId) {
      throw new Error("Customer ID is required");
    }

    const response = await this.httpClient.delete(`/customers/${customerId}`);

    if (!response.success) {
      throw new Error(response.error?.message || "Customer deletion failed");
    }
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
  getConfig(): Omit<TapsilatConfig, "apiKey"> & { hasApiKey: boolean } {
    const { apiKey, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      hasApiKey: Boolean(apiKey),
    };
  }

  /**
   * Updates SDK configuration
   *
   * @param newConfig - Partial configuration to update
   * @throws {TapsilatValidationError} When API key is invalid
   */
  updateConfig(newConfig: Partial<TapsilatConfig>): void {
    if (newConfig.apiKey) {
      validateApiKey(newConfig.apiKey);
    }

    Object.assign(this.config, newConfig);
  }
}
