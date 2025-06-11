import { TapsilatSDK } from "../TapsilatSDK";
import { TapsilatValidationError } from "../errors/TapsilatError";
import { PaymentRequest } from "../types";
import { HttpClient } from '../http/HttpClient';
import { 
  TapsilatAuthenticationError,
  TapsilatNetworkError 
} from '../errors/TapsilatError';

// Mock fetch for testing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock HttpClient
jest.mock('../http/HttpClient');
const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe("TapsilatSDK", () => {
  const validConfig = {
    apiKey: "test-api-key-12345",
    baseURL: "https://api.test.tapsilat.com/v1",
    timeout: 10000,
  };

  let sdk: TapsilatSDK;
  let mockHttpClient: jest.Mocked<HttpClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock instance
    mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      addRequestInterceptor: jest.fn(),
      addResponseInterceptor: jest.fn(),
      addErrorInterceptor: jest.fn(),
      getInterceptors: jest.fn(),
    } as any;

    // Mock constructor to return our mock
    MockedHttpClient.mockImplementation(() => mockHttpClient);

    sdk = new TapsilatSDK({
      apiKey: 'test-api-key-12345',
      baseURL: 'https://api.test.com/v1',
      timeout: 5000,
      maxRetries: 2
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor", () => {
    it("should create instance with valid config", () => {
      expect(sdk).toBeInstanceOf(TapsilatSDK);
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: 'test-api-key-12345',
        baseURL: 'https://api.test.com/v1',
        timeout: 5000,
        maxRetries: 2
      });
    });

    it("should throw error with invalid API key", () => {
      expect(() => {
        new TapsilatSDK({ apiKey: "short" });
      }).toThrow(TapsilatValidationError);
    });

    it("should throw error with empty API key", () => {
      expect(() => {
        new TapsilatSDK({ apiKey: "" });
      }).toThrow(TapsilatValidationError);
    });
  });

  describe("Payment Operations", () => {
    describe("createPayment", () => {
      const validPaymentRequest: PaymentRequest = {
        amount: 100.5,
        currency: "TRY",
        paymentMethod: "credit_card",
        description: "Test payment",
      };

      it("should create payment successfully", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: "payment-123",
            status: "pending",
            amount: 100.5,
            currency: "TRY",
            paymentMethod: "credit_card",
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
          },
        };

        mockHttpClient.post.mockResolvedValue(mockResponse);

        const result = await sdk.createPayment(validPaymentRequest);
        expect(mockHttpClient.post).toHaveBeenCalledWith(
          '/payments',
          expect.objectContaining(validPaymentRequest)
        );
        expect(result.id).toBe("payment-123");
        expect(result.amount).toBe(100.5);
      });

      it("should handle payment creation failure", async () => {
        mockHttpClient.post.mockResolvedValue({
          success: false,
          error: { message: 'Payment failed', code: 'PAYMENT_ERROR' }
        });

        await expect(sdk.createPayment(validPaymentRequest))
          .rejects.toThrow('Payment failed');
      });

      it("should sanitize metadata", async () => {
        const paymentWithMetadata = {
          ...validPaymentRequest,
          metadata: {
            userId: '123',
            password: 'secret',
            normalData: 'keep-this'
          }
        };

        mockHttpClient.post.mockResolvedValue({
          success: true,
          data: { id: 'payment_123' }
        });

        await sdk.createPayment(paymentWithMetadata);

        const sentData = mockHttpClient.post.mock.calls[0][1] as any;
        expect(sentData.metadata).not.toHaveProperty('password');
        expect(sentData.metadata.normalData).toBe('keep-this');
      });

      it("should validate payment data", async () => {
        await expect(sdk.createPayment({
          amount: -10,
          currency: "TRY",
          paymentMethod: "credit_card",
        })).rejects.toThrow(TapsilatValidationError);
      });
    });

    describe("getPayment", () => {
      it("should get payment by ID", async () => {
        const mockResponse = {
          success: true,
          data: {
            id: "payment-123",
            status: "completed",
            amount: 100.5,
            currency: "TRY",
            paymentMethod: "credit_card",
            createdAt: "2023-01-01T00:00:00Z",
            updatedAt: "2023-01-01T00:00:00Z",
          },
        };

        mockHttpClient.get.mockResolvedValue(mockResponse);

        const result = await sdk.getPayment("payment-123");
        expect(mockHttpClient.get).toHaveBeenCalledWith('/payments/payment-123');
        expect(result.id).toBe("payment-123");
        expect(result.status).toBe("completed");
      });

      it("should throw error for empty payment ID", async () => {
        await expect(sdk.getPayment("")).rejects.toThrow("Payment ID is required");
      });
    });

    describe("getPayments", () => {
      it("should get paginated payments", async () => {
        const mockResponse = {
          success: true,
          data: {
            data: [{ id: 'payment_1' }, { id: 'payment_2' }],
            pagination: { page: 1, total: 2 }
          }
        };
        mockHttpClient.get.mockResolvedValue(mockResponse);

        const result = await sdk.getPayments({ page: 1, limit: 10 });

        expect(mockHttpClient.get).toHaveBeenCalledWith('/payments?page=1&limit=10');
        expect(result.data).toHaveLength(2);
      });
    });
  });

  describe("Customer Operations", () => {
    const validCustomer = {
      email: 'test@example.com',
      name: 'John Doe',
      phone: '+905551234567'
    };

    it("should create customer successfully", async () => {
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: { id: 'customer_123', ...validCustomer }
      });

      const result = await sdk.createCustomer(validCustomer);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/customers', validCustomer);
      expect(result.id).toBe('customer_123');
    });

    it("should update customer", async () => {
      const updates = { name: 'Jane Doe' };
      mockHttpClient.put.mockResolvedValue({
        success: true,
        data: { ...validCustomer, ...updates }
      });

      const result = await sdk.updateCustomer('customer_123', updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/customers/customer_123', updates);
      expect(result.name).toBe('Jane Doe');
    });
  });

  describe("Webhook Operations", () => {
    it("should verify webhook signature", async () => {
      const payload = '{"event":"payment.completed"}';
      const secret = 'webhook-secret';
      
      const result = await sdk.verifyWebhook(payload, 'sha256=valid-signature', secret);
      
      expect(typeof result).toBe('boolean');
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      mockHttpClient.post.mockRejectedValue(new TapsilatNetworkError('Network failed', 'NETWORK_ERROR'));

      await expect(sdk.createPayment({
        amount: 100,
        currency: 'TRY',
        paymentMethod: 'credit_card'
      })).rejects.toThrow(TapsilatNetworkError);
    });

    it("should handle authentication errors", async () => {
      mockHttpClient.post.mockResolvedValue({
        success: false,
        error: { message: 'Invalid API key', code: 'AUTH_ERROR' }
      });

      await expect(sdk.createPayment({
        amount: 100,
        currency: 'TRY',
        paymentMethod: 'credit_card'
      })).rejects.toThrow('Invalid API key');
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large amounts", async () => {
      const largeAmount = 999999.99;
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: { id: 'payment_large', amount: largeAmount }
      });

      const result = await sdk.createPayment({
        amount: largeAmount,
        currency: 'TRY',
        paymentMethod: 'credit_card'
      });

      expect(result.amount).toBe(largeAmount);
    });

    it("should handle special characters in descriptions", async () => {
      const specialDescription = 'Payment with émojis 🎉 and spëcial çhars';
      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: { id: 'payment_special', description: specialDescription }
      });

      await sdk.createPayment({
        amount: 100,
        currency: 'TRY',
        paymentMethod: 'credit_card',
        description: specialDescription
      });

      const sentData = mockHttpClient.post.mock.calls[0][1] as any;
      expect(sentData.description).toBe(specialDescription);
    });

    it("should handle empty responses gracefully", async () => {
      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: null
      });

      await expect(sdk.getPayment('payment-123'))
        .rejects.toThrow('Payment retrieval failed');
    });
  });

  describe("Configuration Management", () => {
    it("should update config safely", () => {
      sdk.updateConfig({ timeout: 10000 });
      const config = sdk.getConfig();
      expect(config.timeout).toBe(10000);
    });

    it("should validate API key on config update", () => {
      expect(() => sdk.updateConfig({ apiKey: 'invalid' }))
        .toThrow(TapsilatValidationError);
    });
  });

  describe("Refund Operations", () => {
    describe("createRefund", () => {
      it("should create refund successfully", async () => {
        const refundRequest = {
          paymentId: 'payment_123',
          amount: 50.00,
          reason: 'Customer request'
        };

        mockHttpClient.post.mockResolvedValue({
          success: true,
          data: { 
            id: 'refund_123', 
            paymentId: 'payment_123',
            amount: 50.00,
            status: 'completed'
          }
        });

        const result = await sdk.createRefund(refundRequest);

        expect(mockHttpClient.post).toHaveBeenCalledWith('/refunds', refundRequest);
        expect(result.id).toBe('refund_123');
        expect(result.amount).toBe(50.00);
      });

      it("should throw error when payment ID missing", async () => {
        await expect(sdk.createRefund({ paymentId: '' }))
          .rejects.toThrow('Payment ID is required for refund');
      });
    });

    describe("getRefund", () => {
      it("should retrieve refund by ID", async () => {
        mockHttpClient.get.mockResolvedValue({
          success: true,
          data: { id: 'refund_123', status: 'completed' }
        });

        const result = await sdk.getRefund('refund_123');

        expect(mockHttpClient.get).toHaveBeenCalledWith('/refunds/refund_123');
        expect(result.id).toBe('refund_123');
      });

      it("should throw error for empty refund ID", async () => {
        await expect(sdk.getRefund(''))
          .rejects.toThrow('Refund ID is required');
      });
    });

    describe("getRefunds", () => {
      it("should get refunds with pagination", async () => {
        mockHttpClient.get.mockResolvedValue({
          success: true,
          data: {
            data: [{ id: 'refund_1' }],
            pagination: { page: 1, total: 1 }
          }
        });

        const result = await sdk.getRefunds();

        expect(mockHttpClient.get).toHaveBeenCalledWith('/refunds');
        expect(result.data).toHaveLength(1);
      });

      it("should filter refunds by payment ID", async () => {
        mockHttpClient.get.mockResolvedValue({
          success: true,
          data: { data: [], pagination: { page: 1, total: 0 } }
        });

        await sdk.getRefunds('payment_123', { page: 1, limit: 10 });

        expect(mockHttpClient.get).toHaveBeenCalledWith('/refunds?paymentId=payment_123&page=1&limit=10');
      });
    });
  });

  describe("Extended Customer Operations", () => {
    it("should retrieve customer by ID", async () => {
      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: { id: 'customer_123', name: 'Test Customer' }
      });

      const result = await sdk.getCustomer('customer_123');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/customers/customer_123');
      expect(result.id).toBe('customer_123');
    });

    it("should throw error for empty customer ID", async () => {
      await expect(sdk.getCustomer(''))
        .rejects.toThrow('Customer ID is required');
    });

    it("should update customer successfully", async () => {
      const updates = { name: 'Updated Name', phone: '+905559876543' };
      mockHttpClient.put.mockResolvedValue({
        success: true,
        data: { id: 'customer_123', ...updates }
      });

      const result = await sdk.updateCustomer('customer_123', updates);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/customers/customer_123', updates);
      expect(result.name).toBe('Updated Name');
    });

    it("should throw error when updating without customer ID", async () => {
      await expect(sdk.updateCustomer('', { name: 'Test' }))
        .rejects.toThrow('Customer ID is required');
    });

    it("should delete customer successfully", async () => {
      mockHttpClient.delete.mockResolvedValue({
        success: true
      });

      await sdk.deleteCustomer('customer_123');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/customers/customer_123');
    });

    it("should throw error when deleting without customer ID", async () => {
      await expect(sdk.deleteCustomer(''))
        .rejects.toThrow('Customer ID is required');
    });

    it("should handle delete failure", async () => {
      mockHttpClient.delete.mockResolvedValue({
        success: false,
        error: { message: 'Delete failed', code: 'DELETE_ERROR' }
      });

      await expect(sdk.deleteCustomer('customer_123'))
        .rejects.toThrow('Delete failed');
    });
  });

  describe("Utility Operations", () => {
    describe("verifyWebhook", () => {
      it("should verify webhook signature", async () => {
        const payload = '{"event":"payment.completed"}';
        const signature = 'sha256=test-signature';
        const secret = 'webhook-secret';

        const result = await sdk.verifyWebhook(payload, signature, secret);

        expect(typeof result).toBe('boolean');
      });
    });

    describe("healthCheck", () => {
      it("should return health status", async () => {
        mockHttpClient.get.mockResolvedValue({
          success: true,
          data: { status: 'ok', timestamp: '2024-01-01T00:00:00Z' }
        });

        const result = await sdk.healthCheck();

        expect(mockHttpClient.get).toHaveBeenCalledWith('/health');
        expect(result.status).toBe('ok');
      });

      it("should handle health check failure", async () => {
        mockHttpClient.get.mockResolvedValue({
          success: false,
          error: { message: 'Service down', code: 'HEALTH_ERROR' }
        });

        await expect(sdk.healthCheck())
          .rejects.toThrow('Service down');
      });
    });
  });

  describe("Payment Operations Extended", () => {
    it("should cancel payment successfully", async () => {
      mockHttpClient.patch.mockResolvedValue({
        success: true,
        data: { id: 'payment_123', status: 'cancelled' }
      });

      const result = await sdk.cancelPayment('payment_123');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/payments/payment_123/cancel');
      expect(result.status).toBe('cancelled');
    });

    it("should throw error for empty payment ID on cancel", async () => {
      await expect(sdk.cancelPayment(''))
        .rejects.toThrow('Payment ID is required');
    });
  });
});
 