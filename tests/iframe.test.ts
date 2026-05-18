import { beforeEach, describe, expect, it, vi } from "vitest";

import * as iframe from "../src/iframe.ts";
import { init } from "../src/index.ts";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("iframe", () => {
  it("enforces iframe height when minHeight provided", () => {
    const spy = vi.spyOn(iframe, "enforceIframeHeight").mockImplementation(() => {});
    init({ apiKey: "key", realm: "test", minHeight: 700 });
    expect(spy).toHaveBeenCalledWith(700);
  });
});
