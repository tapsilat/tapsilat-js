import { ServiceBase } from "./ServiceBase";
import {
  MarketplaceSubmerchantCreateRequest,
  MarketplaceSubmerchantCreateResponse,
  Submerchant,
  SubmerchantCreateRequest,
  SubmerchantListResponse,
  SubmerchantMutationResponse,
  SubmerchantPayoutEventRequest,
  SubmerchantPayoutEventResponse,
  SubmerchantSuborganizationMapping,
  SubmerchantUpdateRequest,
} from "../types/panel";

/**
 * Submerchant management
 *
 * @summary Create, read, update and delete submerchants
 * @description Covers the version 1 submerchant routes, item payout events and marketplace seller creation.
 * Currency fields accept a currency UUID or an organization unit such as "TRY".
 */
export class SubmerchantService extends ServiceBase {
  /** Creates a submerchant; the response carries only code and message */
  async createSubmerchant(
    request: SubmerchantCreateRequest
  ): Promise<SubmerchantMutationResponse> {
    return this.request("Create submerchant", () =>
      this.httpClient.post<SubmerchantMutationResponse>("/submerchants", request)
    );
  }

  async getSubmerchant(id: string): Promise<Submerchant> {
    const path = `/submerchants/${this.id(id, "Submerchant ID")}`;
    return this.request("Get submerchant", () =>
      this.httpClient.get<Submerchant>(path)
    );
  }

  /** Lists submerchants; rows are returned under `row` */
  async listSubmerchants(
    page = 1,
    perPage = 10
  ): Promise<SubmerchantListResponse> {
    return this.request("List submerchants", () =>
      this.httpClient.get<SubmerchantListResponse>("/submerchants", {
        params: { page, per_page: perPage },
      })
    );
  }

  /** Replaces the submerchant profile; send every field */
  async updateSubmerchant(
    id: string,
    request: SubmerchantUpdateRequest
  ): Promise<SubmerchantMutationResponse> {
    const path = `/submerchants/${this.id(id, "Submerchant ID")}`;
    return this.request("Update submerchant", () =>
      this.httpClient.patch<SubmerchantMutationResponse>(path, request)
    );
  }

  async deleteSubmerchant(id: string): Promise<SubmerchantMutationResponse> {
    const path = `/submerchants/${this.id(id, "Submerchant ID")}`;
    return this.request("Delete submerchant", () =>
      this.httpClient.delete<SubmerchantMutationResponse>(path)
    );
  }

  async getSuborganizationBySubmerchant(
    submerchantId: string
  ): Promise<SubmerchantSuborganizationMapping> {
    const path = `/submerchants/${this.id(submerchantId, "Submerchant ID")}/suborganization`;
    return this.request("Get suborganization by submerchant", () =>
      this.httpClient.get<SubmerchantSuborganizationMapping>(path)
    );
  }

  /**
   * Records an item business event; time gates, approval and settlement remain separate.
   * Repeating an event with the same idempotency key and payload is safe.
   */
  async recordSubmerchantPayoutEvent(
    request: SubmerchantPayoutEventRequest
  ): Promise<SubmerchantPayoutEventResponse> {
    return this.request("Record submerchant payout event", () =>
      this.httpClient.post<SubmerchantPayoutEventResponse>(
        "/submerchant-payout-events",
        request
      )
    );
  }

  /**
   * Creates a logical marketplace seller; inspect `provisionings` for each VPOS account's readiness.
   * Reuse the same idempotency key and request data when retrying.
   */
  async createMarketplaceSubmerchant(
    request: MarketplaceSubmerchantCreateRequest
  ): Promise<MarketplaceSubmerchantCreateResponse> {
    return this.request("Create marketplace submerchant", () =>
      this.httpClient.post<MarketplaceSubmerchantCreateResponse>(
        "/submerchants",
        request,
        this.v2()
      )
    );
  }
}
