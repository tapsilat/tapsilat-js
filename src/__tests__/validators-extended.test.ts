import { validateGsmNumber, validateInstallments } from "../utils/validators";

describe("Extended Validators", () => {
  describe("validateGsmNumber", () => {
    it("should validate Turkish GSM numbers correctly", () => {
      // Valid formats
      expect(validateGsmNumber("+90 555 123 45 67")).toEqual({
        isValid: true,
        cleanedNumber: "+905551234567",
        originalNumber: "+90 555 123 45 67",
      });

      expect(validateGsmNumber("0555 123 45 67")).toEqual({
        isValid: true,
        cleanedNumber: "+905551234567",
        originalNumber: "0555 123 45 67",
      });

      expect(validateGsmNumber("555 123 45 67")).toEqual({
        isValid: true,
        cleanedNumber: "+905551234567",
        originalNumber: "555 123 45 67",
      });

      expect(validateGsmNumber("5551234567")).toEqual({
        isValid: true,
        cleanedNumber: "+905551234567",
        originalNumber: "5551234567",
      });

      expect(validateGsmNumber("90 555 123 45 67")).toEqual({
        isValid: true,
        cleanedNumber: "+905551234567",
        originalNumber: "90 555 123 45 67",
      });
    });

    it("should handle various formatting", () => {
      expect(validateGsmNumber("(555) 123-45-67")).toEqual({
        isValid: true,
        cleanedNumber: "+905551234567",
        originalNumber: "(555) 123-45-67",
      });

      expect(validateGsmNumber("555.123.45.67")).toEqual({
        isValid: true,
        cleanedNumber: "+905551234567",
        originalNumber: "555.123.45.67",
      });
    });

    it("should validate operator prefixes", () => {
      // Valid operator prefixes
      const validPrefixes = [
        "50",
        "51",
        "52",
        "53",
        "54",
        "55",
        "56",
        "57",
        "58",
        "59",
      ];

      validPrefixes.forEach((prefix) => {
        expect(validateGsmNumber(`${prefix}12345678`)).toEqual({
          isValid: true,
          cleanedNumber: `+90${prefix}12345678`,
          originalNumber: `${prefix}12345678`,
        });
      });

      // Invalid operator prefix
      expect(validateGsmNumber("4951234567")).toEqual({
        isValid: false,
        error:
          "Invalid Turkish GSM number format. Must be 10 digits starting with 5",
        originalNumber: "4951234567",
      });
    });

    it("should reject invalid numbers", () => {
      // Too short
      expect(validateGsmNumber("555123")).toEqual({
        isValid: false,
        error:
          "Invalid Turkish GSM number format. Must be 10 digits starting with 5",
        originalNumber: "555123",
      });

      // Too long
      expect(validateGsmNumber("55512345678")).toEqual({
        isValid: false,
        error:
          "Invalid Turkish GSM number format. Must be 10 digits starting with 5",
        originalNumber: "55512345678",
      });

      // Doesn't start with 5
      expect(validateGsmNumber("4551234567")).toEqual({
        isValid: false,
        error:
          "Invalid Turkish GSM number format. Must be 10 digits starting with 5",
        originalNumber: "4551234567",
      });

      // Empty string
      expect(validateGsmNumber("")).toEqual({
        isValid: false,
        error: "GSM number must be a non-empty string",
        originalNumber: "",
      });
    });

    it("should handle number input", () => {
      expect(validateGsmNumber(5551234567)).toEqual({
        isValid: true,
        cleanedNumber: "+905551234567",
        originalNumber: "5551234567",
      });
    });
  });

  describe("validateInstallments", () => {
    it("should handle single number input", () => {
      expect(validateInstallments(3)).toEqual({
        isValid: true,
        validatedInstallments: [3],
        originalInput: "3",
      });

      expect(validateInstallments(12)).toEqual({
        isValid: true,
        validatedInstallments: [12],
        originalInput: "12",
      });
    });

    it("should handle string input", () => {
      expect(validateInstallments("6")).toEqual({
        isValid: true,
        validatedInstallments: [6],
        originalInput: "6",
      });

      expect(validateInstallments("1,3,6,12")).toEqual({
        isValid: true,
        validatedInstallments: [1, 3, 6, 12],
        originalInput: "1,3,6,12",
      });

      expect(validateInstallments("12, 6, 3, 1")).toEqual({
        isValid: true,
        validatedInstallments: [1, 3, 6, 12],
        originalInput: "12, 6, 3, 1",
      });
    });

    it("should handle array input", () => {
      expect(validateInstallments([1, 3, 6])).toEqual({
        isValid: true,
        validatedInstallments: [1, 3, 6],
        originalInput: "1,3,6",
      });

      expect(validateInstallments([12, 3, 6, 1])).toEqual({
        isValid: true,
        validatedInstallments: [1, 3, 6, 12],
        originalInput: "12,3,6,1",
      });
    });

    it("should remove duplicates and sort", () => {
      expect(validateInstallments([3, 1, 6, 3, 12])).toEqual({
        isValid: true,
        validatedInstallments: [1, 3, 6, 12],
        originalInput: "3,1,6,3,12",
      });

      expect(validateInstallments("6,3,12,6,1")).toEqual({
        isValid: true,
        validatedInstallments: [1, 3, 6, 12],
        originalInput: "6,3,12,6,1",
      });
    });

    it("should default empty values to [1]", () => {
      expect(validateInstallments("")).toEqual({
        isValid: true,
        validatedInstallments: [1],
        originalInput: "",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInstallments(null as any)).toEqual({
        isValid: true,
        validatedInstallments: [1],
        originalInput: "null",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInstallments(undefined as any)).toEqual({
        isValid: true,
        validatedInstallments: [1],
        originalInput: "undefined",
      });
    });

    it("should validate installment ranges", () => {
      // Valid range
      expect(validateInstallments(36)).toEqual({
        isValid: true,
        validatedInstallments: [36],
        originalInput: "36",
      });

      // Too high
      expect(validateInstallments(37)).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Installment values cannot exceed 36, got: 37",
        originalInput: "37",
      });

      // Zero - should default to [1]
      expect(validateInstallments(0)).toEqual({
        isValid: true,
        validatedInstallments: [1],
        originalInput: "0",
      });

      // Negative
      expect(validateInstallments(-1)).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Installment values must be positive integers, got: -1",
        originalInput: "-1",
      });
    });

    it("should reject invalid input types", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInstallments({} as any)).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Installments must be a number, string, or array of numbers",
        originalInput: "[object Object]",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInstallments(true as any)).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Installments must be a number, string, or array of numbers",
        originalInput: "true",
      });
    });

    it("should handle invalid string values", () => {
      expect(validateInstallments("abc")).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Invalid installment value: abc",
        originalInput: "abc",
      });

      expect(validateInstallments("1,abc,3")).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Invalid installment value: abc",
        originalInput: "1,abc,3",
      });
    });

    it("should handle invalid array values", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(validateInstallments([1, "abc", 3] as any)).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Invalid installment value at index 1: abc",
        originalInput: "1,abc,3",
      });

      expect(validateInstallments([1, NaN, 3])).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Invalid installment value at index 1: NaN",
        originalInput: "1,NaN,3",
      });
    });

    it("should handle decimal numbers", () => {
      expect(validateInstallments(3.5)).toEqual({
        isValid: false,
        validatedInstallments: [1],
        error: "Installment values must be positive integers, got: 3.5",
        originalInput: "3.5",
      });
    });
  });
});
