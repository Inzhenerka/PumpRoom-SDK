import { beforeEach, describe, expect, it, vi } from "vitest";

import { setFullscreenListener } from "../src/fullscreen.ts";
import { enforceIframeHeight } from "../src/iframe.ts";
import { trustedMessage } from "./test-utils.ts";

beforeEach(() => {
  // reset listeners
  (window as any).scrollTo = vi.fn();
});

describe("fullscreen helpers", () => {
  it("restores scroll position on exit fullscreen", () => {
    setFullscreenListener();
    Object.defineProperty(window, "scrollY", { value: 120, configurable: true });
    window.dispatchEvent(new Event("scroll"));

    const event = trustedMessage({
      data: {
        service: "pumproom",
        type: "toggleFullscreen",
        payload: { fullscreenState: false },
      },
      origin: "https://pumproom.inzhenerka-cloud.com",
    });
    window.dispatchEvent(event);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 120, left: 0, behavior: "instant" });
  });

  it("enforces iframe minimal height", () => {
    const frame = document.createElement("iframe");
    frame.src = "https://pumproom.inzhenerka-cloud.com/embed";
    frame.setAttribute("height", "300");
    document.body.appendChild(frame);
    enforceIframeHeight(600);
    expect(frame.getAttribute("height")).toBe("600px");
  });
});
