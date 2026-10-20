import { TapsilatValidationError } from "../errors/TapsilatError";
import { OrderStatus, OrderStatusCode } from "./OrderStatus";

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const firstString = (values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value !== "" && value !== ZERO_UUID) {
      return value;
    }
    if (typeof value === "number" && Number.isSafeInteger(value)) {
      return String(value);
    }
  }
  return null;
};

/**
 * @category Webhooks
 * @summary A callback Tapsilat posts to an organization's callback URLs
 * @description
 * Tapsilat posts {"type": "...", "data": {...}, "token": "<delivery id>"} to the organization's callback
 * URLs and to an order's payment_success_url and payment_failure_url. The shape of "data" depends on the
 * type, which each organization chooses in the panel: "order_lite" (the default), "order",
 * "order_payment_detail", "extended_order" or "payment_facilitator". The getters read the order's
 * reference ID, conversation ID and status from whichever shape arrived.
 *
 * Verify the Tapsilat-Signature header with `verifyWebhook()` before trusting a callback.
 *
 * @example
 * ```typescript
 * const event = WebhookEvent.fromPayload(rawBody);
 * if (event.isPaid()) {
 *   await fulfil(event.referenceId);
 * }
 * ```
 */
export class WebhookEvent {
  static readonly TYPE_ORDER = "order";
  static readonly TYPE_ORDER_LITE = "order_lite";
  static readonly TYPE_ORDER_PAYMENT_DETAIL = "order_payment_detail";
  static readonly TYPE_EXTENDED_ORDER = "extended_order";
  static readonly TYPE_PAYMENT_FACILITATOR = "payment_facilitator";

  /** The callback type, such as "order_lite" */
  readonly type: string | null;
  /** Unique per delivery */
  readonly token: string | null;
  /** The callback's "data" object, or the whole payload when it has none */
  readonly data: JsonObject;
  /** The decoded payload */
  readonly payload: JsonObject;

  constructor(payload: JsonObject) {
    this.payload = payload;
    this.type = typeof payload.type === "string" ? payload.type : null;
    this.token = typeof payload.token === "string" ? payload.token : null;
    this.data = isObject(payload.data) ? payload.data : payload;
  }

  /**
   * Decodes a raw callback body
   *
   * @param payload - The raw request body
   * @throws {TapsilatValidationError} When the body is not a JSON object
   */
  static fromPayload(payload: string | Uint8Array): WebhookEvent {
    const body = typeof payload === "string" ? payload : new TextDecoder().decode(payload);
    let decoded: unknown;
    try {
      decoded = JSON.parse(body);
    } catch {
      decoded = undefined;
    }
    if (!isObject(decoded)) {
      throw new TapsilatValidationError("The webhook payload is not a JSON object");
    }
    return new WebhookEvent(decoded);
  }

  /** The order's reference ID */
  get referenceId(): string | null {
    const order = isObject(this.data.order) ? this.data.order : {};
    return firstString([
      this.data.orderReferenceId,
      this.data.order_reference_id,
      this.data.reference_id,
      order.reference_id,
    ]);
  }

  /** The conversation ID the order was created with */
  get conversationId(): string | null {
    return firstString([this.data.conversationId, this.data.conversation_id]);
  }

  /** The order status code (see OrderStatus), or null when this callback type carries none */
  get statusCode(): OrderStatusCode | null {
    const code = OrderStatus.code(this.data.status);
    if (code === null && isObject(this.data.order)) {
      return OrderStatus.code(this.data.order.status);
    }
    return code;
  }

  /** The order status name, such as "Paid" */
  get status(): string | null {
    return OrderStatus.name(this.statusCode);
  }

  isPaid(): boolean {
    return OrderStatus.isPaid(this.statusCode);
  }

  isFailed(): boolean {
    return OrderStatus.isFailed(this.statusCode);
  }

  isRefunded(): boolean {
    return OrderStatus.isRefunded(this.statusCode);
  }
}
