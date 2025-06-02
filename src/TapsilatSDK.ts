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
} from "./types";

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
