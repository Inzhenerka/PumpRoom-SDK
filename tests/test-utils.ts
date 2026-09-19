import { vi } from "vitest";

import { initApiClient } from "../src/api-client.ts";
import { setConfig, setCurrentUser } from "../src/globals.ts";

export const mockUser = { uid: "1", token: "t", is_admin: false };

export function getTestFrame(): Window {
  let frame = document.querySelector<HTMLIFrameElement>("iframe[data-sdk-test]");
  if (!frame) {
    frame = document.createElement("iframe");
    frame.dataset.sdkTest = "true";
    frame.src = "https://pumproom.inzhenerka-cloud.com/embed";
    document.body.appendChild(frame);
  }
  return frame.contentWindow!;
}

export function trustedMessage(options: MessageEventInit): MessageEvent {
  return new MessageEvent("message", {
    origin: "https://pumproom.inzhenerka-cloud.com",
    source: getTestFrame(),
    ...options,
  });
}

export function setupSdk(cacheUser = false, type?: "getcourse"): void {
  setConfig({ apiKey: "key", realm: "test", cacheUser, ...(type ? { type } : {}) });
  initApiClient("key");
  localStorage.clear();
  vi.restoreAllMocks();
  setCurrentUser(null);
}
