import { HttpClient } from "../http/HttpClient";
import { ServiceBase } from "./ServiceBase";
import { CurrencyResolver } from "../utils/currency";
import {
  MarketplaceAccountAction,
  MarketplaceApprovalPolicies,
  MarketplaceApprovalPolicy,
  MarketplaceApprovalPolicyInput,
  MarketplaceApprovalSettings,
  MarketplaceContractFilter,
  MarketplaceContracts,
  MarketplacePayout,
  MarketplacePayoutAcceptance,
  MarketplacePayoutApproval,
  MarketplacePayoutFilter,
  MarketplacePayoutList,
  MarketplacePayoutOperation,
  MarketplacePayoutOperationInput,
  MarketplaceProfileUpdate,
  MarketplaceProfileUpdateResponse,
  MarketplaceReleasePolicies,
  MarketplaceReleasePolicy,
  MarketplaceReleasePolicyInput,
  MarketplaceSeller,
  MarketplaceSellerAccounts,
  MarketplaceSellerList,
  MarketplaceSellerListParams,
  MarketplaceSubmerchantProvisioning,
} from "../types/panel";

/**
 * Marketplace API (version 2)
 *
 * @summary Manage marketplace sellers, payouts, policies and payout operations
 * @description All calls use the version 2 routes derived from the configured base URL and are scoped to the
 * API token's organization. Revisions are opaque strings: send them back exactly as received.
 */
export class MarketplaceService extends ServiceBase {
  constructor(
    httpClient: HttpClient,
    private readonly currencies: CurrencyResolver
  ) {
    super(httpClient);
  }

  /** Lists sellers; `external_id` selects an exact external ID match */
  async listMarketplaceSubmerchants(
    params: MarketplaceSellerListParams = {}
  ): Promise<MarketplaceSellerList> {
    return this.request("List marketplace submerchants", () =>
      this.httpClient.get<MarketplaceSellerList>(
        "/submerchants",
        this.v2({ params: { page: 1, per_page: 20, ...params } })
      )
    );
  }

  /** Returns the seller profile and its current revision */
  async getMarketplaceSubmerchant(id: string): Promise<MarketplaceSeller> {
    const path = `/submerchants/${this.id(id, "Seller ID")}`;
    return this.request("Get marketplace submerchant", () =>
      this.httpClient.get<MarketplaceSeller>(path, this.v2())
    );
  }

  /** Replaces the seller profile at its revision; inspect `approval_required` */
  async updateMarketplaceSubmerchant(
    id: string,
    input: MarketplaceProfileUpdate
  ): Promise<MarketplaceProfileUpdateResponse> {
    const path = `/submerchants/${this.id(id, "Seller ID")}`;
    return this.request("Update marketplace submerchant", () =>
      this.httpClient.patch<MarketplaceProfileUpdateResponse>(
        path,
        input,
        this.v2()
      )
    );
  }

  /** Returns the selected accounts' requirements for a seller operation */
  async getMarketplaceSellerContracts(
    filter: MarketplaceContractFilter
  ): Promise<MarketplaceContracts> {
    const query = new URLSearchParams({
      currency_id: filter.currency_id,
      seller_type: filter.seller_type,
      operation: filter.operation,
    });
    for (const vposId of filter.vpos_ids ?? []) {
      query.append("vpos_id", vposId);
    }
    return this.request("Get marketplace seller contracts", () =>
      this.httpClient.get<MarketplaceContracts>(
        `/marketplace/seller-contracts?${query.toString()}`,
        this.v2()
      )
    );
  }

  /** Returns account registration, synchronization and available actions */
  async getMarketplaceSellerAccounts(
    id: string
  ): Promise<MarketplaceSellerAccounts> {
    const path = `/submerchants/${this.id(id, "Seller ID")}/providers`;
    return this.request("Get marketplace seller accounts", () =>
      this.httpClient.get<MarketplaceSellerAccounts>(path, this.v2())
    );
  }

