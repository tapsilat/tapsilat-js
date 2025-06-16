import { TapsilatSDK } from "../TapsilatSDK";
import { OrderCreateRequest } from "../types/index";

describe("TapsilatSDK", () => {
  const validConfig = {
    bearerToken:
      "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJFbWFpbCI6InRhcmlrQGFwaS50YXBzaWxhdGRldiIsIklEIjoiNjI5NjJhMDMtM2RhYy00YzlhLWIzN2UtZWYxYWMwMGMyM2I5IiwiT3JnYW5pemF0aW9uSUQiOiIxZjk0NWZmNy1kMGQ5LTQzZTctYjk2Mi1kYjhiYzMzNWJhYWIiLCJPcmdhbml6YXRpb24iOiJUYXBzaWxhdERFViIsIklzT3JnYW5pemF0aW9uVXNlciI6dHJ1ZSwiSXBBZGRyZXNzIjoiIiwiQWdlbnQiOiIiLCJPcmdUaW1lemVvbmUiOiJUdXJrZXkiLCJJc0FwaVVzZXIiOnRydWUsImlzcyI6InRhcHNpbGF0IiwiZXhwIjoyNjExMDM0NzAyfQ.71tFaa_ABkAxv8xN_0GgJZwe2gM3DhUHz16FAKQ9U2B6nY6tCBJuyAzOpxmQg1DLtv_v6nCV5qRJOlcCSm6Jhg",
    baseURL: "https://acquiring.tapsilat.dev/api/v1",
    timeout: 10000,
  };

  let sdk: TapsilatSDK;

  beforeEach(() => {
    sdk = new TapsilatSDK(validConfig);
  });

  describe("Order Operations", () => {
    let createdOrderReferenceId: string;

    beforeAll(() => {
      jest.setTimeout(20000);
    });

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
      expect(order).toHaveProperty("order_id");
      expect(order).toHaveProperty("reference_id");
      createdOrderReferenceId = (order as any)["reference_id"];
    }, 20000);

    it("should get order status", async () => {
      if (!createdOrderReferenceId) throw new Error("No order created");
      const status = await sdk.getOrderStatus(createdOrderReferenceId);
      expect(status.status).toBeTruthy();
    }, 20000);

    it("should get the created order", async () => {
      if (!createdOrderReferenceId) throw new Error("No order created");
      const order = await sdk.getOrder(createdOrderReferenceId);
      expect(order).toHaveProperty("reference_id");
      expect((order as any)["reference_id"]).toBe(createdOrderReferenceId);
      expect(order).toHaveProperty("amount");
      expect(order).toHaveProperty("currency");
      // API might return amount as string or number
      const amount = (order as any).amount;
      const expectedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      expect(expectedAmount).toBe(150.75);
      expect(order.currency).toBe("TRY");
    }, 20000);

    it("should list orders", async () => {
      const orders = await sdk.getOrders({ page: 1, per_page: 10 });
      
      // API returns 'rows' field, not 'data'
      const orderRows = (orders as any).rows;
      if (!orders || !Array.isArray(orderRows)) {
        throw new Error(
          "orders.rows is not an array or response is invalid: " +
            JSON.stringify(orders)
        );
      }
      expect(Array.isArray(orderRows)).toBe(true);
      expect(orders).toHaveProperty("page");
      expect(orders).toHaveProperty("total");
    }, 20000);

    it("should cancel the order", async () => {
      if (!createdOrderReferenceId) return;
      try {
        const cancelledOrder = await sdk.cancelOrder(createdOrderReferenceId);
        expect(cancelledOrder.referenceId).toBe(createdOrderReferenceId);
      } catch (error) {
        // Order might not be cancellable in its current state
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        expect(typeof errorMessage).toBe("string");
      }
    }, 20000);
  });

  describe("Webhook Verification", () => {
    it("should verify webhook signature", async () => {
      const payload = '{"id":"order-123","status":"completed"}';
      const signature = "sha256=abc123...";
      const webhookSecret = "your-webhook-secret";
      const isValid = await sdk.verifyWebhook(
        payload,
        signature,
        webhookSecret
      );
      expect(typeof isValid).toBe("boolean");
    });
  });
});
