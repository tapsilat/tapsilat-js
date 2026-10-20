const CODES = {
  RECEIVED: 1,
  UNPAID: 2,
  PAID: 3,
  PROCESSING: 4,
  SHIPPED: 5,
  ON_HOLD: 6,
  WAITING_FOR_PAYMENT: 7,
  CANCELLED: 8,
  COMPLETED: 9,
  REFUNDED: 10,
  FRAUD: 11,
  REJECTED: 12,
  FAILURE: 13,
  RETRYING: 14,
  PARTIALLY_REFUNDED: 15,
  SUB_MERCHANT_PAYMENT_APPROVED: 16,
  SUB_MERCHANT_PAYMENT_DISAPPROVED: 17,
  SUB_MERCHANT_PAYMENT_ERRORED: 18,
  STILL_HAS_UNPAID_INSTALLMENTS: 19,
  STILL_HAS_UNPAID_TERMS: 20,
  EXPIRED: 21,
  STILL_HAS_UNPAID_SUB_MERCHANT_PAYMENTS: 22,
  PARTIALLY_PAID: 23,
  TERMINATED: 24,
  CARD_TOKENIZATION: 25,
  PRE_AUTHORIZED: 26,
  DISPUTED: 27,
  PARTIALLY_DISPUTED: 28,
  SUSPECT: 29,
} as const;

/**
 * @category Order Management
 * @summary Numeric order status code, as callbacks and order details carry it
 */
export type OrderStatusCode = (typeof CODES)[keyof typeof CODES];

/** The status names that GET /order/{reference_id}/status returns */
const NAMES: Readonly<Record<OrderStatusCode, string>> = Object.freeze({
  [CODES.RECEIVED]: "Received",
  [CODES.UNPAID]: "Unpaid",
  [CODES.PAID]: "Paid",
  [CODES.PROCESSING]: "Processing",
  [CODES.SHIPPED]: "Shipped",
  [CODES.ON_HOLD]: "On hold",
  [CODES.WAITING_FOR_PAYMENT]: "Waiting for payment",
  [CODES.CANCELLED]: "Cancelled",
  [CODES.COMPLETED]: "Completed",
  [CODES.REFUNDED]: "Refunded",
  [CODES.FRAUD]: "Fraud",
  [CODES.REJECTED]: "Rejected",
  [CODES.FAILURE]: "Failure",
  [CODES.RETRYING]: "Retrying",
  [CODES.PARTIALLY_REFUNDED]: "Partially refunded",
  [CODES.SUB_MERCHANT_PAYMENT_APPROVED]: "Sub merchant payment approved",
  [CODES.SUB_MERCHANT_PAYMENT_DISAPPROVED]: "Sub merchant payment disapproved",
  [CODES.SUB_MERCHANT_PAYMENT_ERRORED]: "Sub merchant payment errored",
  [CODES.STILL_HAS_UNPAID_INSTALLMENTS]: "Still has unpaid installments",
  [CODES.STILL_HAS_UNPAID_TERMS]: "Still has unpaid terms",
  [CODES.EXPIRED]: "Expired",
  [CODES.STILL_HAS_UNPAID_SUB_MERCHANT_PAYMENTS]: "Still has unpaid sub merchant payments",
  [CODES.PARTIALLY_PAID]: "Partially Paid",
  [CODES.TERMINATED]: "Terminated",
  [CODES.CARD_TOKENIZATION]: "Card Tokenization",
  [CODES.PRE_AUTHORIZED]: "Pre Authorized",
  [CODES.DISPUTED]: "Disputed",
  [CODES.PARTIALLY_DISPUTED]: "Partially disputed",
  [CODES.SUSPECT]: "Suspect",
});

/** Statuses of an order whose payment was captured */
const PAID_STATUSES: readonly OrderStatusCode[] = Object.freeze([
  CODES.PAID,
  CODES.COMPLETED,
  CODES.SUB_MERCHANT_PAYMENT_APPROVED,
]);

/** Statuses of an order that will not be paid */
const FAILED_STATUSES: readonly OrderStatusCode[] = Object.freeze([
  CODES.CANCELLED,
  CODES.FRAUD,
  CODES.REJECTED,
  CODES.FAILURE,
  CODES.EXPIRED,
  CODES.TERMINATED,
]);

/** Statuses of an order whose payment was refunded in full or in part */
const REFUNDED_STATUSES: readonly OrderStatusCode[] = Object.freeze([CODES.REFUNDED, CODES.PARTIALLY_REFUNDED]);

const isCode = (value: number): value is OrderStatusCode =>
  Object.prototype.hasOwnProperty.call(NAMES, value);

/**
 * Returns the status code for a code, a numeric string such as order_lite callbacks send, or a status
 * name such as "Paid" (case-insensitive), or null when the value is not a status
 */
const code = (status: unknown): OrderStatusCode | null => {
  if (typeof status === "number") {
    return Number.isInteger(status) && isCode(status) ? status : null;
  }
  if (typeof status !== "string") {
    return null;
  }
  const trimmed = status.trim();
  if (/^[0-9]+$/.test(trimmed)) {
    return code(Number(trimmed));
  }
  const lower = trimmed.toLowerCase();
  for (const [value, label] of Object.entries(NAMES)) {
    if (label.toLowerCase() === lower) {
      return Number(value) as OrderStatusCode;
    }
  }
  return null;
};

/** Returns the status name, such as "Paid", or null when the value is not a status */
const name = (status: unknown): string | null => {
  const statusCode = code(status);
  return statusCode === null ? null : NAMES[statusCode];
};

const inGroup = (group: readonly OrderStatusCode[], status: unknown): boolean => {
  const statusCode = code(status);
  return statusCode !== null && group.includes(statusCode);
};

/**
 * @category Order Management
 * @summary Order status codes, their names and the paid, failed and refunded groups
 * @description
 * The numeric codes that callbacks and order details carry, and the names that
 * GET /order/{reference_id}/status returns for them. Every helper accepts a code, a numeric string or
 * a name.
 *
 * @example
 * ```typescript
 * const { status } = await tapsilat.getOrderStatus(referenceId); // e.g. "Waiting for payment"
 * OrderStatus.isPaid(status); // Paid, Completed, Sub merchant payment approved
 * OrderStatus.code(status); // 7; also accepts "7" or 7
 * ```
 */
export const OrderStatus = Object.freeze({
  ...CODES,
  NAMES,
  PAID_STATUSES,
  FAILED_STATUSES,
  REFUNDED_STATUSES,
  /** The code for a code, a numeric string or a name (case-insensitive), or null */
  code,
  /** The status name, such as "Paid", or null */
  name,
  /** Paid, Completed or Sub merchant payment approved */
  isPaid: (status: unknown): boolean => inGroup(PAID_STATUSES, status),
  /** Cancelled, Fraud, Rejected, Failure, Expired or Terminated */
  isFailed: (status: unknown): boolean => inGroup(FAILED_STATUSES, status),
  /** Refunded or Partially refunded */
  isRefunded: (status: unknown): boolean => inGroup(REFUNDED_STATUSES, status),
} as const);
