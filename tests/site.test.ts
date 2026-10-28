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

describe("site script", () => {
  it.each(["/sdk/", "/sdk/index.html"])("keeps the site prefix at %s", async (path) => {
    window.history.replaceState({}, "", path);
    try {
      document.body.innerHTML = "<code>__BASE_URL__/bundle/sdk.js</code>";
      const { replaceSdkBaseUrl } = await import("../site.ts");
      replaceSdkBaseUrl();
      expect(document.querySelector("code")?.textContent).toBe(
        `${window.location.origin}/sdk/bundle/sdk.js`,
      );
    } finally {
      window.history.replaceState({}, "", "/");
    }
  });
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

describe("setup tab links", () => {
  it("preserves the path, other parameters, anchor and history state", async () => {
    const { updateSetupTabUrl } = await import("../site.ts");
    window.history.replaceState({ source: "guide" }, "", "/sdk/?lang=ru#setup");
    document.body.innerHTML = '<button data-bs-target="#getcourse"></button>';
    const button = document.querySelector("button")!;
    button.addEventListener("shown.bs.tab", updateSetupTabUrl);
    button.dispatchEvent(new Event("shown.bs.tab"));
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(
      "/sdk/?lang=ru&tab=getcourse#setup",
    );
    expect(window.history.state).toEqual({ source: "guide" });
    window.history.replaceState(null, "", "/");
  });

  it("restores only known tabs and ignores malformed values", async () => {
    const { restoreSetupTab } = await import("../site.ts");
    document.body.innerHTML = `
      <div id="setupTabs">
        <button class="active" data-bs-target="#cdn"></button>
        <button data-bs-target="#npm"></button>
      </div>`;
    const click = vi.spyOn(
      document.querySelector<HTMLButtonElement>('[data-bs-target="#npm"]')!,
      "click",
    );
    window.history.replaceState(null, "", "/?tab=npm");
    restoreSetupTab();
    expect(click).toHaveBeenCalledOnce();
    click.mockClear();
    window.history.replaceState(null, "", "/?tab=%22%5D%23unknown");
    expect(() => restoreSetupTab()).not.toThrow();
    expect(click).not.toHaveBeenCalled();
    window.history.replaceState(null, "", "/");
  });
});
