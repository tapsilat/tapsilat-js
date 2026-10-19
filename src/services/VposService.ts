import { ServiceBase } from "./ServiceBase";
import {
  CardSchemeListResponse,
  Vpos,
  VposAcquirerListResponse,
  VposAcquirerTemplateListResponse,
  VposCreateRequest,
  VposListParams,
  VposListResponse,
  VposMutationResponse,
  VposSubmerchant,
  VposSubmerchantCreateRequest,
  VposSubmerchantListParams,
  VposSubmerchantListResponse,
  VposSubmerchantMutationResponse,
  VposSubmerchantUpdateRequest,
  VposUpdateRequest,
} from "../types/panel";

/**
 * Virtual POS management
 *
 * @summary Manage VPOS configurations, their submerchants and acquirer lookups
 * @description Updates replace the stored configuration: read the VPOS first and send every field back.
 */
export class VposService extends ServiceBase {
  async listVpos(params: VposListParams = {}): Promise<VposListResponse> {
    return this.request("List VPOS", () =>
      this.httpClient.get<VposListResponse>("/vpos", {
        params: { page: 1, per_page: 10, ...params },
      })
    );
  }

  /** Creates a VPOS; `currencies` accepts currency UUIDs or units such as "TRY" */
  async createVpos(request: VposCreateRequest): Promise<VposMutationResponse> {
    return this.request("Create VPOS", () =>
      this.httpClient.post<VposMutationResponse>("/vpos", request)
    );
  }

  async getVpos(id: string): Promise<Vpos> {
    const path = `/vpos/${this.id(id, "VPOS ID")}`;
    return this.request("Get VPOS", () => this.httpClient.get<Vpos>(path));
  }

  /** Replaces a VPOS configuration; fields left out are stored as empty or false */
  async updateVpos(
    id: string,
    request: VposUpdateRequest
  ): Promise<VposMutationResponse> {
    const path = `/vpos/${this.id(id, "VPOS ID")}`;
    return this.request("Update VPOS", () =>
      this.httpClient.patch<VposMutationResponse>(path, request)
    );
  }

  async deleteVpos(id: string): Promise<VposMutationResponse> {
    const path = `/vpos/${this.id(id, "VPOS ID")}`;
    return this.request("Delete VPOS", () =>
      this.httpClient.delete<VposMutationResponse>(path)
    );
  }

  async listVposAcquirers(): Promise<VposAcquirerListResponse> {
    return this.request("List VPOS acquirers", () =>
      this.httpClient.get<VposAcquirerListResponse>("/vpos/acquirers")
    );
  }

  async listCardSchemes(): Promise<CardSchemeListResponse> {
    return this.request("List card schemes", () =>
      this.httpClient.get<CardSchemeListResponse>("/vpos/card-schemes")
    );
  }

  async listVposAcquirerTemplates(): Promise<VposAcquirerTemplateListResponse> {
    return this.request("List VPOS acquirer templates", () =>
      this.httpClient.get<VposAcquirerTemplateListResponse>(
        "/vpos/acquirer-templates"
      )
    );
  }

  async listVposSubmerchants(
    params: VposSubmerchantListParams = {}
  ): Promise<VposSubmerchantListResponse> {
    return this.request("List VPOS submerchants", () =>
      this.httpClient.get<VposSubmerchantListResponse>("/vpos-submerchant", {
        params: { page: 1, per_page: 10, ...params },
      })
    );
  }

  async createVposSubmerchant(
    request: VposSubmerchantCreateRequest
  ): Promise<VposSubmerchantMutationResponse> {
    return this.request("Create VPOS submerchant", () =>
      this.httpClient.post<VposSubmerchantMutationResponse>(
        "/vpos-submerchant",
        request
      )
    );
  }

  async getVposSubmerchant(id: string): Promise<VposSubmerchant> {
    const path = `/vpos-submerchant/${this.id(id, "VPOS submerchant ID")}`;
    return this.request("Get VPOS submerchant", () =>
      this.httpClient.get<VposSubmerchant>(path)
    );
  }

  async updateVposSubmerchant(
    id: string,
    request: VposSubmerchantUpdateRequest
  ): Promise<VposSubmerchantMutationResponse> {
    const path = `/vpos-submerchant/${this.id(id, "VPOS submerchant ID")}`;
    return this.request("Update VPOS submerchant", () =>
      this.httpClient.patch<VposSubmerchantMutationResponse>(path, request)
    );
  }

  async deleteVposSubmerchant(
    id: string
  ): Promise<VposSubmerchantMutationResponse> {
    const path = `/vpos-submerchant/${this.id(id, "VPOS submerchant ID")}`;
    return this.request("Delete VPOS submerchant", () =>
      this.httpClient.delete<VposSubmerchantMutationResponse>(path)
    );
  }
}
