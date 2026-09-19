import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_TRUSTED_ORIGINS } from "../src/constants.ts";
import { setConfig } from "../src/globals.ts";
import * as iframe from "../src/iframe.ts";
import { init } from "../src/index.ts";

beforeEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
  setConfig({ apiKey: "key", realm: "test" });
});

describe("iframe", () => {
  it.each(DEFAULT_TRUSTED_ORIGINS)(
    "sizes the standard origin %s without opting in to message checks",
    (origin) => {
      const frame = document.createElement("iframe");
      frame.src = `${origin}/embed?task=example`;
      frame.setAttribute("height", "300");
      document.body.appendChild(frame);
      iframe.enforceIframeHeight(600);
      expect(frame.getAttribute("height")).toBe("600px");
    },
  );

  it("sizes custom origins only when configured", () => {
    const frame = document.createElement("iframe");
    frame.src = "https://tasks.school.example/embed";
    frame.setAttribute("height", "300");
    document.body.appendChild(frame);
    iframe.enforceIframeHeight(600);
    expect(frame.getAttribute("height")).toBe("300");
    setConfig({ apiKey: "key", realm: "test", trustedOrigins: ["https://tasks.school.example"] });
    iframe.enforceIframeHeight(600);
    expect(frame.getAttribute("height")).toBe("600px");
  });

  it.each([
    "https://pumproom.other.example",
    "https://pumproom.inzhenerka-cloud.com.other.example",
    "https://ide.code.winbd.ru",
    "http://pumproom.inzhenerka-cloud.com",
    "https://pumproom.inzhenerka-cloud.com:8443",
    "http://[",
    "",
  ])("does not resize unrelated or invalid source %s", (src) => {
    const frame = document.createElement("iframe");
    frame.src = src;
    frame.setAttribute("height", "300");
    document.body.appendChild(frame);
    iframe.enforceIframeHeight(600);
    expect(frame.getAttribute("height")).toBe("300");
  });

  it("enforces iframe height when minHeight provided", () => {
    const spy = vi.spyOn(iframe, "enforceIframeHeight").mockImplementation(() => {});
    init({ apiKey: "key", realm: "test", minHeight: 700 });
    expect(spy).toHaveBeenCalledWith(700);
  });
});
