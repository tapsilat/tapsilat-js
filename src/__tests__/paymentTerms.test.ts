import { TapsilatSDK } from "../TapsilatSDK";
import { TapsilatValidationError } from "../errors/TapsilatError";
import {
  OrderPaymentTermCreateDTO,
  OrderPaymentTermUpdateDTO,
  PaymentTermDeleteRequest,
  OrderTermRefundRequest,
  PaymentTermTerminateRequest,
  OrderTerminateRequest,
} from "../types/index";

describe("TapsilatSDK Payment Terms", () => {
  let sdk: TapsilatSDK;

  beforeEach(() => {
    sdk = new TapsilatSDK({
      bearerToken: "test-token-12345",
      baseURL: "https://test.api.com",
    });
  });

  describe("createOrderTerm", () => {
    const validTermData: OrderPaymentTermCreateDTO = {
      order_id: "order_123",
      term_reference_id: "term_456",
      amount: 100.50,
      due_date: "2024-12-31",
      term_sequence: 1,
      required: true,
      status: "pending"
    };

    it("should validate required fields", async () => {
      const invalidData = { ...validTermData, order_id: "" };
      
      await expect(sdk.createOrderTerm(invalidData)).rejects.toThrow(
        TapsilatValidationError
      );
    });

    it("should validate amount decimal places", async () => {
      const invalidData = { ...validTermData, amount: 100.555 };
      
      await expect(sdk.createOrderTerm(invalidData)).rejects.toThrow(
        "Amount must have maximum 2 decimal places"
      );
    });

    it("should validate positive amount", async () => {
      const invalidData = { ...validTermData, amount: -50 };
      
      await expect(sdk.createOrderTerm(invalidData)).rejects.toThrow(
        "Amount must be a positive number"
      );
    });

    it("should validate term sequence is integer", async () => {
      const invalidData = { ...validTermData, term_sequence: 1.5 };
      
      await expect(sdk.createOrderTerm(invalidData)).rejects.toThrow(
        "Term sequence must be an integer"
      );
    });

    it("should validate required field is boolean", async () => {
      const invalidData = { ...validTermData, required: "true" as any };
      
      await expect(sdk.createOrderTerm(invalidData)).rejects.toThrow(
        "Required field must be a boolean"
      );
    });
  });

  describe("updateOrderTerm", () => {
    const validUpdateData: OrderPaymentTermUpdateDTO = {
      term_reference_id: "term_456",
      amount: 150.75,
      status: "updated"
    };

    it("should validate term reference ID", async () => {
      const invalidData = { ...validUpdateData, term_reference_id: "" };
      
      await expect(sdk.updateOrderTerm(invalidData)).rejects.toThrow(
        "Term reference ID is required and must be a non-empty string"
      );
    });

    it("should validate optional amount", async () => {
      const invalidData = { ...validUpdateData, amount: -100 };
      
      await expect(sdk.updateOrderTerm(invalidData)).rejects.toThrow(
        "Amount must be a positive number"
      );
    });

    it("should validate optional term sequence", async () => {
      const invalidData = { ...validUpdateData, term_sequence: 2.5 };
      
      await expect(sdk.updateOrderTerm(invalidData)).rejects.toThrow(
        "Term sequence must be an integer"
      );
    });

    it("should validate optional required field", async () => {
      const invalidData = { ...validUpdateData, required: "false" as any };
      
      await expect(sdk.updateOrderTerm(invalidData)).rejects.toThrow(
        "Required field must be a boolean"
      );
    });
  });

  describe("deleteOrderTerm", () => {
    it("should validate term reference ID", async () => {
      const invalidData: PaymentTermDeleteRequest = { term_reference_id: "" };
      
      await expect(sdk.deleteOrderTerm(invalidData)).rejects.toThrow(
        "Term reference ID is required and must be a non-empty string"
      );
    });
  });

  describe("refundOrderTerm", () => {
    const validRefundData: OrderTermRefundRequest = {
      term_id: "term_123",
      amount: 50.25
    };

    it("should validate term ID", async () => {
      const invalidData = { ...validRefundData, term_id: "" };
      
      await expect(sdk.refundOrderTerm(invalidData)).rejects.toThrow(
        "Term ID is required and must be a non-empty string"
      );
    });

    it("should validate positive amount", async () => {
      const invalidData = { ...validRefundData, amount: -25 };
      
      await expect(sdk.refundOrderTerm(invalidData)).rejects.toThrow(
        "Amount must be a positive number"
      );
    });

    it("should validate amount decimal places", async () => {
      const invalidData = { ...validRefundData, amount: 50.123 };
      
      await expect(sdk.refundOrderTerm(invalidData)).rejects.toThrow(
        "Amount must have maximum 2 decimal places"
      );
    });
  });

  describe("terminateOrderTerm", () => {
    it("should validate term reference ID", async () => {
      const invalidData: PaymentTermTerminateRequest = { term_reference_id: "" };
      
      await expect(sdk.terminateOrderTerm(invalidData)).rejects.toThrow(
        "Term reference ID is required and must be a non-empty string"
      );
    });
  });

  describe("terminateOrder", () => {
    it("should validate reference ID", async () => {
      const invalidData: OrderTerminateRequest = { reference_id: "" };
      
      await expect(sdk.terminateOrder(invalidData)).rejects.toThrow(
        "Reference ID is required and must be a non-empty string"
      );
    });
  });
});