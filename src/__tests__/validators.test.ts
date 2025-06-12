import {
  validatePaymentRequest,
  validateBearerToken,
  validateEmail,
  isValidCurrency,
  isValidPaymentMethod,
  isValidUrl,
  sanitizeMetadata,
} from "../utils/validators";
import { TapsilatValidationError } from "../errors/TapsilatError";

describe("Validators", () => {
  describe("validatePaymentRequest", () => {
    const validRequest = {
      amount: 100.5,
      currency: "TRY" as const,
      paymentMethod: "credit_card" as const,
    };

    it("should validate valid payment request", () => {
      expect(() => validatePaymentRequest(validRequest)).not.toThrow();
    });

    it("should reject negative amount", () => {
      expect(() =>
        validatePaymentRequest({ ...validRequest, amount: -10 })
      ).toThrow(TapsilatValidationError);
    });

    it("should reject zero amount", () => {
      expect(() =>
        validatePaymentRequest({ ...validRequest, amount: 0 })
      ).toThrow(TapsilatValidationError);
    });

    it("should reject amount with more than 2 decimal places", () => {
      expect(() =>
        validatePaymentRequest({ ...validRequest, amount: 100.555 })
      ).toThrow(TapsilatValidationError);
    });

    it("should reject invalid currency", () => {
      expect(() =>
        validatePaymentRequest({ ...validRequest, currency: "INVALID" as any })
      ).toThrow(TapsilatValidationError);
    });

    it("should reject invalid payment method", () => {
      expect(() =>
        validatePaymentRequest({
          ...validRequest,
          paymentMethod: "invalid_method" as any,
        })
      ).toThrow(TapsilatValidationError);
    });

    it("should validate URLs when provided", () => {
      expect(() =>
        validatePaymentRequest({
          ...validRequest,
          returnUrl: "invalid-url",
        })
      ).toThrow(TapsilatValidationError);
    });
  });

  describe("validateBearerToken", () => {
    it("should accept valid bearer token", () => {
      expect(() =>
        validateBearerToken("valid-bearer-token-12345")
      ).not.toThrow();
    });

    it("should reject empty bearer token", () => {
      expect(() => validateBearerToken("")).toThrow(TapsilatValidationError);
    });

    it("should reject short bearer token", () => {
      expect(() => validateBearerToken("short")).toThrow(
        TapsilatValidationError
      );
    });

    it("should reject non-string bearer token", () => {
      expect(() => validateBearerToken(null as any)).toThrow(
        TapsilatValidationError
      );
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email", () => {
      expect(validateEmail("test@example.com")).toBe(true);
    });

    it("should reject invalid email", () => {
      expect(validateEmail("invalid-email")).toBe(false);
    });

    it("should reject email without domain", () => {
      expect(validateEmail("test@")).toBe(false);
    });
  });

  describe("isValidCurrency", () => {
    it("should accept valid currencies", () => {
      expect(isValidCurrency("TRY")).toBe(true);
      expect(isValidCurrency("USD")).toBe(true);
      expect(isValidCurrency("EUR")).toBe(true);
      expect(isValidCurrency("GBP")).toBe(true);
    });

    it("should reject invalid currencies", () => {
      expect(isValidCurrency("INVALID")).toBe(false);
      expect(isValidCurrency("")).toBe(false);
    });
  });

  describe("sanitizeMetadata", () => {
    it("should remove sensitive keys", () => {
      const input = {
        userId: "123",
        password: "secret",
        bearerToken: "hidden",
        token: "bearer-token",
        secret: "my-secret",
        normalKey: "normal-value",
      };

      const result = sanitizeMetadata(input);

      expect(result).toEqual({
        userId: "123",
        normalKey: "normal-value",
      });
    });

    it("should handle different value types", () => {
      const input = {
        stringValue: "  hello  ",
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
        undefinedValue: undefined,
        objectValue: { nested: "object" },
      };

      const result = sanitizeMetadata(input);

      expect(result).toEqual({
        stringValue: "hello",
        numberValue: 42,
        booleanValue: true,
        objectValue: "[object Object]",
      });
    });
  });
});
