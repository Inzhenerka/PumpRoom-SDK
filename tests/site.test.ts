import { describe, expect, it, vi } from "vitest";

const addPlugin = vi.fn();
const highlightAll = vi.fn();
const registerLanguage = vi.fn();
const pluginCtor = vi.fn(function () {
  return { name: "plugin" };
});

vi.mock("highlight.js/lib/core", () => ({
  default: { addPlugin, highlightAll, registerLanguage },
}));
vi.mock("highlight.js/lib/languages/bash", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/javascript", () => ({ default: vi.fn() }));
vi.mock("highlight.js/lib/languages/xml", () => ({ default: vi.fn() }));
vi.mock("highlightjs-copy", () => ({
  default: pluginCtor,
}));
vi.mock("./src/styles/bootstrap.scss", () => ({}));
vi.mock("bootstrap/dist/js/bootstrap.bundle.min.js", () => ({}));
vi.mock("highlight.js/styles/github.css", () => ({}));
vi.mock("highlightjs-copy/dist/highlightjs-copy.min.css", () => ({}));

describe("site script", () => {
  it("uses the current site origin in snippets before highlighting them", async () => {
    document.body.innerHTML = "<code>__BASE_URL__/bundle/sdk.js</code>";
    await import("../site.ts");
    document.dispatchEvent(new Event("DOMContentLoaded"));
    expect(document.querySelector("code")?.textContent).toBe(
      `${window.location.origin}/bundle/sdk.js`,
    );
    expect(pluginCtor).toHaveBeenCalledWith({ autohide: false });
    expect(addPlugin).toHaveBeenCalledWith({ name: "plugin" });
    expect(highlightAll).toHaveBeenCalled();
  });
});
