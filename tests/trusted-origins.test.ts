import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authenticate } from "../src/auth.ts";
import {
  setOnInitCallback,
  setOnResultReadyCallback,
  setOnTaskLoadedCallback,
  setOnTaskSubmittedCallback,
} from "../src/callbacks.ts";
import { DEFAULT_TRUSTED_ORIGINS } from "../src/constants.ts";
import { getConfig } from "../src/globals.ts";
import { init } from "../src/index.ts";
import { getPumpRoomEventMessage } from "../src/messaging.ts";
import { setupSdk } from "./test-utils.ts";

const production = DEFAULT_TRUSTED_ORIGINS[0];
const user = { uid: "student", token: "test-token", is_admin: false };

function frameAt(origin: string): HTMLIFrameElement {
  const frame = document.createElement("iframe");
  frame.src = `${origin}/embed`;
  document.body.appendChild(frame);
  return frame;
}

function request(origin: string, source: Window | null): MessageEvent {
  return new MessageEvent("message", {
    origin,
    source,
    data: { service: "pumproom", type: "getPumpRoomUser" },
  });
}

beforeEach(() => {
  setupSdk();
  init({ apiKey: "key", realm: "test" });
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => user });
});
afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("trusted message senders", () => {
  it.each(DEFAULT_TRUSTED_ORIGINS)(
    "returns credentials to an attached iframe at %s",
    async (origin) => {
      const frame = frameAt(origin);
      const post = vi.spyOn(frame.contentWindow!, "postMessage");
      await authenticate({ identity: { provider: "lms", id: "student" } });
      window.dispatchEvent(request(origin, frame.contentWindow));
      expect(post).toHaveBeenCalledWith(
        { service: "pumproom", type: "setPumpRoomUser", payload: user },
        origin,
      );
    },
  );

  it.each([
    "https://untrusted.example",
    "https://ide.code.winbd.ru",
    "https://pumproom.attacker.example",
    "https://pumproom.inzhenerka-cloud.com.attacker.example",
    "http://pumproom.inzhenerka-cloud.com",
    "https://pumproom.inzhenerka-cloud.com:8443",
  ])("does not return credentials to %s", async (origin) => {
    const frame = frameAt(origin);
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    await authenticate({ identity: { provider: "lms", id: "student" } });
    window.dispatchEvent(request(origin, frame.contentWindow));
    expect(post).not.toHaveBeenCalled();
  });

  it("rejects missing, detached, parent, and mismatched sources", () => {
    const detached = frameAt(production);
    const detachedWindow = detached.contentWindow;
    detached.remove();
    const foreign = frameAt("https://other.example");
    frameAt(production);
    for (const source of [null, window, detachedWindow, foreign.contentWindow]) {
      expect(getPumpRoomEventMessage(request(production, source), "getPumpRoomUser")).toBeNull();
    }
    expect(
      getPumpRoomEventMessage(request("null", foreign.contentWindow), "getPumpRoomUser"),
    ).toBeNull();
  });

  it("accepts an explicitly configured custom origin and replaces standard origins", async () => {
    init({ apiKey: "key", realm: "test", trustedOrigins: ["https://TASKS.school.example/"] });
    const frame = frameAt("https://tasks.school.example");
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    await authenticate({ identity: { provider: "lms", id: "student" } });
    window.dispatchEvent(request("https://tasks.school.example", frame.contentWindow));
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ payload: user }),
      "https://tasks.school.example",
    );
    const standard = frameAt(production);
    expect(
      getPumpRoomEventMessage(request(production, standard.contentWindow), "getPumpRoomUser"),
    ).toBeNull();
  });

  it("trusts no iframe origins when configured with an empty list", () => {
    init({ apiKey: "key", realm: "test", trustedOrigins: [] });
    const standard = frameAt(production);
    expect(
      getPumpRoomEventMessage(request(production, standard.contentWindow), "getPumpRoomUser"),
    ).toBeNull();
  });

  it("does not retain custom origins after reinitialization", () => {
    const origin = "http://localhost:3000";
    const frame = frameAt(origin);
    init({ apiKey: "key", realm: "test", trustedOrigins: [origin] });
    expect(
      getPumpRoomEventMessage(request(origin, frame.contentWindow), "getPumpRoomUser"),
    ).not.toBeNull();
    init({ apiKey: "key", realm: "test" });
    expect(
      getPumpRoomEventMessage(request(origin, frame.contentWindow), "getPumpRoomUser"),
    ).toBeNull();
  });

  it("rejects an untrusted sender when trustedOrigins is omitted", async () => {
    const post = vi.spyOn(window, "postMessage");
    await authenticate({ identity: { provider: "lms", id: "student" } });
    window.dispatchEvent(request("https://custom-lms.example", window));
    expect(post).not.toHaveBeenCalled();
  });

  it("returns to standard origins after reinitialization without trustedOrigins", () => {
    const event = request("https://custom-lms.example", window);
    expect(getPumpRoomEventMessage(event, "getPumpRoomUser")).toBeNull();
    init({ apiKey: "key", realm: "test" });
    expect(getConfig()?.trustedOrigins).toBeUndefined();
    expect(getPumpRoomEventMessage(event, "getPumpRoomUser")).toBeNull();
  });

  it.each([
    "*",
    "null",
    "https://*.example",
    "https://example.com/path",
    "https://user:pass@example.com",
    "https://example.com?q=1",
    "https://example.com/#part",
    "file:///tmp",
    "data:text/html,test",
  ])("rejects invalid configuration %s before changing configuration", (origin) => {
    const previous = getConfig();
    expect(() => init({ apiKey: "key", realm: "test", trustedOrigins: [origin] })).toThrow();
    expect(getConfig()).toBe(previous);
  });

  it("blocks untrusted environment, task, result, and fullscreen messages", () => {
    const callback = vi.fn();
    setOnInitCallback(callback);
    setOnTaskLoadedCallback(callback);
    setOnTaskSubmittedCallback(callback);
    setOnResultReadyCallback(callback);
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const frame = frameAt("https://untrusted.example");
    const post = vi.spyOn(frame.contentWindow!, "postMessage");
    for (const type of [
      "getEnvironment",
      "onTaskLoaded",
      "onTaskSubmitted",
      "onResultReady",
      "toggleFullscreen",
    ]) {
      window.dispatchEvent(
        new MessageEvent("message", {
          origin: "https://untrusted.example",
          source: frame.contentWindow,
          data: {
            service: "pumproom",
            type,
            payload: { instanceContext: { instanceUid: "fake" }, fullscreenState: false },
          },
        }),
      );
    }
    expect(callback).not.toHaveBeenCalled();
    expect(scroll).not.toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
