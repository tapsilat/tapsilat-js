import { TapsilatSDK } from "../TapsilatSDK";
import { HttpClient } from "../http/HttpClient";
import { OrderCreateRequest } from "../types/index";

jest.mock("../http/HttpClient");

const V2 = { baseURL: "https://test.api.com/api/v2" };
const CURRENCY_ID = "9f4050e8-1111-4f25-b4ef-aaaaaaaaaaaa";

describe("Panel contract parity", () => {
  let sdk: TapsilatSDK;
  let http: jest.Mocked<HttpClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    sdk = new TapsilatSDK({
      bearerToken: "test-bearer-token-12345",
      baseURL: "https://test.api.com/api/v1",
    });
    http = (sdk as unknown as { httpClient: HttpClient })
      .httpClient as jest.Mocked<HttpClient>;
    for (const method of [http.get, http.post, http.put, http.patch, http.delete]) {
      method.mockResolvedValue({ success: true, data: {} });
    }
    http.versionedBaseURL.mockImplementation(
      (version: string) => `https://test.api.com/api/${version}`
    );
  });

  describe("orders", () => {
    const order: OrderCreateRequest = {
      amount: 10,
      currency: "TRY",
      locale: "tr",
      buyer: {
        name: "John",
        surname: "Doe",
        email: "john@example.com",
        gsm_number: "+90 (555) 123-45-67",
      },
    };

    it("cleans the GSM number and fills the checkout URL from the order", async () => {
      http.post.mockResolvedValueOnce({
        success: true,
        data: { order_id: "o_1", reference_id: "ref_1" },
      });
      http.get.mockResolvedValueOnce({
        success: true,
        data: { reference_id: "ref_1", checkout_url: "https://checkout.test/ref_1" },
      });

      const created = await sdk.createOrder(order);

      const sent = http.post.mock.calls[0][1] as OrderCreateRequest;
      expect(sent.buyer.gsm_number).toBe("+905551234567");
      expect(http.get).toHaveBeenCalledWith("/order/ref_1");
      expect(created.checkout_url).toBe("https://checkout.test/ref_1");
    });

    it("returns the created order when the checkout URL lookup fails", async () => {
      http.post.mockResolvedValueOnce({
        success: true,
        data: { order_id: "o_1", reference_id: "ref_1" },
      });
      http.get.mockResolvedValueOnce({
        success: false,
        error: { message: "not found", code: "NOT_FOUND" },
      });

      const created = await sdk.createOrder(order);
      expect(created.reference_id).toBe("ref_1");
      expect(created.checkout_url).toBeUndefined();
    });

    it("rejects malformed GSM numbers before sending", async () => {
      await expect(
        sdk.createOrder({ ...order, buyer: { ...order.buyer, gsm_number: "12a45" } })
      ).rejects.toThrow("Invalid phone number format");
      expect(http.post).not.toHaveBeenCalled();
    });

    it("returns an empty list when an order has no transactions", async () => {
      http.get.mockResolvedValueOnce({ success: true, data: null });
      await expect(sdk.getOrderTransactions("ref/1")).resolves.toEqual([]);
      expect(http.get).toHaveBeenCalledWith("/order/ref%2F1/transactions");
    });

    it("lists order payments and charges orders", async () => {
      http.post.mockResolvedValueOnce({ success: true, data: { payments: [], total_amount: 10 } });
      await sdk.getOrderPayments({ order_reference_id: "ref_1" });
      expect(http.post).toHaveBeenLastCalledWith("/order/payments", { order_reference_id: "ref_1" });

      http.post.mockResolvedValueOnce({ success: true, data: { isSuccess: true, statusCode: "00" } });
      const charge = await sdk.chargeOrder({ order_reference_id: "ref_1", retry: true });
      expect(http.post).toHaveBeenLastCalledWith("/order/charge", { order_reference_id: "ref_1", retry: true });
      expect(charge.isSuccess).toBe(true);
    });

    it("reads payment details by conversation ID", async () => {
      http.post.mockResolvedValueOnce({ success: true, data: [] });
      await sdk.getOrderPaymentDetailsByConversationId("conv_1");
      expect(http.post).toHaveBeenCalledWith("/order/payment-details", { conversation_id: "conv_1" });
    });

    it("sends submerchant payment actions with the panel methods", async () => {
      const action = { locale: "tr", conversation_id: "c", payment_transaction_id: "p", acquirer: "iyzico" };
      await sdk.approveSubmerchantPayment(action);
      expect(http.post).toHaveBeenLastCalledWith("/submerchants/payment/approve", action);
      await sdk.disapproveSubmerchantPayment(action);
      expect(http.post).toHaveBeenLastCalledWith("/submerchants/payment/disapprove", action);
      const item = { ...action, sub_merchant_key: "k", sub_merchant_price: "1.00" };
      await sdk.updateSubmerchantPaymentItem(item);
      expect(http.put).toHaveBeenCalledWith("/submerchants/payment/item", item);
    });

    it("passes every order list filter", async () => {
      http.get.mockResolvedValueOnce({ success: true, data: { rows: [] } });
      await sdk.getOrders({ page: 1, per_page: 20, buyer_id: "b_1", conversation_id: "c_1", status: 3 });
      expect(http.get).toHaveBeenCalledWith("/order/list", {
        params: { page: 1, per_page: 20, buyer_id: "b_1", conversation_id: "c_1", status: 3 },
      });
    });
  });

  describe("card installments", () => {
    it("queries installments and the installment table", async () => {
      http.get.mockResolvedValueOnce({ success: true, data: { is_installment_available: true } });
      await sdk.getCardInstallments({ bin: "54066200", amount: 100, currency: "TRY", is_three_d: true });
      expect(http.get).toHaveBeenLastCalledWith("/card/installments", {
        params: { bin: "54066200", amount: 100, currency: "TRY", is_three_d: true },
      });

      http.get.mockResolvedValueOnce({ success: true, data: { groups: [] } });
      await sdk.getInstallmentTable({ amount: 100, currency: "TRY" });
      expect(http.get).toHaveBeenLastCalledWith("/card/installment-table", {
        params: { amount: 100, currency: "TRY" },
      });
    });
  });

  describe("organization", () => {
    it("uses the panel routes for limits, metas and suborganizations", async () => {
      await sdk.getOrganizationLimits("org/1");
      expect(http.get).toHaveBeenLastCalledWith("/organization/org%2F1/limits");
      await sdk.getOrganizationMeta("checkout");
      expect(http.get).toHaveBeenLastCalledWith("/organization/metas/checkout");
      await sdk.getOrganizationSuborganizations({ page: 2 });
      expect(http.get).toHaveBeenLastCalledWith("/organization/suborganizations", {
        params: { page: 2, per_page: 10 },
      });
      await sdk.getSuborganizationDetail("so_1");
      expect(http.get).toHaveBeenLastCalledWith("/organization/suborganizations/so_1");
      await sdk.getSubmerchantBySuborganization("so_1");
      expect(http.get).toHaveBeenLastCalledWith("/organization/suborganizations/so_1/submerchant");
    });

    it("creates currencies and user tokens", async () => {
      await sdk.createOrganizationCurrency(" usd ");
      expect(http.post).toHaveBeenLastCalledWith("/organization/currencies", { currency_code: "USD" });
      await sdk.createOrganizationUserToken({ user_id: "u_1", expire: 60 });
      expect(http.post).toHaveBeenLastCalledWith("/organization/user/token", { user_id: "u_1", expire: 60 });
      await sdk.listOrganizationCurrencyPresets();
      expect(http.get).toHaveBeenLastCalledWith("/organization/currency-presets");
    });

    it("resolves currency units with one cached lookup until a currency is created", async () => {
      http.get.mockResolvedValue({
        success: true,
        data: { currencies: [{ id: CURRENCY_ID, currency_unit: "TRY" }] },
      });

      await expect(sdk.resolveCurrencyId("try")).resolves.toBe(CURRENCY_ID);
      await expect(sdk.resolveCurrencyId("TRY")).resolves.toBe(CURRENCY_ID);
      await expect(sdk.resolveCurrencyId(CURRENCY_ID)).resolves.toBe(CURRENCY_ID);
      expect(http.get).toHaveBeenCalledTimes(1);

      await sdk.createOrganizationCurrency("usd");
      await sdk.resolveCurrencyId("TRY");
      expect(http.get).toHaveBeenCalledTimes(2);
      await expect(sdk.resolveCurrencyId("XYZ")).rejects.toThrow("Unknown currency reference");
    });
  });

  describe("submerchants", () => {
    it("uses the v1 routes and passes currency units through", async () => {
      const request = { locale: "tr", conversation_id: "c", name: "A", email: "a@b.c", gsm_number: "905551112233", currency_id: "TRY" };
      await sdk.submerchants.createSubmerchant(request);
      expect(http.post).toHaveBeenLastCalledWith("/submerchants", request);
      await sdk.submerchants.updateSubmerchant("sm/1", request);
      expect(http.patch).toHaveBeenLastCalledWith("/submerchants/sm%2F1", request);
      await sdk.submerchants.listSubmerchants(2, 5);
      expect(http.get).toHaveBeenLastCalledWith("/submerchants", { params: { page: 2, per_page: 5 } });
      await sdk.submerchants.deleteSubmerchant("sm_1");
      expect(http.delete).toHaveBeenLastCalledWith("/submerchants/sm_1");
      await sdk.submerchants.getSuborganizationBySubmerchant("sm_1");
      expect(http.get).toHaveBeenLastCalledWith("/submerchants/sm_1/suborganization");
    });

    it("records payout events and creates marketplace sellers on v2", async () => {
      const event = { idempotency_key: "k", order_reference: "ref", item_id: "i", event_type: "service_completed" };
      await sdk.submerchants.recordSubmerchantPayoutEvent(event);
      expect(http.post).toHaveBeenLastCalledWith("/submerchant-payout-events", event);

      const seller = { locale: "tr", conversation_id: "c", name: "A", email: "a@b.c", gsm_number: "1", provider_accounts: [{ vpos_id: "v", environment: "TEST" }] };
      await sdk.submerchants.createMarketplaceSubmerchant(seller);
      expect(http.post).toHaveBeenLastCalledWith("/submerchants", seller, V2);
    });

    it("requires identifiers", async () => {
      await expect(sdk.submerchants.getSubmerchant("")).rejects.toThrow("Submerchant ID is required");
    });
  });

  describe("vpos", () => {
    it("covers VPOS, lookups and VPOS submerchants", async () => {
      await sdk.vpos.listVpos({ suborganization_id: "so_1" });
      expect(http.get).toHaveBeenLastCalledWith("/vpos", { params: { page: 1, per_page: 10, suborganization_id: "so_1" } });
      const config = { name: "POS", acquirer_id: "acq", currencies: ["TRY", "USD"], failover: true, tls: true };
      await sdk.vpos.createVpos(config);
      expect(http.post).toHaveBeenLastCalledWith("/vpos", config);
      await sdk.vpos.updateVpos("v_1", config);
      expect(http.patch).toHaveBeenLastCalledWith("/vpos/v_1", config);
      await sdk.vpos.deleteVpos("v_1");
      expect(http.delete).toHaveBeenLastCalledWith("/vpos/v_1");
      await sdk.vpos.listVposAcquirers();
      expect(http.get).toHaveBeenLastCalledWith("/vpos/acquirers");
      await sdk.vpos.listCardSchemes();
      expect(http.get).toHaveBeenLastCalledWith("/vpos/card-schemes");
      await sdk.vpos.listVposAcquirerTemplates();
      expect(http.get).toHaveBeenLastCalledWith("/vpos/acquirer-templates");
      await sdk.vpos.listVposSubmerchants({ vpos_id: "v_1" });
      expect(http.get).toHaveBeenLastCalledWith("/vpos-submerchant", { params: { page: 1, per_page: 10, vpos_id: "v_1" } });
      await sdk.vpos.createVposSubmerchant({ vpos_id: "v_1" });
      expect(http.post).toHaveBeenLastCalledWith("/vpos-submerchant", { vpos_id: "v_1" });
      await sdk.vpos.updateVposSubmerchant("vs_1", { terminal_no: "t" });
      expect(http.patch).toHaveBeenLastCalledWith("/vpos-submerchant/vs_1", { terminal_no: "t" });
      await sdk.vpos.deleteVposSubmerchant("vs_1");
      expect(http.delete).toHaveBeenLastCalledWith("/vpos-submerchant/vs_1");
    });
  });

  describe("tokenization", () => {
    it("tokenizes, lists and deletes cards", async () => {
      const card = { card_number: "4111111111111111", holder_name: "J D", expiry_month: "12", expiry_year: "30", cvv: "123", user_id: "u" };
      await sdk.tokenization.tokenizeCard(card);
      expect(http.post).toHaveBeenLastCalledWith("/tokenization/card/tokenize", card);
      await sdk.tokenization.listSavedCards(1, 20);
      expect(http.get).toHaveBeenLastCalledWith("/tokenization/card/list", { params: { page: 1, per_page: 20 } });
      await sdk.tokenization.deleteSavedCard("card_1");
      expect(http.delete).toHaveBeenLastCalledWith("/tokenization/card/card_1");
    });
  });

  describe("marketplace", () => {
    it("routes seller calls to API version 2", async () => {
      await sdk.marketplace.listMarketplaceSubmerchants({ external_id: "ext" });
      expect(http.get).toHaveBeenLastCalledWith("/submerchants", { ...V2, params: { page: 1, per_page: 20, external_id: "ext" } });
      await sdk.marketplace.getMarketplaceSubmerchant("s_1");
      expect(http.get).toHaveBeenLastCalledWith("/submerchants/s_1", V2);
      const update = { locale: "tr", conversation_id: "c", name: "A", email: "a@b.c", gsm_number: "1", revision: "2026-01-02T03:04:05.123456789Z" };
      await sdk.marketplace.updateMarketplaceSubmerchant("s_1", update);
      expect(http.patch).toHaveBeenLastCalledWith("/submerchants/s_1", update, V2);
      await sdk.marketplace.getMarketplaceSellerAccounts("s_1");
      expect(http.get).toHaveBeenLastCalledWith("/submerchants/s_1/providers", V2);
      const action = { action: "retry", environment: "TEST", revision: "r" };
      await sdk.marketplace.runMarketplaceSellerAccountAction("s_1", "v_1", action);
      expect(http.post).toHaveBeenLastCalledWith("/submerchants/s_1/providers/v_1/actions", action, V2);
    });

    it("repeats vpos_id in seller contract queries", async () => {
      await sdk.marketplace.getMarketplaceSellerContracts({ currency_id: "TRY", seller_type: "PRIVATE_COMPANY", operation: "create", vpos_ids: ["v_1", "v_2"] });
      expect(http.get).toHaveBeenLastCalledWith(
        "/marketplace/seller-contracts?currency_id=TRY&seller_type=PRIVATE_COMPANY&operation=create&vpos_id=v_1&vpos_id=v_2",
        V2
      );
    });

    it("covers payouts, settings and payout operations", async () => {
      await sdk.marketplace.listMarketplacePayouts({ eligibility: "ready", currency: "TRY" });
      expect(http.get).toHaveBeenLastCalledWith("/submerchant-payouts", { ...V2, params: { page: 1, per_page: 20, eligibility: "ready", currency: "TRY" } });
      await sdk.marketplace.getMarketplacePayout("p_1");
      expect(http.get).toHaveBeenLastCalledWith("/submerchant-payouts/p_1", V2);
      await sdk.marketplace.approveMarketplacePayouts({ ids: ["p_1"] });
      expect(http.post).toHaveBeenLastCalledWith("/submerchant-payouts/approve", { ids: ["p_1"] }, V2);
      await sdk.marketplace.updateMarketplaceApprovalSettings({ default_mode: "manual" });
      expect(http.patch).toHaveBeenLastCalledWith("/marketplace/approval-settings", { default_mode: "manual" }, V2);
      const operation = { kind: "update_item", idempotency_key: "k", revision: "r", net_amount: "1.00" };
      await sdk.marketplace.runMarketplacePayoutOperation("p_1", operation);
      expect(http.post).toHaveBeenLastCalledWith("/submerchant-payouts/p_1/operations", operation, V2);
      await sdk.marketplace.reconcileMarketplacePayoutOperation("op_1");
      expect(http.post).toHaveBeenLastCalledWith("/marketplace/payout-operations/op_1/reconcile", undefined, V2);
      await sdk.marketplace.retryMarketplacePayoutOperation("op_1");
      expect(http.post).toHaveBeenLastCalledWith("/marketplace/payout-operations/op_1/retry", undefined, V2);
    });

    it("resolves approval policy currency units and accepts empty delete responses", async () => {
      http.get.mockResolvedValueOnce({
        success: true,
        data: { currencies: [{ id: CURRENCY_ID, currency_unit: "TRY" }] },
      });
      http.post.mockResolvedValueOnce({ success: true, data: { status: "created" } });

      await sdk.marketplace.createMarketplaceApprovalPolicy({ name: "Manual", priority: 1, mode: "manual", currency_id: "try" });
      expect(http.get).toHaveBeenCalledWith("/organization/currencies");
      expect(http.post).toHaveBeenLastCalledWith(
        "/marketplace/approval-policies",
        { name: "Manual", priority: 1, mode: "manual", currency_id: CURRENCY_ID },
        V2
      );

      http.delete.mockResolvedValueOnce({ success: true, status: 204 });
      await expect(sdk.marketplace.deleteMarketplaceApprovalPolicy("pol_1")).resolves.toBeUndefined();
      expect(http.delete).toHaveBeenLastCalledWith("/marketplace/approval-policies/pol_1", V2);

      http.delete.mockResolvedValueOnce({ success: true, status: 204 });
      await sdk.marketplace.deleteMarketplaceReleasePolicy("rel_1");
      expect(http.delete).toHaveBeenLastCalledWith("/marketplace/release-policies/rel_1", V2);
    });

    it("sends approval policies without a currency unchanged", async () => {
      http.patch.mockResolvedValueOnce({ success: true, data: { status: "updated" } });
      await sdk.marketplace.updateMarketplaceApprovalPolicy("pol_1", { name: "Auto", priority: 2, mode: "auto" });
      expect(http.get).not.toHaveBeenCalled();
      expect(http.patch).toHaveBeenLastCalledWith("/marketplace/approval-policies/pol_1", { name: "Auto", priority: 2, mode: "auto" }, V2);
    });
  });
});
