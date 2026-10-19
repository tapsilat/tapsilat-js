import { HttpClient } from "../http/HttpClient";

describe("HttpClient", () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  const client = (baseURL = "https://panel.test/api/v1") =>
    new HttpClient({ bearerToken: "token", baseURL, maxRetries: 0 });

  const respond = (status: number, body: string, contentType = "application/json") =>
    fetchMock.mockResolvedValueOnce(
      new Response(status === 204 ? null : body, {
        status,
        headers: contentType ? { "content-type": contentType } : {},
      })
    );

  it("derives API version base URLs", () => {
    expect(client().versionedBaseURL("v2")).toBe("https://panel.test/api/v2");
    expect(client("https://panel.test/api/v1/").versionedBaseURL("v2")).toBe("https://panel.test/api/v2");
    expect(client("https://panel.test").versionedBaseURL("v2")).toBe("https://panel.test/api/v2");
    expect(client("https://panel.test/prefix").versionedBaseURL("v2")).toBe("https://panel.test/prefix/api/v2");
  });

  it("treats an empty success body as success without data", async () => {
    respond(204, "", "");
    const response = await client().delete("/marketplace/release-policies/1");
    expect(response).toEqual({ success: true, status: 204, data: undefined });
  });

  it("reports an HTML page returned with status 200 as an error", async () => {
    respond(200, "<!doctype html><html></html>", "text/html; charset=utf-8");
    const response = await client().get("/order/unknown");
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe("UNEXPECTED_RESPONSE");
    expect(response.error?.statusCode).toBe(200);
    expect(response.error?.rawBody).toContain("<html>");
  });

  it("keeps the API code, status, field errors and raw body of failures", async () => {
    const body = '{"message":"INVALID_REQUEST_BODY","code":400000,"errors":{"email":"REQUIRED"}}';
    respond(400, body);
    const response = await client().post("/submerchants", { name: "A" });
    expect(response.success).toBe(false);
    expect(response.error).toMatchObject({
      message: "INVALID_REQUEST_BODY",
      statusCode: 400,
      apiCode: "400000",
      errors: { email: "REQUIRED" },
      rawBody: body,
    });
  });

  it("uses the error field when a failure has no message", async () => {
    respond(424, '{"error":"payout is not eligible","code":9}');
    const response = await client().post("/submerchant-payouts/approve", { ids: ["p"] });
    expect(response.error?.message).toBe("payout is not eligible");
    expect(response.error?.apiCode).toBe("9");
    expect(response.error?.statusCode).toBe(424);
  });

  it("parses JSON arrays and sends the bearer token", async () => {
    respond(200, '[{"id":"tx_1"}]');
    const response = await client().get<{ id: string }[]>("/order/ref/transactions");
    expect(response.data).toEqual([{ id: "tx_1" }]);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://panel.test/api/v1/order/ref/transactions");
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer token");
  });

  it("routes requests to another base URL", async () => {
    respond(200, "{}");
    await client().get("/submerchants", { baseURL: "https://panel.test/api/v2", params: { page: 1 } });
    expect(fetchMock.mock.calls[0][0]).toBe("https://panel.test/api/v2/submerchants?page=1");
  });
});
