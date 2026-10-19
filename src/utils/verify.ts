import crypto from "crypto";

// WEBHOOK SIGNATURE VERIFICATION
// Summary: Security verification of webhook payloads using HMAC-SHA256
// Description: Computes expected signature from payload and secret, compares with provided signature
/**
 * Verifies HMAC-SHA256 signature for webhook security
 *
 * @summary Security verification of webhook payloads using HMAC-SHA256
 * @description Computes expected signature from payload and secret, compares with provided signature
 *
 * @param payload - Raw webhook payload string
 * @param signature - Webhook signature from headers (should include "sha256=" prefix)
 * @param secret - Your webhook secret key
 * @returns true if signature is valid, false otherwise
 */
export const verifyHmacSignature = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const expected = Buffer.from(`sha256=${expectedSignature}`);
  const provided = Buffer.from(signature ?? "");
  // Compare in constant time so the signature cannot be guessed byte by byte
  return (
    expected.length === provided.length &&
    crypto.timingSafeEqual(expected, provided)
  );
};