  /** Runs an action listed on the account at its revision and environment; inspect the returned status */
  async runMarketplaceSellerAccountAction(
    id: string,
    vposId: string,
    action: MarketplaceAccountAction
  ): Promise<MarketplaceSubmerchantProvisioning> {
    const path = `/submerchants/${this.id(id, "Seller ID")}/providers/${this.id(vposId, "VPOS ID")}/actions`;
    return this.request("Run marketplace seller account action", () =>
      this.httpClient.post<MarketplaceSubmerchantProvisioning>(
        path,
        action,
        this.v2()
      )
    );
  }

  async listMarketplacePayouts(
    filter: MarketplacePayoutFilter = {}
  ): Promise<MarketplacePayoutList> {
    return this.request("List marketplace payouts", () =>
      this.httpClient.get<MarketplacePayoutList>(
        "/submerchant-payouts",
        this.v2({ params: { page: 1, per_page: 20, ...filter } })
      )
    );
  }

  /** Returns a payout's eligibility, approval and settlement state */
  async getMarketplacePayout(id: string): Promise<MarketplacePayout> {
    const path = `/submerchant-payouts/${this.id(id, "Payout ID")}`;
    return this.request("Get marketplace payout", () =>
      this.httpClient.get<MarketplacePayout>(path, this.v2())
    );
  }

  /**
   * Submits up to 100 eligible payouts for approval without bypassing release gates.
   * "accepted" acknowledges approval; poll the payout for settlement.
   */
  async approveMarketplacePayouts(
    input: MarketplacePayoutApproval
  ): Promise<MarketplacePayoutAcceptance> {
    return this.request("Approve marketplace payouts", () =>
      this.httpClient.post<MarketplacePayoutAcceptance>(
        "/submerchant-payouts/approve",
        input,
        this.v2()
      )
    );
  }

  async listMarketplaceApprovalPolicies(): Promise<MarketplaceApprovalPolicies> {
    return this.request("List marketplace approval policies", () =>
      this.httpClient.get<MarketplaceApprovalPolicies>(
        "/marketplace/approval-policies",
        this.v2()
      )
    );
  }

  async getMarketplaceApprovalPolicy(
    id: string
  ): Promise<MarketplaceApprovalPolicy> {
    const path = `/marketplace/approval-policies/${this.id(id, "Policy ID")}`;
    return this.request("Get marketplace approval policy", () =>
      this.httpClient.get<MarketplaceApprovalPolicy>(path, this.v2())
    );
  }

  /** Creates an approval rule; a currency unit such as "TRY" is resolved to its UUID */
  async createMarketplaceApprovalPolicy(
    input: MarketplaceApprovalPolicyInput
  ): Promise<void> {
    const body = await this.withResolvedCurrency(input);
    await this.requestOptional("Create marketplace approval policy", () =>
      this.httpClient.post<unknown>("/marketplace/approval-policies", body, this.v2())
    );
  }

  /** Replaces an approval rule; a currency unit such as "TRY" is resolved to its UUID */
  async updateMarketplaceApprovalPolicy(
    id: string,
    input: MarketplaceApprovalPolicyInput
  ): Promise<void> {
    const path = `/marketplace/approval-policies/${this.id(id, "Policy ID")}`;
    const body = await this.withResolvedCurrency(input);
    await this.requestOptional("Update marketplace approval policy", () =>
      this.httpClient.patch<unknown>(path, body, this.v2())
    );
  }

  async deleteMarketplaceApprovalPolicy(id: string): Promise<void> {
    const path = `/marketplace/approval-policies/${this.id(id, "Policy ID")}`;
    await this.requestOptional("Delete marketplace approval policy", () =>
      this.httpClient.delete<unknown>(path, this.v2())
    );
  }

  async listMarketplaceReleasePolicies(): Promise<MarketplaceReleasePolicies> {
    return this.request("List marketplace release policies", () =>
      this.httpClient.get<MarketplaceReleasePolicies>(
        "/marketplace/release-policies",
        this.v2()
      )
    );
  }

