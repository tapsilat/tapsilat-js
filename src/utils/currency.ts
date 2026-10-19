import { HttpClient } from "../http/HttpClient";
import { TapsilatValidationError } from "../errors/TapsilatError";
import { OrganizationCurrenciesResponse } from "../types/panel";
import { handleError, handleResponse } from "./response";

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Resolves organization currency units such as "TRY" to currency UUIDs
 *
 * @summary Cached lookup of organization currency IDs by unit
 * @description Most endpoints accept currency units directly. Use this where the server requires a UUID,
 * such as marketplace approval policies. The lookup is cached until invalidate() is called.
 */
export class CurrencyResolver {
  private idsByUnit?: Promise<Map<string, string>>;

  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Returns the currency UUID for ref; a UUID is returned unchanged
   *
   * @param ref - Currency UUID or organization currency unit
   * @throws {TapsilatValidationError} When ref is empty or not one of the organization's currencies
   */
  async resolve(ref: string): Promise<string> {
    const trimmed = (ref ?? "").trim();
    if (trimmed === "") {
      throw new TapsilatValidationError("currency_id is required");
    }
    if (UUID_PATTERN.test(trimmed)) {
      return trimmed;
    }

    const id = (await this.load()).get(trimmed.toUpperCase());
    if (!id) {
      throw new TapsilatValidationError(
        `Unknown currency reference "${ref}"; use a currency UUID or organization currency unit`
      );
    }
    return id;
  }

  /** Clears the cached currencies, for example after creating a currency */
  invalidate(): void {
    this.idsByUnit = undefined;
  }

  private load(): Promise<Map<string, string>> {
    if (!this.idsByUnit) {
      this.idsByUnit = this.fetch().catch((error) => {
        this.idsByUnit = undefined;
        throw error;
      });
    }
    return this.idsByUnit;
  }

  private async fetch(): Promise<Map<string, string>> {
    try {
      const response = await this.httpClient.get<OrganizationCurrenciesResponse>(
        "/organization/currencies"
      );
      const data = handleResponse(response, "Get organization currencies");
      const map = new Map<string, string>();
      for (const currency of data.currencies ?? []) {
        const unit = (currency.currency_unit ?? "").trim().toUpperCase();
        if (unit && currency.id) {
          map.set(unit, currency.id);
        }
      }
      return map;
    } catch (error) {
      return handleError(error, "get organization currencies");
    }
  }
}
