import crypto from "crypto";
import { TapsilatSDK } from "../TapsilatSDK";
import { TapsilatValidationError } from "../errors/TapsilatError";
import { WebhookEvent } from "../webhooks/WebhookEvent";
import { OrderStatus } from "../webhooks/OrderStatus";
import { WEBHOOK_SIGNATURE_HEADER, WEBHOOK_TOLERANCE } from "../index";

// An order_lite callback and known-good Tapsilat-Signature values for this body and secret; the expected
// signatures were computed with openssl, independently of the SDK.
const PAYLOAD =
  '{"data":{"id":"5f0c6f1e-1111-4a5b-9c1d-2e3f4a5b6c7d",' +
  '"orderReferenceId":"0b6a4f9e-2222-4c3d-8e9f-a1b2c3d4e5f6","conversationId":"wc-1001","status":"3"},' +
  '"type":"order_lite","token":"9d8c7b6a-3333-4e5f-a6b7-c8d9e0f1a2b3"}';
const SECRET = "whsec_test";
const TIMESTAMP = 1726480000;
const SIGNATURE = "3e003945e8122172a03ae1aa56fd099b56e6ac11a8472c03e33809c7c480aeb6";
// Bare hex HMAC-SHA256 of PAYLOAD, as earlier SDK versions documented
const LEGACY_SIGNATURE = "402b9d6616b32be533a4fc0300e8db19c304a56137d3fb274c614f30f9be6fbb";

const header = (signature: string = SIGNATURE, timestamp: string | number = TIMESTAMP): string =>
  `t=${timestamp},v1=${signature}`;