  async getMarketplaceReleasePolicy(
    id: string
  ): Promise<MarketplaceReleasePolicy> {
    const path = `/marketplace/release-policies/${this.id(id, "Policy ID")}`;
    return this.request("Get marketplace release policy", () =>
      this.httpClient.get<MarketplaceReleasePolicy>(path, this.v2())
    );
  }

  async createMarketplaceReleasePolicy(
    input: MarketplaceReleasePolicyInput
  ): Promise<MarketplaceReleasePolicy> {
    return this.request("Create marketplace release policy", () =>
      this.httpClient.post<MarketplaceReleasePolicy>(
        "/marketplace/release-policies",
        input,
        this.v2()
      )
    );
  }

  async updateMarketplaceReleasePolicy(
    id: string,
    input: MarketplaceReleasePolicyInput
  ): Promise<MarketplaceReleasePolicy> {
    const path = `/marketplace/release-policies/${this.id(id, "Policy ID")}`;
    return this.request("Update marketplace release policy", () =>
      this.httpClient.patch<MarketplaceReleasePolicy>(path, input, this.v2())
    );
  }

  async deleteMarketplaceReleasePolicy(id: string): Promise<void> {
    const path = `/marketplace/release-policies/${this.id(id, "Policy ID")}`;
    await this.requestOptional("Delete marketplace release policy", () =>
      this.httpClient.delete<unknown>(path, this.v2())
    );
  }

  async getMarketplaceApprovalSettings(): Promise<MarketplaceApprovalSettings> {
    return this.request("Get marketplace approval settings", () =>
      this.httpClient.get<MarketplaceApprovalSettings>(
        "/marketplace/approval-settings",
        this.v2()
      )
    );
  }

  async updateMarketplaceApprovalSettings(
    input: MarketplaceApprovalSettings
  ): Promise<MarketplaceApprovalSettings> {
    return this.request("Update marketplace approval settings", () =>
      this.httpClient.patch<MarketplaceApprovalSettings>(
        "/marketplace/approval-settings",
        input,
        this.v2()
      )
    );
  }

  /** Changes a payout allocation or withdraws approval; inspect `status` before treating it as complete */
  async runMarketplacePayoutOperation(
    payoutId: string,
    input: MarketplacePayoutOperationInput
  ): Promise<MarketplacePayoutOperation> {
    const path = `/submerchant-payouts/${this.id(payoutId, "Payout ID")}/operations`;
    return this.request("Run marketplace payout operation", () =>
      this.httpClient.post<MarketplacePayoutOperation>(path, input, this.v2())
    );
  }

  /** Returns a persisted payout operation receipt */
  async getMarketplacePayoutOperation(
    id: string
  ): Promise<MarketplacePayoutOperation> {
    const path = `/marketplace/payout-operations/${this.id(id, "Operation ID")}`;
    return this.request("Get marketplace payout operation", () =>
      this.httpClient.get<MarketplacePayoutOperation>(path, this.v2())
    );
  }

  /** Checks the provider result without repeating the change */
  async reconcileMarketplacePayoutOperation(
    id: string
  ): Promise<MarketplacePayoutOperation> {
    const path = `/marketplace/payout-operations/${this.id(id, "Operation ID")}/reconcile`;
    return this.request("Reconcile marketplace payout operation", () =>
      this.httpClient.post<MarketplacePayoutOperation>(path, undefined, this.v2())
    );
  }

  /** Repeats an unresolved change only after the previous provider state is verified */
  async retryMarketplacePayoutOperation(
    id: string
  ): Promise<MarketplacePayoutOperation> {
    const path = `/marketplace/payout-operations/${this.id(id, "Operation ID")}/retry`;
    return this.request("Retry marketplace payout operation", () =>
      this.httpClient.post<MarketplacePayoutOperation>(path, undefined, this.v2())
    );
  }

  private async withResolvedCurrency(
    input: MarketplaceApprovalPolicyInput
  ): Promise<MarketplaceApprovalPolicyInput> {
    if (!input.currency_id || input.currency_id.trim() === "") {
      return input;
    }
    return {
      ...input,
      currency_id: await this.currencies.resolve(input.currency_id),
    };
  }
}
