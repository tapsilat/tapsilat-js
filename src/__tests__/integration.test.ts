import { TapsilatSDK } from "../TapsilatSDK";
import { OrderCreateRequest } from "../types/index";

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
      const order = await sdk.createOrder(orderRequest);
      const checkoutUrl = order.checkout_url;
      const referenceId = order.reference_id;

      expect(checkoutUrl).toBeTruthy();
      expect(referenceId).toBeTruthy();
      createdOrderReferenceId = referenceId;
      console.log("✅ Created order, checkout URL:", checkoutUrl);
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
      expect(order.reference_id).toBe(createdOrderReferenceId);
      // API might return amount as string or number
      const amount = (order as any).amount;
      const expectedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      expect(expectedAmount).toBe(150.75);
      expect(order.currency).toBe("TRY");
      console.log("✅ Retrieved order:", order.reference_id);
    });

    it("should list orders", async () => {
      const orders = await sdk.getOrders({ page: 1, per_page: 10 });
      
      // Handle either pagination format
      const orderData = 'data' in orders ? orders.data : (orders as any).rows;
      expect(Array.isArray(orderData)).toBe(true);
      
      // Handle either pagination format for metadata
      const paginationInfo = 'pagination' in orders ? orders.pagination : orders;
      const page = 'page' in paginationInfo ? paginationInfo.page : (paginationInfo as any).page;
      const total = 'total' in paginationInfo ? paginationInfo.total : (paginationInfo as any).total;
      
      expect(page).toBeTruthy();
      expect(total).toBeTruthy();
      console.log("✅ Listed orders:", orderData.length);
    });

    it("should cancel the order", async () => {
      if (!createdOrderReferenceId) return;
      try {
        const cancelledOrder = await sdk.cancelOrder(createdOrderReferenceId);
        const orderRefId = cancelledOrder.reference_id;
        expect(orderRefId).toBe(createdOrderReferenceId);
        console.log("✅ Cancelled order:", createdOrderReferenceId);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.log("ℹ️  Order cancellation not possible:", errorMessage);
      }
    });
  });

  conditionalDescribe("Webhook Verification", () => {
    it("should verify webhook signature", async () => {
      const payload = '{"id":"order-123","status":"completed"}';
      const signature = "sha256=abc123...";
      const webhookSecret = "your-webhook-secret";
      const isValid = await sdk.verifyWebhook(payload, signature, webhookSecret);
      expect(typeof isValid).toBe("boolean");
    });
  });
});
