import { format, inspect } from "util";
import { TapsilatSDK } from "../TapsilatSDK";
import { TapsilatError, TapsilatValidationError } from "../errors/TapsilatError";
import { createLoggingInterceptor } from "../http/interceptors";
import {
  ElementsCardBrand,
  ElementsSessionCreateResponse,
  ElementsSessionPurpose,
  ElementsSessionStatus,
  ElementsTokenizeMode,
} from "../index";

const BASE_URL = "https://panel.test/api/v1";
const TOKEN = "token_1234567890";
const SECRET = "es_test_8Kq2nV0rX4_secret_q8Zr0bM1";

describe("Elements sessions", () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;
  let sdk: TapsilatSDK;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    sdk = new TapsilatSDK({ bearerToken: TOKEN, baseURL: BASE_URL, maxRetries: 0 });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const respond = (status: number, body: string): void => {
    fetchMock.mockResolvedValueOnce(
      new Response(body, {
        status,
        headers: { "content-type": "application/json", "cache-control": "no-store" },
      })
    );
  };

  const lastCall = (): { url: string; method?: string; headers: Headers; body?: unknown } => {
    const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1] as [string, RequestInit];
    return { url, method: init.method, headers: init.headers as Headers, body: init.body };
  };

  const created = (): string =>
    JSON.stringify({
      id: "es_test_8Kq2nV0rX4",
      purpose: "pay",
      status: "requires_payment_method",
      order_reference_id: "order-ref-1",
      attempts: 0,
      max_attempts: 3,
      created_at: "2026-10-22T09:00:00Z",
      expires_at: "2026-10-22T09:30:00Z",
      client_secret: SECRET,
      elements_base_url: "https://checkout.tapsilat.dev",
    });

  describe("createElementsSession", () => {
    it("creates a pay session and returns its client secret", async () => {
      respond(200, created());

      const session = await sdk.createElementsSession({
        purpose: ElementsSessionPurpose.PAY,
        order_reference_id: "order-ref-1",
        save_card: true,
        user_id: undefined,
      });

      const call = lastCall();
      expect(call.method).toBe("POST");
      expect(call.url).toBe(`${BASE_URL}/elements/sessions`);
      expect(call.headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
      expect(call.headers.get("Content-Type")).toBe("application/json");
      expect(call.body).toBe('{"purpose":"pay","order_reference_id":"order-ref-1","save_card":true}');

      expect(session.id).toBe("es_test_8Kq2nV0rX4");
      expect(session.purpose).toBe(ElementsSessionPurpose.PAY);
      expect(session.status).toBe(ElementsSessionStatus.REQUIRES_PAYMENT_METHOD);
      expect(session.order_reference_id).toBe("order-ref-1");
      expect(session.attempts).toBe(0);
      expect(session.max_attempts).toBe(3);
      expect(session.created_at).toBe("2026-10-22T09:00:00Z");
      expect(session.expires_at).toBe("2026-10-22T09:30:00Z");
      expect(session.completed_at).toBeUndefined();
      expect(session.card).toBeUndefined();
      expect(session.last_error).toBeUndefined();
      expect(session.client_secret).toBe(SECRET);
      expect(session.elements_base_url).toBe("https://checkout.tapsilat.dev");
    });

    it("creates a tokenize session for a user and leaves null fields out", async () => {
      respond(
        200,
        '{"id":"es_test_1","purpose":"tokenize","status":"requires_payment_method",' +
          '"user_id":"user_123","client_secret":"es_test_1_secret_x"}'
      );

      const session = await sdk.createElementsSession({
        purpose: ElementsSessionPurpose.TOKENIZE,
        user_id: "user_123",
        user_email: "john@doe.com",
        mode: ElementsTokenizeMode.NON_SECURE,
        order_reference_id: null as unknown as string,
      });

      expect(JSON.parse(lastCall().body as string)).toEqual({
        purpose: "tokenize",
        user_id: "user_123",
        user_email: "john@doe.com",
        mode: 3,
      });
      expect(session.user_id).toBe("user_123");
      expect(session.client_secret).toBe("es_test_1_secret_x");
    });

    it("requires a purpose before sending", async () => {
      await expect(sdk.createElementsSession({ purpose: "" })).rejects.toThrow(TapsilatValidationError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("getElementsSession", () => {
    it("reads the outcome with the card and last error", async () => {
      respond(
        200,
        JSON.stringify({
          id: "es_test_8Kq2nV0rX4",
          purpose: "pay",
          status: "failed",
          order_reference_id: "order-ref-1",
          attempts: 3,
          max_attempts: 3,
          completed_at: "2026-10-22T09:12:00Z",
          card: { id: "card-1", brand: "visa", last4: "4242", exp_month: 12, exp_year: 2030 },
          last_error: { code: "card_declined", message: "The card was declined.", retryable: false },
        })
      );

      const session = await sdk.getElementsSession("es_test_8Kq2nV0rX4");

      const call = lastCall();
      expect(call.method).toBe("GET");
      expect(call.url).toBe(`${BASE_URL}/elements/sessions/es_test_8Kq2nV0rX4`);
      expect(call.headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
      expect(call.body).toBeUndefined();

      expect(session.status).toBe(ElementsSessionStatus.FAILED);
      expect(session.attempts).toBe(3);
      expect(session.completed_at).toBe("2026-10-22T09:12:00Z");
      expect(session.card).toEqual({
        id: "card-1",
        brand: ElementsCardBrand.VISA,
        last4: "4242",
        exp_month: 12,
        exp_year: 2030,
      });
      expect(session.last_error).toEqual({
        code: "card_declined",
        message: "The card was declined.",
        retryable: false,
      });
    });

    it("reads a null card and last error", async () => {
      respond(
        200,
        '{"id":"es_mock_1","purpose":"pay","status":"requires_payment_method","card":null,"last_error":null}'
      );

      const session = await sdk.getElementsSession("es_mock_1");
      expect(session.card).toBeNull();
      expect(session.last_error).toBeNull();
    });

    it("keeps unknown fields and values", async () => {
      respond(
        200,
        '{"id":"es_test_1","purpose":"subscribe","status":"on_hold",' +
          '"card":{"brand":"elo","last4":"0001"},"risk_score":12}'
      );

      const session = await sdk.getElementsSession("es_test_1");
      expect(session.purpose).toBe("subscribe");
      expect(session.status).toBe("on_hold");
      expect(session.card?.brand).toBe("elo");
    });

    it("escapes the session ID in the path", async () => {
      respond(200, '{"id":"es_test_1"}');

      await sdk.getElementsSession("es_test_1/../x");
      expect(lastCall().url).toBe(`${BASE_URL}/elements/sessions/es_test_1%2F..%2Fx`);
    });

    it("requires a session ID before sending", async () => {
      await expect(sdk.getElementsSession(" ")).rejects.toThrow(TapsilatValidationError);
      await expect(sdk.cancelElementsSession("")).rejects.toThrow(TapsilatValidationError);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe("cancelElementsSession", () => {
    it("posts to the cancel route with no body", async () => {
      respond(200, '{"id":"es_test_8Kq2nV0rX4","purpose":"pay","status":"canceled","attempts":0,"max_attempts":3}');

      const session = await sdk.cancelElementsSession("es_test_8Kq2nV0rX4");

      const call = lastCall();
      expect(call.method).toBe("POST");
      expect(call.url).toBe(`${BASE_URL}/elements/sessions/es_test_8Kq2nV0rX4/cancel`);
      expect(call.headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
      expect(call.headers.get("Content-Type")).toBeNull();
      expect(call.body).toBeUndefined();
      expect(session.status).toBe(ElementsSessionStatus.CANCELED);
    });
  });

  describe("errors", () => {
    it.each([
      {
        name: "create without Elements enabled",
        status: 403,
        body: '{"error":{"code":"elements_not_enabled","message":"Elements is not enabled for this organization"}}',
        call: (api: TapsilatSDK): Promise<unknown> =>
          api.createElementsSession({ purpose: ElementsSessionPurpose.PAY, order_reference_id: "order-ref-1" }),
        code: "elements_not_enabled",
        message: "Elements is not enabled for this organization",
        retryable: undefined,
      },
      {
        name: "create with an invalid request",
        status: 400,
        body: '{"error":{"code":"invalid_request","message":"order_reference_id is required","retryable":false}}',
        call: (api: TapsilatSDK): Promise<unknown> =>
          api.createElementsSession({ purpose: ElementsSessionPurpose.PAY }),
        code: "invalid_request",
        message: "order_reference_id is required",
        retryable: false,
      },
      {
        name: "get an unknown session",
        status: 404,
        body: '{"error":{"code":"session_not_found","message":"session not found"}}',
        call: (api: TapsilatSDK): Promise<unknown> => api.getElementsSession("es_test_missing"),
        code: "session_not_found",
        message: "session not found",
        retryable: undefined,
      },
      {
        name: "cancel while unavailable",
        status: 503,
        body: '{"error":{"code":"unavailable","message":"try again","retryable":true}}',
        call: (api: TapsilatSDK): Promise<unknown> => api.cancelElementsSession("es_test_1"),
        code: "unavailable",
        message: "try again",
        retryable: true,
      },
    ])("reads the nested error when they $name", async ({ status, body, call, code, message, retryable }) => {
      respond(status, body);

      const error = await call(sdk).catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(TapsilatError);
      const apiError = error as TapsilatError;
      expect(apiError.statusCode).toBe(status);
      expect(apiError.apiCode).toBe(code);
      expect(apiError.message).toBe(message);
      expect(apiError.retryable).toBe(retryable);
      expect(apiError.rawBody).toBe(body);
    });
  });

  describe("client secret", () => {
    it("is redacted when the created session is printed", async () => {
      respond(200, created());
      const session: ElementsSessionCreateResponse = await sdk.createElementsSession({
        purpose: ElementsSessionPurpose.PAY,
        order_reference_id: "order-ref-1",
      });

      for (const printed of [
        inspect(session),
        inspect({ session }, { depth: 5 }),
        format("%s", session),
        format("%o", session),
        format("%O", session),
        format(session),
      ]) {
        expect(printed).not.toContain(SECRET);
        expect(printed).toContain("[redacted]");
        expect(printed).toContain("es_test_8Kq2nV0rX4");
      }
    });

    it("is kept in the JSON sent to the app", async () => {
      respond(200, created());
      const session = await sdk.createElementsSession({
        purpose: ElementsSessionPurpose.PAY,
        order_reference_id: "order-ref-1",
      });

      expect(session.client_secret).toBe(SECRET);
      expect(Object.keys(session)).toContain("client_secret");
      expect(JSON.stringify(session)).toContain(`"client_secret":"${SECRET}"`);
      expect(JSON.parse(JSON.stringify(session))).toEqual(JSON.parse(created()));
    });

    it("is not logged by the debug logging interceptor", async () => {
      const log = jest.spyOn(console, "log").mockImplementation(() => undefined);
      try {
        const logging = createLoggingInterceptor(true);
        await logging.response(
          { success: true, status: 200, data: JSON.parse(created()) },
          { url: `${BASE_URL}/elements/sessions`, options: { method: "POST" } }
        );
        expect(log).toHaveBeenCalled();
        const logged = log.mock.calls.map((args) => format(...args)).join("\n");
        expect(logged).not.toContain(SECRET);
      } finally {
        log.mockRestore();
      }
    });
  });
});
