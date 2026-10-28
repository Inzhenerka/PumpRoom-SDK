import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClient, getApiClient } from "../src/api-client.ts";
import { authenticate } from "../src/auth.ts";
import { getConfig, setConfig, setApiClientInstance } from "../src/globals.ts";
import { init } from "../src/init.ts";

const user = { uid: "1", token: "token", is_admin: false };
const primary = "https://primary.example/api";
const backup = "https://backup.example/api";
const success = () => new Response(JSON.stringify({ is_valid: true, is_admin: false }));
const fetchMock = vi.fn<typeof fetch>();
const addresses = () => fetchMock.mock.calls.map(([url]) => String(url));

beforeEach(() => {
  setApiClientInstance(null);
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  setConfig({ apiKey: "key", realm: "realm" });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("API failover", () => {
  it("does not probe during initialization or add requests to healthy operations", async () => {
    init({ apiKey: "key", realm: "realm" });
    const client = new ApiClient("key");
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(success());
    await client.verifyToken(user, "realm");
    expect(addresses()).toEqual(["https://api.pumproom.tech/integration/verify_token"]);
  });

  it("uses the legacy cloud alias after a network failure and remembers it", async () => {
    const client = new ApiClient("key");
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockImplementation(async () => success());
    await client.verifyToken(user, "realm");
    await client.storeStates([], user);
    expect(addresses()).toEqual([
      "https://api.pumproom.tech/integration/verify_token",
      "https://pumproom-api.inzhenerka-cloud.com/integration/verify_token",
      "https://pumproom-api.inzhenerka-cloud.com/tracker/set_states",
    ]);
    expect(fetchMock.mock.calls[0]![1]!.body).toEqual(fetchMock.mock.calls[1]![1]!.body);
    expect(fetchMock.mock.calls[1]![1]!.headers).toEqual({
      "Content-Type": "application/json",
      "X-API-KEY": "key",
    });
    expect(getConfig()?.apiBaseUrl).toBe("https://api.pumproom.tech");
  });

  it.each([primary, "https://api.pumproom.tech"])(
    "never adds implicit backups to explicit %s",
    async (url) => {
      const client = new ApiClient("key", url);
      fetchMock.mockRejectedValue(new TypeError("offline"));
      await expect(client.verifyToken(user, "realm")).rejects.toThrow("offline");
      expect(addresses()).toEqual([`${url}/integration/verify_token`]);
      expect(fetchMock.mock.calls[0]![1]!.signal).toBeUndefined();
    },
  );

  it("allows disabling cloud backups explicitly", async () => {
    const client = new ApiClient("key", undefined, []);
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await expect(client.verifyToken(user, "realm")).rejects.toThrow("offline");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("copies, normalizes and deduplicates addresses while preserving order and prefixes", async () => {
    const fallbacks = [`${primary}/`, `${backup}/`, backup, "https://third.example/prefix/"];
    const client = new ApiClient("key", `${primary}/`, fallbacks);
    fallbacks.length = 0;
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await expect(client.fetchStates([], user)).rejects.toThrow("offline");
    expect(addresses()).toEqual([
      `${primary}/tracker/get_states`,
      `${backup}/tracker/get_states`,
      "https://third.example/prefix/tracker/get_states",
    ]);
  });

  it.each([502, 503, 504])("retries a read after HTTP %s", async (status) => {
    const client = new ApiClient("key", primary, [backup]);
    fetchMock.mockResolvedValueOnce(new Response("Unavailable", { status }));
    fetchMock.mockResolvedValueOnce(success());
    await expect(client.verifyToken(user, "realm")).resolves.toEqual({
      is_valid: true,
      is_admin: false,
    });
    expect(addresses()).toEqual([
      `${primary}/integration/verify_token`,
      `${backup}/integration/verify_token`,
    ]);
  });

  it.each([400, 401, 403, 404, 429, 500])("does not switch after HTTP %s", async (status) => {
    const client = new ApiClient("key", primary, [backup]);
    fetchMock.mockResolvedValueOnce(new Response("Rejected", { status }));
    await expect(client.verifyToken(user, "realm")).rejects.toThrow(
      `User verification error: ${status}`,
    );
    fetchMock.mockResolvedValueOnce(success());
    await client.verifyToken(user, "realm");
    expect(addresses()).toEqual([
      `${primary}/integration/verify_token`,
      `${primary}/integration/verify_token`,
    ]);
  });

  it("never repeats saving states after a network failure", async () => {
    const client = new ApiClient("key", primary, [backup]);
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    await expect(client.storeStates([], user)).rejects.toThrow("offline");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce(success());
    await client.verifyToken(user, "realm");
    expect(addresses()[1]).toBe(`${backup}/integration/verify_token`);
  });

  it.each([502, 503, 504])("retries authentication after HTTP %s", async (status) => {
    const client = new ApiClient("key", primary, [backup]);
    fetchMock.mockResolvedValueOnce(new Response("Unavailable", { status }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(user)));
    await expect(
      client.authenticate({ identity: { provider: "lms", id: "1" } }, "realm"),
    ).resolves.toEqual(user);
    expect(addresses()).toEqual([
      `${primary}/integration/authenticate`,
      `${backup}/integration/authenticate`,
    ]);
    expect(fetchMock.mock.calls[0]![1]!.body).toEqual(fetchMock.mock.calls[1]![1]!.body);
  });

  it.each([400, 401, 403, 429, 500])(
    "does not retry authentication after HTTP %s",
    async (status) => {
      const client = new ApiClient("key", primary, [backup]);
      fetchMock.mockResolvedValueOnce(new Response("Rejected", { status }));
      await expect(
        client.authenticate({ identity: { provider: "lms", id: "1" } }, "realm"),
      ).rejects.toThrow(`Authentication error: ${status}`);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("does not repeat a write after a gateway failure", async () => {
    const client = new ApiClient("key", primary, [backup]);
    fetchMock.mockResolvedValueOnce(new Response("Unavailable", { status: 503 }));
    await expect(client.storeStates([], user)).rejects.toThrow("Request error: 503");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns the last failure after trying each address once", async () => {
    const client = new ApiClient("key", primary, [backup]);
    fetchMock.mockRejectedValueOnce(new TypeError("primary offline"));
    fetchMock.mockRejectedValueOnce(new TypeError("backup offline"));
    await expect(client.loadCourseData("realm")).rejects.toThrow("backup offline");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry malformed JSON or change the active address", async () => {
    const client = new ApiClient("key", primary, [backup]);
    fetchMock.mockResolvedValueOnce(new Response("invalid json"));
    await expect(client.verifyToken(user, "realm")).rejects.toBeInstanceOf(SyntaxError);
    fetchMock.mockResolvedValueOnce(success());
    await client.verifyToken(user, "realm");
    expect(addresses()).toEqual([
      `${primary}/integration/verify_token`,
      `${primary}/integration/verify_token`,
    ]);
  });

  it("does not send an already cancelled request", async () => {
    const client = new ApiClient("key", primary, [backup]);
    const controller = new AbortController();
    controller.abort();
    await expect(client.verifyToken(user, "realm", controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propagates cancellation without retrying or rotating addresses", async () => {
    const client = new ApiClient("key", primary, [backup]);
    const controller = new AbortController();
    fetchMock.mockImplementationOnce(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options!.signal!.addEventListener("abort", () => reject(options!.signal!.reason));
        }),
    );
    const request = client.verifyToken(user, "realm", controller.signal);
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce(success());
    await client.verifyToken(user, "realm");
    expect(addresses()[1]).toBe(`${primary}/integration/verify_token`);
  });

  it("includes reading the response body in the failover timeout and clears timers", async () => {
    vi.useFakeTimers();
    const client = new ApiClient("key", primary, [backup]);
    fetchMock.mockImplementationOnce(
      async (_url, options) =>
        ({
          ok: true,
          json: () =>
            new Promise((_resolve, reject) => {
              options!.signal!.addEventListener("abort", () => reject(options!.signal!.reason));
            }),
        }) as Response,
    );
    fetchMock.mockResolvedValueOnce(success());
    const request = client.verifyToken(user, "realm");
    await vi.advanceTimersByTimeAsync(10000);
    await expect(request).resolves.toMatchObject({ is_valid: true });
    expect(addresses()[1]).toBe(`${backup}/integration/verify_token`);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(["authenticate", "storeStates"] as const)(
    "allows slow %s to finish without a new timeout",
    async (operation) => {
      vi.useFakeTimers();
      const client = new ApiClient("key", primary, [backup]);
      let complete!: (response: Response) => void;
      fetchMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            complete = resolve;
          }),
      );
      const request =
        operation === "authenticate"
          ? client.authenticate({ identity: { provider: "lms", id: "1" } }, "realm")
          : client.storeStates([], user);
      expect(vi.getTimerCount()).toBe(0);
      await vi.advanceTimersByTimeAsync(30000);
      complete(success());
      await expect(request).resolves.toMatchObject({ is_valid: true });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      fetchMock.mockResolvedValueOnce(success());
      await client.verifyToken(user, "realm");
      expect(addresses()[1]).toBe(`${primary}/integration/verify_token`);
    },
  );

  it("preserves the caller's signal when no backups are configured", async () => {
    const client = new ApiClient("key", primary);
    const controller = new AbortController();
    fetchMock.mockResolvedValueOnce(success());
    await client.verifyToken(user, "realm", controller.signal);
    expect(fetchMock.mock.calls[0]![1]!.signal).toBe(controller.signal);
  });

  it("authenticates through the backup and keeps it after reinitialization", async () => {
    const config = {
      apiKey: "key",
      realm: "realm",
      cacheUser: false,
      apiBaseUrl: primary,
      fallbackApiBaseUrls: [backup],
    };
    const options = { identity: { provider: "lms" as const, id: "1" } };
    init(config);
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    fetchMock.mockImplementation(async () => new Response(JSON.stringify(user)));
    await expect(authenticate(options)).resolves.toEqual(user);
    init(config);
    await expect(authenticate(options)).resolves.toEqual(user);
    expect(addresses()).toEqual([
      `${primary}/integration/authenticate`,
      `${backup}/integration/authenticate`,
      `${backup}/integration/authenticate`,
    ]);
  });

  it("keeps the selected backup across equivalent initialization", async () => {
    init({ apiKey: "key", realm: "realm", apiBaseUrl: primary, fallbackApiBaseUrls: [backup] });
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    fetchMock.mockImplementation(async () => success());
    await getApiClient().verifyToken(user, "realm");
    init({
      apiKey: "key",
      realm: "realm",
      apiBaseUrl: `${primary}/`,
      fallbackApiBaseUrls: [`${backup}/`, backup],
      pageUrl: "https://lms.example/new-lesson",
    });
    await getApiClient().verifyToken(user, "realm");
    expect(addresses()).toEqual([
      `${primary}/integration/verify_token`,
      `${backup}/integration/verify_token`,
      `${backup}/integration/verify_token`,
    ]);
  });

  it.each([
    { apiKey: "new-key" },
    { apiBaseUrl: "https://new-primary.example/api" },
    { fallbackApiBaseUrls: ["https://new-backup.example/api"] },
    { fallbackApiBaseUrls: [] },
  ])("starts at the primary when API configuration changes: %j", async (changes) => {
    const config = {
      apiKey: "key",
      realm: "realm",
      apiBaseUrl: primary,
      fallbackApiBaseUrls: [backup],
    };
    init(config);
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    fetchMock.mockImplementation(async () => success());
    await getApiClient().verifyToken(user, "realm");
    init({ ...config, ...changes });
    await getApiClient().verifyToken(user, "realm");
    expect(addresses()[2]).toBe(`${changes.apiBaseUrl ?? primary}/integration/verify_token`);
    expect(fetchMock.mock.calls[2]![1]!.headers).toMatchObject({
      "X-API-KEY": changes.apiKey ?? "key",
    });
  });

  it("does not let a late concurrent failure skip the selected backup", async () => {
    const client = new ApiClient("key", primary, [backup, "https://third.example"]);
    let rejectFirst!: (error: Error) => void;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectFirst = reject;
        }),
    );
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    fetchMock.mockImplementation(async () => success());
    const first = client.verifyToken(user, "realm");
    await client.verifyToken(user, "realm");
    rejectFirst(new TypeError("late failure"));
    await first;
    await client.verifyToken(user, "realm");
    expect(addresses()).toEqual([
      `${primary}/integration/verify_token`,
      `${primary}/integration/verify_token`,
      `${backup}/integration/verify_token`,
      `${backup}/integration/verify_token`,
      `${backup}/integration/verify_token`,
    ]);
  });
});
