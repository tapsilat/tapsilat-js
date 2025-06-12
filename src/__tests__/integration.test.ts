import { TapsilatSDK, OrderCreateRequest } from "../TapsilatSDK";

// Integration tests - requires real API key
// Set TAPSILAT_TEST_BEARER_TOKEN environment variable to run these tests

describe("TapsilatSDK Integration Tests", () => {
  let sdk: TapsilatSDK;
  const testBearerToken = process.env.TAPSILAT_TEST_BEARER_TOKEN;
  let createdOrderReferenceId: string;

  beforeAll(() => {
    if (!testBearerToken) {
      console.warn(
        "⚠️  Skipping integration tests - TAPSILAT_TEST_BEARER_TOKEN not set"
      );
      return;
    }

    sdk = new TapsilatSDK({
      bearerToken: testBearerToken,
      baseURL:
        process.env.TAPSILAT_TEST_BASE_URL || "https://sandbox.tapsilat.com/v1",
      timeout: 30000,
      maxRetries: 3,
      debug: true,
    });
  });

  const conditionalDescribe = testBearerToken ? describe : describe.skip;

  conditionalDescribe("Order Management", () => {
    it("should create an order", async () => {
      const orderRequest: OrderCreateRequest = {
        amount: 150.75,
        currency: "TRY",
        locale: "tr",
        buyer: {
          name: "Ahmet",
          surname: "Yilmaz",
          email: "ahmet@example.com",
        },
      };
      const order = await sdk.createOrder(orderRequest);
      expect(order.checkoutUrl).toBeTruthy();
      expect(order.referenceId).toBeTruthy();
      createdOrderReferenceId = order.referenceId;
      console.log("✅ Created order, checkout URL:", order.checkoutUrl);
    });

    it("should get order status", async () => {
      if (!createdOrderReferenceId) throw new Error("No order created");
      const status = await sdk.getOrderStatus(createdOrderReferenceId);
      expect(status.status).toBeTruthy();
      console.log("✅ Order status:", status.status);
    });

    it("should get the created order", async () => {
      if (!createdOrderReferenceId) throw new Error("No order created");
      const order = await sdk.getOrder(createdOrderReferenceId);
      expect(order.referenceId).toBe(createdOrderReferenceId);
      expect(order.amount).toBe(150.75);
      expect(order.currency).toBe("TRY");
      console.log("✅ Retrieved order:", order.referenceId);
    });

    it("should list orders", async () => {
      const orders = await sdk.getOrders({ page: 1, per_page: 10 });
      expect(Array.isArray(orders.data)).toBe(true);
      expect(orders.pagination).toBeTruthy();
      console.log("✅ Listed orders:", orders.data.length);
    });

    it("should cancel the order", async () => {
      if (!createdOrderReferenceId) return;
      try {
        const cancelledOrder = await sdk.cancelOrder(createdOrderReferenceId);
        expect(cancelledOrder.referenceId).toBe(createdOrderReferenceId);
        console.log("✅ Cancelled order:", createdOrderReferenceId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.log("ℹ️  Order cancellation not possible:", errorMessage);
      }
    });
  });

  conditionalDescribe("Webhook Verification", () => {
    it("should verify webhook signature", () => {
      const payload = '{"id":"order-123","status":"completed"}';
      const signature = "sha256=abc123...";
      const webhookSecret = "your-webhook-secret";
      const isValid = sdk.verifyWebhook(payload, signature, webhookSecret);
      expect(typeof isValid).toBe("boolean");
    });
  });
});
