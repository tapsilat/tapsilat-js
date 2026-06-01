import { TapsilatSDK } from "../TapsilatSDK";
import {
  OrderCreateRequest,
  GetOrderResponse,
  GetOrdersResponse,
  CancelOrderResponse,
  OrderAccountingRequest,
  OrderPostAuthRequest,
  OrderPostAuthResponse,
  GetSystemOrderStatusesResponse,
  SubscriptionRedirectRequest,
} from "../types/index";
import { HttpClient } from "../http/HttpClient";

// Mock the HttpClient
jest.mock("../http/HttpClient");

describe("TapsilatSDK", () => {
  const validConfig = {
    bearerToken: "test-bearer-token-12345",
    baseURL: "https://test.api.com/v1",
    timeout: 10000,
  };

  let sdk: TapsilatSDK;
  let mockHttpClient: jest.Mocked<HttpClient>;
  const baseOrderRequest: OrderCreateRequest = {
    amount: 150.75,
    currency: "TRY",
    locale: "tr",
    basket_items: [
      {
        id: "item-1",
        name: "Test Product",
        category1: "General",
        item_type: "Digital",
        price: 150.75,
        quantity: 1,
      },
    ],
    billing_address: {
      address: "Example St 123",
      city: "Istanbul",
      contact_name: "John Doe",
      country: "tr",
      zip_code: "34000",
      billing_type: "PERSONAL",
    },
    buyer: {
      name: "John",
      surname: "Doe",
      email: "john-doe@example.com",
      city: "Istanbul",
      country: "tr",
    },
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    sdk = new TapsilatSDK(validConfig);
    mockHttpClient = (sdk as unknown as { httpClient: HttpClient })
      .httpClient as jest.Mocked<HttpClient>;
  });

  describe("Order Operations", () => {
    it("should create an order successfully", async () => {
      const orderRequest: OrderCreateRequest = { ...baseOrderRequest };

      const mockResponse = {
        success: true,
        data: {
          reference_id: "order-123",
          conversation_id: "conv-123",
          checkout_url: "https://checkout.test.com/order-123",
          status: "CREATED",
        },
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const order = await sdk.createOrder(orderRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/order/create",
        orderRequest
      );
      expect(order).toEqual(mockResponse.data);
      expect(order.reference_id).toBe("order-123");
      expect(order.checkout_url).toBe("https://checkout.test.com/order-123");
    });

    it("should get order status successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          status: "COMPLETED",
          error_code: "",
        },
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const status = await sdk.getOrderStatus("order-123");

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        "/order/order-123/status"
      );
      expect(status).toEqual(mockResponse.data);
      expect(status.status).toBe("COMPLETED");
    });

    it("should get order details successfully", async () => {
      const mockData: GetOrderResponse = {
        reference_id: "order-123",
        amount: "150.75",
        currency: "TRY",
        status: 9,
        status_enum: "Completed",
        buyer: {
          name: "John",
          surname: "Doe",
          email: "john-doe@example.com",
        },
      };

      const mockResponse = {
        success: true,
        data: mockData,
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const order = await sdk.getOrder("order-123");

      expect(mockHttpClient.get).toHaveBeenCalledWith("/order/order-123");
      expect(order).toEqual(mockData);
      expect(order.reference_id).toBe("order-123");
    });

    it("should list orders successfully", async () => {
      const mockData: GetOrdersResponse = {
        page: 1,
        per_page: 10,
        total: 2,
        total_pages: 1,
        rows: [
          {
            reference_id: "order-123",
            total: "150.75",
            status: 9,
            checkout_url: "https://example.com/checkout/order-123",
          },
          {
            reference_id: "order-456",
            total: "299.99",
            status: 2,
            checkout_url: "https://example.com/checkout/order-456",
          },
        ],
      };

      const mockResponse = {
        success: true,
        data: mockData,
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const orders = await sdk.getOrders({ page: 1, per_page: 10 });

      expect(mockHttpClient.get).toHaveBeenCalledWith("/order/list", {
        params: { page: 1, per_page: 10 },
      });
      expect(orders).toEqual(mockData);
      expect(orders.rows).toHaveLength(2);
    });

    it("should cancel order successfully", async () => {
      const mockData: CancelOrderResponse = {
        is_success: true,
        message: "Order cancelled successfully",
        status: "CANCELLED",
      };

      const mockResponse = {
        success: true,
        data: mockData,
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const cancelledOrder = await sdk.cancelOrder("order-123");

      expect(mockHttpClient.post).toHaveBeenCalledWith("/order/cancel", {
        reference_id: "order-123",
      });
      expect(cancelledOrder).toEqual(mockData);
      expect(cancelledOrder.status).toBe("CANCELLED");
    });

    it("should refund order successfully", async () => {
      const refundRequest = {
        reference_id: "order-123",
        amount: 50.0,
      };

      const mockResponse = {
        success: true,
        data: {
          refundId: "refund-456",
          referenceId: "order-123",
          status: "COMPLETED",
          amount: 50.0,
          currency: "TRY",
          createdAt: "2024-01-15T10:30:00Z",
        },
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const refund = await sdk.refundOrder(refundRequest);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/order/refund",
        refundRequest
      );
      expect(refund).toEqual(mockResponse.data);
      expect(refund.amount).toBe(50.0);
    });

    it("should process order accounting successfully", async () => {
      const request: OrderAccountingRequest = {
        order_reference_id: "order-123",
      };

      const mockResponse = {
        success: true,
        data: { code: 200, message: "OK" },
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await sdk.orderAccounting(request);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/order/accounting",
        request
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should process order post-auth successfully", async () => {
      const request: OrderPostAuthRequest = {
        reference_id: "order-123",
        amount: 100.0,
      };

      const mockData: OrderPostAuthResponse = {
        code: 200,
        is_success: true,
        message: "OK",
      };

      const mockResponse = {
        success: true,
        data: mockData,
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await sdk.orderPostAuth(request);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/order/postauth",
        request
      );
      expect(result).toEqual(mockData);
    });

    it("should retrieve system order statuses successfully", async () => {
      const mockData: GetSystemOrderStatusesResponse = {
        rows: [
          { code: 1, message: "CREATED" },
          { code: 2, message: "FAILED" },
          { code: 3, message: "COMPLETED" },
        ],
      };

      const mockResponse = {
        success: true,
        data: mockData,
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const result = await sdk.getSystemOrderStatuses();

      expect(mockHttpClient.get).toHaveBeenCalledWith("/system/order-statuses");
      expect(result).toEqual(mockData);
    });
  });

  describe("Validation", () => {
    it("should validate bearer token", () => {
      expect(() => {
        new TapsilatSDK({ bearerToken: "" });
      }).toThrow("Bearer token must be a non-empty string");
    });

    it("should validate order creation request", async () => {
      const invalidOrderRequest = {
        ...baseOrderRequest,
        amount: -100,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      await expect(sdk.createOrder(invalidOrderRequest)).rejects.toThrow(
        "Amount must be a positive number"
      );
    });

    it("should validate email format", async () => {
      const invalidOrderRequest = {
        ...baseOrderRequest,
        buyer: {
          ...baseOrderRequest.buyer,
          email: "invalid-email",
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      await expect(sdk.createOrder(invalidOrderRequest)).rejects.toThrow(
        "Buyer email must be a valid email address"
      );
    });

    it("should validate amount decimal places", async () => {
      const invalidOrderRequest = {
        ...baseOrderRequest,
        amount: 100.555,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any;

      await expect(sdk.createOrder(invalidOrderRequest)).rejects.toThrow(
        "Amount must have maximum 2 decimal places"
      );
    });

    it("should validate order accounting request", async () => {
      const request = {
        order_reference_id: "",
      } as OrderAccountingRequest;

      await expect(sdk.orderAccounting(request)).rejects.toThrow(
        "Order reference ID is required"
      );
    });

    it("should validate post-auth request", async () => {
      const request = {
        reference_id: "",
        amount: 100.0,
      } as OrderPostAuthRequest;

      await expect(sdk.orderPostAuth(request)).rejects.toThrow(
        "Reference ID is required"
      );
    });

    it("should validate post-auth amount", async () => {
      const request = {
        reference_id: "order-123",
        amount: -100,
      } as OrderPostAuthRequest;

      await expect(sdk.orderPostAuth(request)).rejects.toThrow(
        "Amount must be a positive number"
      );
    });

    it("should validate order listing page as integer", async () => {
      await expect(
        sdk.getOrders({ page: 1.5, per_page: 10 })
      ).rejects.toThrow("Page number must be an integer");
    });

    it("should validate order listing per_page as positive", async () => {
      await expect(
        sdk.getOrders({ page: 1, per_page: 0 })
      ).rejects.toThrow("Items per page must be greater than 0");
    });

    it("should validate order listing status as integer", async () => {
      await expect(
        sdk.getOrders({ status: 2.5 })
      ).rejects.toThrow("Status must be an integer");
    });

    it("should validate cancel order reference id", async () => {
      await expect(
        sdk.cancelOrder("")
      ).rejects.toThrow("Order referenceId is required");
    });

    it("should validate order status reference id", async () => {
      await expect(
        sdk.getOrderStatus("")
      ).rejects.toThrow("Order referenceId is required");
    });
  });

  describe("Health Check", () => {
    it("should perform health check successfully", async () => {
      const mockResponse = {
        success: true,
        data: "OK",
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const health = await sdk.healthCheck();

      expect(mockHttpClient.get).toHaveBeenCalledWith("/health");
      // The healthCheck implementation now constructs its own response object
      // rather than returning the raw API response data directly.
      // So we expect the constructed object.
      expect(health).toEqual({
        status: "UP",
        timestamp: expect.any(String),
      });
    });
  });

  describe("Webhook Verification", () => {
    it("should verify webhook signature", async () => {
      const payload = "data";
      const secret = "key";
      // hmac-sha256 of "data" with key "key"
      const signature =
        "sha256=5031fe3d989c6d1537a013fa6e739da23463fdaec3b70137d828e36ace221bd0";

      const result = await sdk.verifyWebhook(payload, signature, secret);
      expect(result).toBe(true);
    });

    it("should return false for invalid signature", async () => {
      const payload = "data";
      const secret = "key";
      const signature = "sha256=invalid";

      const result = await sdk.verifyWebhook(payload, signature, secret);
      expect(result).toBe(false);
    });

    it("should validate webhook parameters", async () => {
      await expect(
        sdk.verifyWebhook("", "signature", "secret")
      ).rejects.toThrow(
        "Webhook payload is required and must be a non-empty string"
      );

      await expect(sdk.verifyWebhook("payload", "", "secret")).rejects.toThrow(
        "Webhook signature is required and must be a non-empty string"
      );

      await expect(
        sdk.verifyWebhook("payload", "signature", "")
      ).rejects.toThrow(
        "Webhook secret is required and must be a non-empty string"
      );
    });
  });

  describe("New Features", () => {
    it("should terminate order term", async () => {
      const request = { term_reference_id: "term_ref_123", reason: "reason" };
      const mockResponse = { success: true, data: { success: true } };
      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await sdk.terminateOrderTerm(request);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/order/term/terminate",
        request
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should trigger manual callback", async () => {
      const referenceId = "ref_123";
      const conversationId = "conv_123";
      const mockResponse = { success: true, data: { success: true } };
      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await sdk.orderManualCallback(referenceId, conversationId);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/order/callback",
        {
          reference_id: referenceId,
          conversation_id: conversationId,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should update related order", async () => {
      const referenceId = "ref_123";
      const relatedReferenceId = "rel_ref_123";
      const mockResponse = { success: true, data: { success: true } };
      mockHttpClient.patch.mockResolvedValueOnce(mockResponse);

      const result = await sdk.orderRelatedUpdate(
        referenceId,
        relatedReferenceId
      );

      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        "/order/releated",
        {
          reference_id: referenceId,
          related_reference_id: relatedReferenceId,
        }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should get organization settings", async () => {
      const mockResponse = { success: true, data: { setting: "value" } };
      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const result = await sdk.getOrganizationSettings();

      expect(mockHttpClient.get).toHaveBeenCalledWith("/organization/settings");
      expect(result).toEqual(mockResponse.data);
    });

    it("should get order term", async () => {
      const termReferenceId = "term_ref_123";
      const mockResponse = { success: true, data: { id: "term_1" } };
      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const result = await sdk.getOrderTerm(termReferenceId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(`/order/term`, {
        params: { term_reference_id: termReferenceId },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should get order by conversation id", async () => {
      const conversationId = "conv-123";
      const mockResponse = {
        success: true,
        data: {
          id: "order-1",
          reference_id: "ref-1",
          amount: 100,
          currency: "TRY",
        },
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const order = await sdk.getOrderByConversationId(conversationId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/order/conversation/${conversationId}`
      );
      expect(order).toEqual(mockResponse.data);
    });

    it("should get order submerchants", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [{ id: "sub-1", name: "Submerchant 1" }],
          pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        },
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const result = await sdk.getOrderSubmerchants({ page: 1, per_page: 10 });

      expect(mockHttpClient.get).toHaveBeenCalledWith("/order/submerchants", {
        params: { page: 1, per_page: 10 },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should refund all order", async () => {
      const referenceId = "ref-123";
      const mockResponse = {
        success: true,
        data: {
          refundId: "refund-1",
          referenceId: referenceId,
          status: "completed",
          amount: 100,
          currency: "TRY",
          createdAt: "2023-01-01",
        },
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await sdk.refundAllOrder(referenceId);

      expect(mockHttpClient.post).toHaveBeenCalledWith("/order/refund-all", {
        reference_id: referenceId,
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("should redirect subscription", async () => {
      const request: SubscriptionRedirectRequest = {
        subscription_id: "sub-123",
      };
      const mockResponse = {
        success: true,
        data: {
          url: "https://example.com/redirect",
        },
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const result = await sdk.redirectSubscription(request);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        "/subscription/redirect",
        request
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
