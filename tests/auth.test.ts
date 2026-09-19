import { beforeEach, describe, expect, it, vi } from "vitest";

import { initApiClient } from "../src/api-client.ts";
import { authenticate, setUser } from "../src/auth.ts";
import { AUTH_URL, VERIFY_URL } from "../src/constants.ts";
import { getCurrentUser, setConfig, setCurrentUser } from "../src/globals.ts";
import { getTestFrame, setupSdk, trustedMessage } from "./test-utils.ts";

function boundCache(user: { uid: string; token: string; is_admin: boolean }, id: string) {
  return { ...user, cacheVersion: 2, authContext: { realm: "test", provider: "lms", id } };
}

beforeEach(() => {
  setupSdk();
});

describe("authenticate", () => {
  it("requests auth endpoint", async () => {
    const response = { uid: "1", token: "tok", is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    const user = await authenticate({
      identity: { provider: "lms", id: "lms-user-1" },
    });

    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
    expect(user).toEqual(response);
    expect(getCurrentUser()).toEqual(response);
  });

  it("authenticates without caching when localStorage access is denied", async () => {
    setConfig({ apiKey: "key", realm: "test", cacheUser: true });
    const response = { uid: "1", token: "tok", is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });
    const storageSpy = vi.spyOn(globalThis, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Access denied", "SecurityError");
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      const user = await authenticate({
        identity: { provider: "lms", id: "lms-user-1" },
      });

      expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
      expect(user).toEqual(response);
      expect(getCurrentUser()).toEqual(response);
    } finally {
      storageSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });

  it("uses cached user when verified", async () => {
    setConfig({ apiKey: "key", realm: "test", cacheUser: true });
    const cached = {
      uid: "2",
      token: "cached",
      is_admin: true,
      provider: "lms",
      available_providers: ["lms", "telegram"],
    };
    localStorage.setItem(
      "pumproomUser",
      JSON.stringify(boundCache(cached, `lms-user-${cached.uid}`)),
    );

    const verifyResp = { is_valid: true, is_admin: true };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const user = await authenticate({
      identity: { provider: "lms", id: "lms-user-2" },
    });

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(user).toEqual(cached);
  });

  it("clears invalid cached user", async () => {
    setConfig({ apiKey: "key", realm: "test", cacheUser: true });
    const cached = { uid: "3", token: "bad", is_admin: false };
    localStorage.setItem(
      "pumproomUser",
      JSON.stringify(boundCache(cached, `lms-user-${cached.uid}`)),
    );

    const verifyResp = { is_valid: false, is_admin: false };
    const authResp = { uid: "3", token: "new", is_admin: false };
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(verifyResp) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(authResp) });

    const user = await authenticate({
      identity: { provider: "lms", id: "lms-user-3" },
    });

    expect(localStorage.getItem("pumproomUser")).not.toContain("bad");
    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
    expect(user).toEqual(authResp);
  });

  it("throws on auth error", async () => {
    setConfig({ apiKey: "key", realm: "test", cacheUser: false });
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "fail" });

    await expect(
      authenticate({
        identity: { provider: "lms", id: "lms-user-error" },
      }),
    ).rejects.toThrow("Authentication error");
    expect(getCurrentUser()).toBeNull();
  });

  it("sends LMS identity fields to auth endpoint", async () => {
    const response = { uid: "4", token: "tok", is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    await authenticate({
      identity: {
        provider: "lms",
        id: "lms-user-4",
        language: "en",
        provider_extra: { group: "advanced" },
      },
    });

    const call = vi.mocked(fetch).mock.calls[0][1];
    expect(call?.body).toContain('"provider":"lms"');
    expect(call?.body).toContain('"id":"lms-user-4"');
    expect(call?.body).toContain('"language":"en"');
    expect(call?.body).toContain('"provider_extra":{"group":"advanced"}');
  });
});

