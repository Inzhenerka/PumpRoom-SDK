import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { API_BASE_URL } from "../src/constants.ts";
import * as fullscreen from "../src/fullscreen.ts";
import {
  getConfig,
  getCurrentUser,
  getRegisteredStates,
  registerStates,
  resetRegisteredStates,
  setConfig,
  setCurrentUser,
} from "../src/globals.ts";
import { init } from "../src/index.ts";

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
  // Reset registered states after each test
  resetRegisteredStates();
});

describe("globals", () => {
  it.each<[string, unknown]>([
    ["apiKey", ""],
    ["apiKey", "   "],
    ["apiKey", undefined],
    ["apiKey", 123],
    ["realm", ""],
    ["realm", "   "],
    ["realm", undefined],
    ["realm", 123],
    ["apiBaseUrl", "not-a-url"],
    ["trustedOrigins", ["not-an-origin"]],
    ["trustedOrigins", ["*"]],
    ["trustedOrigins", [123]],
    ["trustedOrigins", "https://tasks.example"],
  ])("rejects invalid %s without requests or replacing active configuration", (field, value) => {
    init({ apiKey: "key", realm: "test" });
    const previous = getConfig();
    const user = { uid: "1", token: "t", is_admin: false };
    setCurrentUser(user);
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const listener = vi.spyOn(window, "addEventListener");

    expect(() => init({ apiKey: "key", realm: "test", [field]: value })).toThrow(field);
    expect(fetch).not.toHaveBeenCalled();
    expect(listener).not.toHaveBeenCalled();
    expect(getConfig()).toBe(previous);
    expect(getCurrentUser()).toBe(user);
  });

  it("initializes config", () => {
    setConfig({ apiKey: "key", realm: "test" });
    expect(getConfig()).toEqual({
      apiKey: "key",
      realm: "test",
      apiBaseUrl: API_BASE_URL,
      cacheUser: true,
    });
  });

  it("normalizes a custom API base URL", () => {
    setConfig({ apiKey: "key", realm: "test", apiBaseUrl: "https://pump.example/api/" });
    expect(getConfig()?.apiBaseUrl).toBe("https://pump.example/api");
  });

  it("normalizes an explicit page URL", () => {
    setConfig({
      apiKey: "key",
      realm: "test",
      pageUrl: "https://lms.example/course-42/lesson-1?token=secret#section",
    });
    expect(getConfig()?.pageUrl).toBe("https://lms.example/course-42/lesson-1");
  });

  it("rejects an invalid explicit page URL", () => {
    expect(() => setConfig({ apiKey: "key", realm: "test", pageUrl: "scorm:lesson-1" })).toThrow(
      "pageUrl",
    );
  });

  it("rejects an invalid API base URL", () => {
    expect(() =>
      setConfig({ apiKey: "key", realm: "test", apiBaseUrl: "javascript:alert(1)" }),
    ).toThrow("apiBaseUrl");
  });

  it("calls fullscreen handler when initialized via init", () => {
    const spy = vi.spyOn(fullscreen, "setFullscreenListener").mockImplementation(() => {});
    init({ apiKey: "key", realm: "test" });
    expect(spy).toHaveBeenCalled();
  });

  it("sets and gets current user", () => {
    const user = { uid: "1", token: "t", is_admin: false };
    setCurrentUser(user);
    expect(getCurrentUser()).toEqual(user);
  });

  it("keeps the current user when reinitialized with the same authentication scope", () => {
    const user = { uid: "1", token: "t", is_admin: false };
    init({ apiKey: "key", realm: "test" });
    setCurrentUser(user);

    init({ apiKey: "key", realm: "test", minHeight: 600 });

    expect(getCurrentUser()).toEqual(user);
  });

  it("clears the current user when the authentication scope changes", () => {
    const user = { uid: "1", token: "t", is_admin: false };
    init({ apiKey: "key", realm: "test" });
    setCurrentUser(user);

    init({ apiKey: "key", realm: "another-realm" });
    expect(getCurrentUser()).toBeNull();

    setCurrentUser(user);
    init({ apiKey: "another-key", realm: "another-realm" });
    expect(getCurrentUser()).toBeNull();

    setCurrentUser(user);
    init({
      apiKey: "another-key",
      realm: "another-realm",
      apiBaseUrl: "https://on-prem.example/api",
    });
    expect(getCurrentUser()).toBeNull();
  });

  describe("state registration", () => {
    it("registers state names", () => {
      // Initially, no states are registered
      expect(getRegisteredStates()).toEqual([]);

      // Register some states
      registerStates(["state1", "state2"]);

      // Check that the states were registered
      expect(getRegisteredStates()).toEqual(["state1", "state2"]);
    });

    it("throws an error if stateNames is not an array", () => {
      // @ts-ignore - Testing runtime type checking
      expect(() => registerStates("not-an-array")).toThrow("stateNames must be an array");
    });

    it("does not add duplicate state names", () => {
      // Register some states
      registerStates(["state1", "state2"]);

      // Register the same states again plus a new one
      registerStates(["state1", "state2", "state3"]);

      // Check that duplicates were not added
      expect(getRegisteredStates()).toEqual(["state1", "state2", "state3"]);
    });

    it("returns a copy of registered states", () => {
      // Register some states
      registerStates(["state1", "state2"]);

      // Get the registered states
      const states = getRegisteredStates();

      // Modify the returned array
      states.push("state3");

      // Check that the original registered states were not modified
      expect(getRegisteredStates()).toEqual(["state1", "state2"]);
    });

    it("resets registered states", () => {
      // Register some states
      registerStates(["state1", "state2"]);

      // Reset the registered states
      resetRegisteredStates();

      // Check that the registered states were reset
      expect(getRegisteredStates()).toEqual([]);
    });
  });
});
