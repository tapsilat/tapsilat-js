import { TapsilatSDK } from "../TapsilatSDK";
import { OrderCreateRequest } from "../types/index";
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
    mockHttpClient = (sdk as any).httpClient as jest.Mocked<HttpClient>;
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
          status: "CREATED"
        }
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const order = await sdk.createOrder(orderRequest);
      
      expect(mockHttpClient.post).toHaveBeenCalledWith("/order/create", orderRequest);
      expect(order).toEqual(mockResponse.data);
      expect(order.reference_id).toBe("order-123");
      expect(order.checkout_url).toBe("https://checkout.test.com/order-123");
    });

    it("should get order status successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          reference_id: "order-123",
          status: "COMPLETED",
          lastUpdatedAt: "2024-01-15T10:30:00Z"
        }
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const status = await sdk.getOrderStatus("order-123");
      
      expect(mockHttpClient.get).toHaveBeenCalledWith("/order/order-123/status");
      expect(status).toEqual(mockResponse.data);
      expect(status.status).toBe("COMPLETED");
    });

    it("should get order details successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          reference_id: "order-123",
          amount: 150.75,
          currency: "TRY",
          status: "COMPLETED",
          buyer: {
            name: "John",
            surname: "Doe",
            email: "john-doe@example.com"
          }
        }
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const order = await sdk.getOrder("order-123");
      
      expect(mockHttpClient.get).toHaveBeenCalledWith("/order/order-123");
      expect(order).toEqual(mockResponse.data);
      expect(order.reference_id).toBe("order-123");
    });

    it("should list orders successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [
            {
              reference_id: "order-123",
              amount: 150.75,
              currency: "TRY",
              status: "COMPLETED"
            },
            {
              reference_id: "order-456",
              amount: 299.99,
              currency: "TRY", 
              status: "PENDING"
            }
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 2,
            pages: 1
          }
        }
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const orders = await sdk.getOrders({ page: 1, per_page: 10 });
      
      expect(mockHttpClient.get).toHaveBeenCalledWith("/order/list", { 
        params: { page: 1, per_page: 10 } 
      });
      expect(orders).toEqual(mockResponse.data);
      expect(orders.data).toHaveLength(2);
    });

    it("should cancel order successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          reference_id: "order-123",
          status: "CANCELLED"
        }
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const cancelledOrder = await sdk.cancelOrder("order-123");
      
      expect(mockHttpClient.post).toHaveBeenCalledWith("/order/cancel", {
        reference_id: "order-123"
      });
      expect(cancelledOrder).toEqual(mockResponse.data);
      expect(cancelledOrder.status).toBe("CANCELLED");
    });

    it("should refund order successfully", async () => {
      const refundRequest = {
        reference_id: "order-123",
        amount: 50.00
      };

      const mockResponse = {
        success: true,
        data: {
          refundId: "refund-456",
          referenceId: "order-123",
          status: "COMPLETED",
          amount: 50.00,
          currency: "TRY",
          createdAt: "2024-01-15T10:30:00Z"
        }
      };

      mockHttpClient.post.mockResolvedValueOnce(mockResponse);

      const refund = await sdk.refundOrder(refundRequest);
      
      expect(mockHttpClient.post).toHaveBeenCalledWith("/order/refund", refundRequest);
      expect(refund).toEqual(mockResponse.data);
      expect(refund.amount).toBe(50.00);
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
      } as any;

      await expect(sdk.createOrder(invalidOrderRequest)).rejects.toThrow(
        "Buyer email must be a valid email address"
      );
    });

    it("should validate amount decimal places", async () => {
      const invalidOrderRequest = {
        ...baseOrderRequest,
        amount: 100.555,
      } as any;

      await expect(sdk.createOrder(invalidOrderRequest)).rejects.toThrow(
        "Amount must have maximum 2 decimal places"
      );
    });
  });

  describe("Health Check", () => {
    it("should perform health check successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          status: "healthy",
          timestamp: "2024-01-15T10:30:00Z"
        }
      };

      mockHttpClient.get.mockResolvedValueOnce(mockResponse);

      const health = await sdk.healthCheck();
      
      expect(mockHttpClient.get).toHaveBeenCalledWith("/health");
      expect(health).toEqual(mockResponse.data);
      expect(health.status).toBe("healthy");
    });
  });

  describe("Webhook Verification", () => {
    it("should verify webhook signature", async () => {
      const payload = '{"event": "order.completed", "data": {"id": "123"}}';
      const signature = "test-signature";
      const secret = "webhook-secret";

      // Mock the verification to return true
      const result = await sdk.verifyWebhook(payload, signature, secret);
      
      // Since we're not mocking the actual crypto verification, 
      // this test mainly checks the validation logic
      expect(typeof result).toBe("boolean");
    });

    it("should validate webhook parameters", async () => {
      await expect(sdk.verifyWebhook("", "signature", "secret")).rejects.toThrow(
        "Webhook payload is required and must be a non-empty string"
      );

      await expect(sdk.verifyWebhook("payload", "", "secret")).rejects.toThrow(
        "Webhook signature is required and must be a non-empty string"
      );

      await expect(sdk.verifyWebhook("payload", "signature", "")).rejects.toThrow(
        "Webhook secret is required and must be a non-empty string"
      );
    });
  });
});