describe("setUser", () => {
  it("verifies and sets a user with valid token", async () => {
    const userInput = { uid: "123", token: "valid-token" };
    const verifyResp = { is_valid: true, is_admin: true };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const user = await setUser(userInput);

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(user).toEqual({ ...userInput, is_admin: true });
    expect(getCurrentUser()).toEqual({ ...userInput, is_admin: true });
  });

  it("returns null when token verification fails", async () => {
    const userInput = { uid: "123", token: "invalid-token" };
    const verifyResp = { is_valid: false, is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    const user = await setUser(userInput);

    expect(fetch).toHaveBeenCalledWith(VERIFY_URL, expect.any(Object));
    expect(user).toBeNull();
  });

  it("returns null when verification request fails", async () => {
    const userInput = { uid: "123", token: "token" };
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const user = await setUser(userInput);

    expect(errorSpy).toHaveBeenCalled();
    expect(user).toBeNull();
  });

  it("caches user when cacheUser is enabled", async () => {
    setConfig({ apiKey: "key", realm: "test", cacheUser: true });
    const userInput = { uid: "123", token: "valid-token" };
    const verifyResp = { is_valid: true, is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    await setUser(userInput);

    const cachedUser = JSON.parse(localStorage.getItem("pumproomUser") || "{}");
    expect(cachedUser).toEqual({ ...userInput, is_admin: false });
  });
});

describe("default user listener", () => {
  it("responds to getPumpRoomUser messages", async () => {
    const response = { uid: "9", token: "tok", is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(response) });

    await authenticate({ identity: { provider: "lms", id: "u" } });

    const postSpy = vi.spyOn(getTestFrame(), "postMessage");
    const event = trustedMessage({
      data: { service: "pumproom", type: "getPumpRoomUser" },
      origin: "https://pumproom.inzhenerka-cloud.com",
      source: getTestFrame(),
    });

    window.dispatchEvent(event);

    expect(postSpy).toHaveBeenCalledWith(
      {
        service: "pumproom",
        type: "setPumpRoomUser",
        payload: response,
      },
      "https://pumproom.inzhenerka-cloud.com",
    );
  });

  it("does nothing when current user is null", async () => {
    const verifyResp = { is_valid: true, is_admin: false };
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(verifyResp) });

    await setUser({ uid: "1", token: "t" });
    setCurrentUser(null);

    const postSpy = vi.spyOn(getTestFrame(), "postMessage");
    const event = trustedMessage({
      data: { service: "pumproom", type: "getPumpRoomUser" },
      origin: "https://pumproom.inzhenerka-cloud.com",
      source: getTestFrame(),
    });

    window.dispatchEvent(event);

    expect(postSpy).not.toHaveBeenCalled();
  });
});

// Additional tests for user message handling would go here
// These tests are simplified to avoid mocking issues

describe("error handling in authentication", () => {
  it("keeps cached credentials when verification is unavailable", async () => {
    setConfig({ apiKey: "key", realm: "test", cacheUser: true });
    const user = { uid: "11", token: "token", is_admin: false };
    localStorage.setItem("pumproomUser", JSON.stringify(boundCache(user, "u")));

    global.fetch = vi.fn().mockRejectedValue(new Error("API error"));

    await expect(authenticate({ identity: { provider: "lms", id: "u" } })).rejects.toThrow(
      "API error",
    );
    expect(JSON.parse(localStorage.getItem("pumproomUser") || "null")).toEqual(
      boundCache(user, "u"),
    );
  });

  it("replaces malformed cached credentials after authenticating", async () => {
    setConfig({ apiKey: "key", realm: "test", cacheUser: true });
    const response = { uid: "12", token: "new-token", is_admin: false };
    localStorage.setItem("pumproomUser", JSON.stringify({ uid: "12" }));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(response),
    });

    const result = await authenticate({ identity: { provider: "lms", id: "u" } });

    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
    expect(result).toEqual(response);
    expect(JSON.parse(localStorage.getItem("pumproomUser") || "null")).toEqual(
      boundCache(response, "u"),
    );
  });
});

