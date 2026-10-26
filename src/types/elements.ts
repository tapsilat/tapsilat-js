/**
 * Request and response types for Tapsilat Elements sessions.
 *
 * Tapsilat Elements is the native Android and iOS card sheet. Your backend creates a session with
 * its secret API key and hands only the session's `client_secret` to the app, which opens the sheet
 * with it. Card data goes from the sheet to Tapsilat encrypted and never reaches your backend.
 *
 * Field names match the JSON wire format. Response fields are optional because the server omits
 * empty values. `purpose`, `status` and `brand` are plain strings so that values added later still
 * decode; compare them with the constants below.
 */

/**
 * @category Elements
 * @summary Purposes of an Elements session
 */
export const ElementsSessionPurpose = Object.freeze({
  /** Save a card for a user without charging it */
  TOKENIZE: "tokenize",
  /** Pay an existing order */
  PAY: "pay",
} as const);

/**
 * @category Elements
 * @summary Statuses of an Elements session
 */
export const ElementsSessionStatus = Object.freeze({
  REQUIRES_PAYMENT_METHOD: "requires_payment_method",
  PROCESSING: "processing",
  REQUIRES_ACTION: "requires_action",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
  EXPIRED: "expired",
  CANCELED: "canceled",
} as const);

/**
 * @category Elements
 * @summary Tokenize modes of an Elements session
 */
export const ElementsTokenizeMode = Object.freeze({
  /** 3D Secure */
  SECURE: 1,
  HALF_SECURE: 2,
  NON_SECURE: 3,
} as const);

/**
 * @category Elements
 * @summary Card brands an Elements session reports
 */
export const ElementsCardBrand = Object.freeze({
  VISA: "visa",
  MASTERCARD: "mastercard",
  AMEX: "amex",
  TROY: "troy",
  DISCOVER: "discover",
  UNIONPAY: "unionpay",
  UNKNOWN: "unknown",
} as const);

/**
 * @category Elements
 * @summary Request to create an Elements session
 * @description Sent to POST /elements/sessions. Optional fields that are undefined or null are left out of the body.
 * @interface ElementsSessionCreateRequest
 */
export interface ElementsSessionCreateRequest {
  /** `ElementsSessionPurpose.PAY` or `ElementsSessionPurpose.TOKENIZE` */
  purpose: string;
  /** The order to pay; required for a `pay` session */
  order_reference_id?: string;
  /** The card owner for a `tokenize` session, scoped to your organization */
  user_id?: string;
  user_email?: string;
  /** Tokenize mode: `ElementsTokenizeMode.SECURE` (3D Secure), `HALF_SECURE` or `NON_SECURE` */
  mode?: number;
  /** Lets the buyer save the card on a `pay` session */
  save_card?: boolean;
}

/**
 * @category Elements
 * @summary The card an Elements session used
 * @interface ElementsCardSummary
 */
export interface ElementsCardSummary {
  id?: string;
  /** One of `ElementsCardBrand`, such as "visa" */
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
}

/**
 * @category Elements
 * @summary The error of an Elements session's last failed attempt
 * @interface ElementsSessionError
 */
export interface ElementsSessionError {
  /** Stable error code, such as "card_declined" */
  code?: string;
  message?: string;
  retryable?: boolean;
}

/**
 * @category Elements
 * @summary The authoritative state of an Elements session
 * @description
 * Returned by GET /elements/sessions/{id} and POST /elements/sessions/{id}/cancel. Read it on your
 * backend before fulfilling an order, rather than trusting what the app reports. Timestamps are
 * RFC 3339 strings.
 * @interface ElementsSession
 */
export interface ElementsSession {
  /** Session ID, such as "es_test_8Kq2nV0rX4" */
  id?: string;
  /** One of `ElementsSessionPurpose` */
  purpose?: string;
  /** One of `ElementsSessionStatus` */
  status?: string;
  order_reference_id?: string;
  user_id?: string;
  attempts?: number;
  max_attempts?: number;
  created_at?: string;
  expires_at?: string;
  completed_at?: string;
  /** The card used, once one was entered; absent or null before that */
  card?: ElementsCardSummary | null;
  /** The error of the last failed attempt; absent or null when there was none */
  last_error?: ElementsSessionError | null;
}

/**
 * @category Elements
 * @summary A newly created Elements session with its client secret
 * @description
 * Returned only by POST /elements/sessions. Hand `client_secret` to the app that opens the card
 * sheet, and do not log or store it. In Node.js, `console.log` and `util.inspect` print it as
 * `[redacted]`; `JSON.stringify` keeps it, so you can still send it to the app.
 * @interface ElementsSessionCreateResponse
 */
export interface ElementsSessionCreateResponse extends ElementsSession {
  /** The secret the app opens the card sheet with */
  client_secret: string;
  /** The base URL the app's card sheet talks to */
  elements_base_url?: string;
}