describe("Webhooks", () => {
  let sdk: TapsilatSDK;

  beforeEach(() => {
    sdk = new TapsilatSDK({
      bearerToken: "test-token-12345",
      baseURL: "https://test.api.com",
    });
  });

  const verify = (
    payload: string | Uint8Array,
    signature: string | null | undefined,
    secret: string,
    tolerance?: number,
    now?: number
  ): Promise<boolean> => sdk.verifyWebhook(payload, signature, secret, { tolerance, now });

  describe("verifyWebhook", () => {
    it("exposes the header name and the default tolerance", () => {
      expect(WEBHOOK_SIGNATURE_HEADER).toBe("Tapsilat-Signature");
      expect(WEBHOOK_TOLERANCE).toBe(300);
    });

    it("verifies the Tapsilat-Signature header", async () => {
      await expect(verify(PAYLOAD, header(), SECRET, 300, TIMESTAMP + 10)).resolves.toBe(true);
      await expect(
        verify(PAYLOAD, ` t=${TIMESTAMP}, v1=${SIGNATURE.toUpperCase()} `, SECRET, 300, TIMESTAMP)
      ).resolves.toBe(true);
    });

    it("verifies a raw body passed as a Buffer", async () => {
      await expect(verify(Buffer.from(PAYLOAD), header(), SECRET, 300, TIMESTAMP)).resolves.toBe(true);
    });

    it("rejects a tampered body or the wrong secret", async () => {
      const tampered = PAYLOAD.replace('"status":"3"', '"status":"13"');

      await expect(verify(tampered, header(), SECRET, 300, TIMESTAMP)).resolves.toBe(false);
      await expect(verify(PAYLOAD, header(), "other", 300, TIMESTAMP)).resolves.toBe(false);
      await expect(verify(PAYLOAD, header(), "", 300, TIMESTAMP)).resolves.toBe(false);
      await expect(verify(PAYLOAD, "", SECRET, 300, TIMESTAMP)).resolves.toBe(false);
      await expect(verify(PAYLOAD, undefined, SECRET, 300, TIMESTAMP)).resolves.toBe(false);
    });

    it("rejects a replayed or malformed header", async () => {
      await expect(verify(PAYLOAD, header(), SECRET, 300, TIMESTAMP + 301)).resolves.toBe(false);
      await expect(verify(PAYLOAD, header(), SECRET, 300, TIMESTAMP - 301)).resolves.toBe(false);
      await expect(verify(PAYLOAD, header(), SECRET, 0, TIMESTAMP + 86400)).resolves.toBe(true);
      await expect(verify(PAYLOAD, `v1=${SIGNATURE}`, SECRET, 0, TIMESTAMP)).resolves.toBe(false);
      await expect(verify(PAYLOAD, `t=${TIMESTAMP}`, SECRET, 0, TIMESTAMP)).resolves.toBe(false);
      await expect(verify(PAYLOAD, header(SIGNATURE, "1726480000.5"), SECRET, 0, TIMESTAMP)).resolves.toBe(
        false
      );
    });

    it("rejects a timestamp too large to be a Unix time", async () => {
      const timestamp = "99999999999999999999999999";
      const signature = crypto.createHmac("sha256", SECRET).update(`${timestamp}.${PAYLOAD}`).digest("hex");

      await expect(verify(PAYLOAD, header(signature, timestamp), SECRET, 0, TIMESTAMP)).resolves.toBe(false);
    });

    it("accepts any of several v1 signatures", async () => {
      const several = `t=${TIMESTAMP},v1=${"0".repeat(64)},v1=${SIGNATURE}`;

      await expect(verify(PAYLOAD, several, SECRET, 300, TIMESTAMP)).resolves.toBe(true);
    });

    it("uses the current time by default", async () => {
      const now = Math.floor(Date.now() / 1000);
      const signature = crypto.createHmac("sha256", SECRET).update(`${now}.${PAYLOAD}`).digest("hex");

      await expect(sdk.verifyWebhook(PAYLOAD, header(signature, now), SECRET)).resolves.toBe(true);
      await expect(sdk.verifyWebhook(PAYLOAD, header(), SECRET)).resolves.toBe(false);
    });

    it("still accepts a bare or sha256= HMAC of the body", async () => {
      await expect(sdk.verifyWebhook(PAYLOAD, LEGACY_SIGNATURE, SECRET)).resolves.toBe(true);
      await expect(sdk.verifyWebhook(PAYLOAD, `sha256=${LEGACY_SIGNATURE}`, SECRET)).resolves.toBe(true);
      await expect(sdk.verifyWebhook(PAYLOAD, `sha256=${"0".repeat(64)}`, SECRET)).resolves.toBe(false);
    });

    it("passes the options through the webhooks alias", async () => {
      await expect(sdk.webhooks.verify(PAYLOAD, header(), SECRET, { now: TIMESTAMP })).resolves.toBe(true);
      await expect(sdk.webhooks.verify(PAYLOAD, header(), SECRET, { now: TIMESTAMP + 301 })).resolves.toBe(false);
    });

    it("rejects a payload that is not the raw body", async () => {
      const parsed = JSON.parse(PAYLOAD) as unknown as string;

      await expect(sdk.verifyWebhook(parsed, header(), SECRET)).rejects.toThrow(TapsilatValidationError);
      await expect(sdk.verifyWebhook(PAYLOAD, header(), SECRET, { tolerance: Number("x") })).rejects.toThrow(
        TapsilatValidationError
      );
    });
  });

  describe("WebhookEvent", () => {
    it("parses an order_lite callback", () => {
      const event = WebhookEvent.fromPayload(PAYLOAD);

      expect(event.type).toBe(WebhookEvent.TYPE_ORDER_LITE);
      expect(event.token).toBe("9d8c7b6a-3333-4e5f-a6b7-c8d9e0f1a2b3");
      expect(event.referenceId).toBe("0b6a4f9e-2222-4c3d-8e9f-a1b2c3d4e5f6");
      expect(event.conversationId).toBe("wc-1001");
      expect(event.statusCode).toBe(OrderStatus.PAID);
      expect(event.status).toBe("Paid");
      expect(event.isPaid()).toBe(true);
      expect(event.isFailed()).toBe(false);
      expect(WebhookEvent.fromPayload(Buffer.from(PAYLOAD)).referenceId).toBe(event.referenceId);
    });

    it("parses an order callback", () => {
      const event = new WebhookEvent({
        type: "order",
        token: "t-1",
        data: { id: "o-1", reference_id: "ref-1", conversation_id: "c-1", status: 13 },
      });

      expect(event.referenceId).toBe("ref-1");
      expect(event.conversationId).toBe("c-1");
      expect(event.status).toBe("Failure");
      expect(event.isFailed()).toBe(true);
    });

    it("parses an order_payment_detail callback", () => {
      const event = new WebhookEvent({
        type: "order_payment_detail",
        token: "t-2",
        data: {
          id: "d-1",
          order_reference_id: "ref-2",
          conversation_id: "c-2",
          order: { reference_id: "ref-2", id: "o-2", status: "Paid" },
          order_payment_status: { code: 0 },
        },
      });

      expect(event.referenceId).toBe("ref-2");
      expect(event.conversationId).toBe("c-2");
      expect(event.statusCode).toBe(OrderStatus.PAID);
    });

    it("parses callbacks without a status", () => {
      const extended = new WebhookEvent({
        type: "extended_order",
        data: {
          id: "o-3",
          reference_id: "ref-3",
          terms: [{ reference_id: "term-1", status: 2 }],
        },
      });
      expect(extended.referenceId).toBe("ref-3");
      expect(extended.conversationId).toBeNull();
      expect(extended.statusCode).toBeNull();
      expect(extended.isPaid()).toBe(false);

      const facilitator = new WebhookEvent({
        type: "payment_facilitator",
        data: { id: "p-1", payment_id: "pay-1", reference_id: "ref-4" },
      });
      expect(facilitator.referenceId).toBe("ref-4");
    });

    it("ignores a zero UUID", () => {
      const event = new WebhookEvent({
        type: "order_payment_detail",
        data: {
          order_reference_id: "00000000-0000-0000-0000-000000000000",
          order: { reference_id: "ref-5" },
        },
      });

      expect(event.referenceId).toBe("ref-5");
    });

    it("rejects a payload that is not a JSON object", () => {
      expect(() => WebhookEvent.fromPayload('"order"')).toThrow(TapsilatValidationError);
      expect(() => WebhookEvent.fromPayload("[]")).toThrow(TapsilatValidationError);
      expect(() => WebhookEvent.fromPayload("{")).toThrow(TapsilatValidationError);
    });
  });

  describe("OrderStatus", () => {
    it("maps codes and names and groups them", () => {
      expect(OrderStatus.code("waiting for payment")).toBe(OrderStatus.WAITING_FOR_PAYMENT);
      expect(OrderStatus.code("21")).toBe(OrderStatus.EXPIRED);
      expect(OrderStatus.code(JSON.parse("13.0"))).toBe(OrderStatus.FAILURE);
      expect(OrderStatus.name(15)).toBe("Partially refunded");
      expect(OrderStatus.code("SUCCESS")).toBeNull();
      expect(OrderStatus.code(99)).toBeNull();
      expect(OrderStatus.name(null)).toBeNull();

      expect(OrderStatus.isPaid("Sub merchant payment approved")).toBe(true);
      expect(OrderStatus.isPaid(OrderStatus.COMPLETED)).toBe(true);
      expect(OrderStatus.isPaid("Waiting for payment")).toBe(false);
      expect(OrderStatus.isFailed("Expired")).toBe(true);
      expect(OrderStatus.isFailed("Paid")).toBe(false);
      expect(OrderStatus.isRefunded("10")).toBe(true);
    });
  });
});