describe("identity-bound cache migration", () => {
  const oldUser = { uid: "old", token: "existing", is_admin: false };
  const newUser = { uid: "new", token: "new-token", is_admin: false };
  const identity = { provider: "lms" as const, id: "student@example.com" };
  const response = (user: typeof oldUser) => ({ ok: true, json: async () => user });

  beforeEach(() => setupSdk(true));

  it.each([oldUser, newUser])(
    "resolves legacy credentials by current identity: $uid",
    async (resolved) => {
      localStorage.setItem("pumproomUser", JSON.stringify(oldUser));
      global.fetch = vi.fn().mockResolvedValue(response(resolved));
      expect(await authenticate({ identity })).toEqual(resolved);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        AUTH_URL,
        expect.objectContaining({
          body: expect.stringContaining(identity.id),
        }),
      );
      expect(JSON.parse(localStorage.getItem("pumproomUser")!)).toEqual(
        boundCache(resolved, identity.id),
      );
    },
  );

  it.each([
    { realm: "test", provider: "lms", id: "other@example.com" },
    { realm: "other", provider: "lms", id: identity.id },
    { realm: "test", provider: "telegram", id: identity.id },
  ])("reauthenticates when context differs: %j", async (authContext) => {
    localStorage.setItem(
      "pumproomUser",
      JSON.stringify({ ...boundCache(oldUser, identity.id), authContext }),
    );
    global.fetch = vi.fn().mockResolvedValue(response(newUser));
    expect(await authenticate({ identity })).toEqual(newUser);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(AUTH_URL, expect.any(Object));
  });

  it("does not reuse cloud credentials with a custom API", async () => {
    const apiBaseUrl = "https://pump.example/api";
    localStorage.setItem("pumproomUser", JSON.stringify(boundCache(oldUser, identity.id)));
    setConfig({ apiKey: "key", realm: "test", cacheUser: true, apiBaseUrl });
    initApiClient("key", apiBaseUrl);
    global.fetch = vi.fn().mockResolvedValue(response(newUser));

    expect(await authenticate({ identity })).toEqual(newUser);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      `${apiBaseUrl}/integration/authenticate`,
      expect.any(Object),
    );
    expect(JSON.parse(localStorage.getItem("pumproomUser")!)).toEqual({
      ...newUser,
      cacheVersion: 2,
      authContext: { realm: "test", provider: "lms", id: identity.id, apiBaseUrl },
    });
  });

  it.each([oldUser, boundCache(oldUser, "other")])(
    "preserves storage and clears active credentials on failure",
    async (cached) => {
      const raw = JSON.stringify(cached);
      localStorage.setItem("pumproomUser", raw);
      setCurrentUser(oldUser);
      global.fetch = vi.fn().mockRejectedValue(new Error("offline"));
      await expect(authenticate({ identity })).rejects.toThrow("offline");
      expect(localStorage.getItem("pumproomUser")).toBe(raw);
      expect(getCurrentUser()).toBeNull();
    },
  );

  it("validates GetCourse identity before checking even a matching cache", async () => {
    setupSdk(true, "getcourse");
    localStorage.setItem("pumproomUser", JSON.stringify(boundCache(oldUser, "{email}")));
    setCurrentUser(oldUser);
    vi.spyOn(window, "alert").mockImplementation(() => {});
    global.fetch = vi.fn();
    await expect(authenticate({ identity: { ...identity, id: "{email}" } })).rejects.toThrow(
      "GetCourse UID",
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(getCurrentUser()).toBeNull();
  });

  it("rejects a stale auth response without overwriting the newer account", async () => {
    let finish!: (value: ReturnType<typeof response>) => void;
    global.fetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(response(newUser));
    const stale = authenticate({ identity: { ...identity, id: "old" } });
    expect(getCurrentUser()).toBeNull();
    await authenticate({ identity });
    finish(response(oldUser));
    await expect(stale).rejects.toThrow("superseded");
    expect(getCurrentUser()).toEqual(newUser);
    expect(JSON.parse(localStorage.getItem("pumproomUser")!)).toEqual(
      boundCache(newUser, identity.id),
    );
  });

  it("rejects stale verification without restoring the old cache", async () => {
    localStorage.setItem("pumproomUser", JSON.stringify(boundCache(oldUser, "old")));
    let finish!: (value: unknown) => void;
    global.fetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(response(newUser));
    const stale = authenticate({ identity: { ...identity, id: "old" } });
    await authenticate({ identity });
    finish({ ok: true, json: async () => ({ is_valid: true, is_admin: true }) });
    await expect(stale).rejects.toThrow("superseded");
    expect(getCurrentUser()).toEqual(newUser);
    expect(JSON.parse(localStorage.getItem("pumproomUser")!)).toEqual(
      boundCache(newUser, identity.id),
    );
  });

  it("strips inherited context in setUser and migrates it on the next authenticate", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ is_valid: true, is_admin: false }) })
      .mockResolvedValueOnce(response(newUser));
    await setUser(boundCache(oldUser, "old"));
    expect(JSON.parse(localStorage.getItem("pumproomUser")!)).toEqual(oldUser);
    expect(await authenticate({ identity })).toEqual(newUser);
  });

  it("does not let a pending setUser overwrite a newer authenticate", async () => {
    let finish!: (value: unknown) => void;
    global.fetch = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce(response(newUser));
    const stale = setUser(oldUser);
    await authenticate({ identity });
    finish({ ok: true, json: async () => ({ is_valid: true, is_admin: false }) });
    expect(await stale).toBeNull();
    expect(getCurrentUser()).toEqual(newUser);
  });
});
