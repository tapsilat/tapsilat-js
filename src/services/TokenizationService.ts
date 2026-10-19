import { ServiceBase } from "./ServiceBase";
import {
  CardTokenizeRequest,
  CardTokenizeResponse,
  DeleteSavedCardResponse,
  ListSavedCardsResponse,
} from "../types/panel";

/**
 * Card tokenization
 *
 * @summary Tokenize, list and delete saved cards
 */
export class TokenizationService extends ServiceBase {
  /** Tokenizes a card; returns 3D secure form details when verification is required */
  async tokenizeCard(request: CardTokenizeRequest): Promise<CardTokenizeResponse> {
    return this.request("Tokenize card", () =>
      this.httpClient.post<CardTokenizeResponse>(
        "/tokenization/card/tokenize",
        request
      )
    );
  }

  async listSavedCards(page = 1, perPage = 10): Promise<ListSavedCardsResponse> {
    return this.request("List saved cards", () =>
      this.httpClient.get<ListSavedCardsResponse>("/tokenization/card/list", {
        params: { page, per_page: perPage },
      })
    );
  }

  async deleteSavedCard(id: string): Promise<DeleteSavedCardResponse> {
    const path = `/tokenization/card/${this.id(id, "Card ID")}`;
    return this.request("Delete saved card", () =>
      this.httpClient.delete<DeleteSavedCardResponse>(path)
    );
  }
}
