import { describe, expect, it } from "vitest";

import pkg from "../package.json";
import { getVersion } from "../src/version.ts";

describe("version", () => {
  it("returns package version", () => {
    expect(getVersion()).toBe(pkg.version);
  });
});
