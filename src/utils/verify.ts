import crypto from "crypto";
import { TapsilatValidationError } from "../errors/TapsilatError";

/** The header that carries the signature of every callback Tapsilat sends */
export const WEBHOOK_SIGNATURE_HEADER = "Tapsilat-Signature";

/** How many seconds a callback's signature timestamp may differ from the current time */
export const WEBHOOK_TOLERANCE = 300;

/**
 * @category Webhooks
 * @summary Options for webhook signature verification
 * @interface WebhookVerifyOptions
 */
export interface WebhookVerifyOptions {
  /** Seconds the signature timestamp may differ from `now`; 0 disables the check. Defaults to 300 */
  tolerance?: number;
  /** Unix time in seconds to compare the signature timestamp with. Defaults to the current time */
  now?: number;
}

const LEGACY_PREFIX = "sha256=";

const hmacHex = (secret: string, ...parts: Array<string | Uint8Array>): string => {
  const hmac = crypto.createHmac("sha256", secret);
  for (const part of parts) {
    hmac.update(part);
  }
  return hmac.digest("hex");
};

// Compare in constant time so the signature cannot be guessed byte by byte
const safeEqual = (expected: string, candidate: string): boolean => {
  const a = Buffer.from(expected);
  const b = Buffer.from(candidate);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const checkSeconds = (value: unknown, name: string): number | undefined => {
  if (value !== undefined && (typeof value !== "number" || Number.isNaN(value))) {
    throw new TapsilatValidationError(`Webhook ${name} must be a number of seconds`);
  }
  return value;
};

// WEBHOOK SIGNATURE VERIFICATION
// Summary: Verify the Tapsilat-Signature header of a callback
// Description: Checks the timestamped HMAC-SHA256 that Tapsilat signs every callback with
/**
 * Verifies the Tapsilat-Signature header of a callback against the organization's webhook secret
 *
 * @summary Verify the Tapsilat-Signature header of a callback
 * @description
 * Tapsilat sends "t=<unix timestamp>,v1=<hex HMAC-SHA256 of '<timestamp>.<raw body>'>". The timestamp
 * must be within `tolerance` seconds of `now` so that a captured callback cannot be replayed. The
 * comparison takes constant time.
 *
 * A bare hex HMAC-SHA256 of the payload, with or without a "sha256=" prefix, is still accepted for
 * signatures made the way earlier versions of this SDK documented.
 *
 * @param payload - The raw request body, before any JSON decoding
 * @param signature - The Tapsilat-Signature header
 * @param secret - The webhook secret from the panel's callback settings
 * @param options - Timestamp tolerance and the current time
 * @returns true when the signature is valid; false when it is missing, malformed, stale or wrong
 * @throws {TapsilatValidationError} When payload is not a string or bytes, or an option is not a number
 */
export const verifyWebhookSignature = (
  payload: string | Uint8Array,
  signature: string | null | undefined,
  secret: string,
  options: WebhookVerifyOptions = {}
): boolean => {
  if (typeof payload !== "string" && !(payload instanceof Uint8Array)) {
    throw new TapsilatValidationError(
      "Webhook payload must be the raw request body as a string or Buffer"
    );
  }
  const tolerance = checkSeconds(options.tolerance, "tolerance") ?? WEBHOOK_TOLERANCE;
  const now = checkSeconds(options.now, "now") ?? Math.floor(Date.now() / 1000);

  const header = typeof signature === "string" ? signature.trim() : "";
  if (header === "" || typeof secret !== "string" || secret === "") {
    return false;
  }

  if (header.startsWith(LEGACY_PREFIX) || !header.includes("=")) {
    const legacy = header.startsWith(LEGACY_PREFIX) ? header.slice(LEGACY_PREFIX.length) : header;
    return safeEqual(hmacHex(secret, payload), legacy.toLowerCase());
  }

  let timestamp: string | undefined;
  const candidates: string[] = [];
  for (const part of header.split(",")) {
    const pair = part.trim();
    const separator = pair.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (key === "t") {
      timestamp = value;
    } else if (key === "v1") {
      candidates.push(value.toLowerCase());
    }
  }
  if (timestamp === undefined || !/^[0-9]+$/.test(timestamp) || candidates.length === 0) {
    return false;
  }
  const signedAt = Number(timestamp);
  if (!Number.isSafeInteger(signedAt)) {
    return false;
  }
  if (tolerance > 0 && Math.abs(now - signedAt) > tolerance) {
    return false;
  }

  const expected = hmacHex(secret, `${timestamp}.`, payload);
  let valid = false;
  for (const candidate of candidates) {
    valid = safeEqual(expected, candidate) || valid;
  }
  return valid;
};
