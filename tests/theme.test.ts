import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { initializeThemePicker } from "../theme.ts";

const earlyScript = readFileSync("public/theme-init.js", "utf8");

function prepareTheme(preference: string | null, darkSystem = false, blockedStorage = false) {
  const dataset: Record<string, string> = {};
  runInNewContext(earlyScript, {
    document: { documentElement: { dataset } },
    localStorage: {
      getItem: () => {
        if (blockedStorage) throw new Error("Storage blocked");
        return preference;
      },
    },
    window: { matchMedia: () => ({ matches: darkSystem }) },
  });
  return dataset;
}

describe("theme before rendering", () => {
  it.each([
    [null, false, "os", "light"],
    [null, true, "os", "dark"],
    ["light", true, "light", "light"],
    ["dark", false, "dark", "dark"],
    ["os", true, "os", "dark"],
    ["invalid", false, "os", "light"],
  ])("resolves stored %s and system dark=%s", (stored, systemDark, preference, resolved) => {
    expect(prepareTheme(stored, systemDark)).toEqual({ theme: preference, bsTheme: resolved });
  });

  it("uses the system preference when reading storage is blocked", () => {
    expect(prepareTheme(null, true, true).bsTheme).toBe("dark");
  });
});

describe("theme picker", () => {
  let systemTheme: MediaQueryList;
  let picker: HTMLButtonElement;
  let listeners: Array<() => void>;

  beforeEach(() => {
    const media = new EventTarget();
    systemTheme = Object.assign(media, { matches: false }) as MediaQueryList;
    vi.spyOn(window, "matchMedia").mockReturnValue(systemTheme);
    document.body.innerHTML = `<button data-sdk-theme disabled>
      <span data-theme-icon="os"></span><span data-theme-icon="light"></span><span data-theme-icon="dark"></span>
    </button><span role="status" data-theme-status></span>`;
    document.documentElement.dataset.theme = "os";
    localStorage.clear();
    picker = document.querySelector("button")!;
    listeners = [];
    const addListener = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation((type, callback, options) => {
      addListener(type, callback, options);
      listeners.push(() => window.removeEventListener(type, callback, options));
    });
    initializeThemePicker();
  });

  afterEach(() => {
    listeners.forEach((remove) => remove());
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = "";
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.bsTheme;
  });

  function choose(value: string) {
    for (
      let attempt = 0;
      attempt < 3 && document.documentElement.dataset.theme !== value;
      attempt++
    ) {
      picker.click();
    }
    expect(document.documentElement.dataset.theme).toBe(value);
  }

  function systemChangesTo(dark: boolean) {
    Object.assign(systemTheme, { matches: dark });
    systemTheme.dispatchEvent(new Event("change"));
  }

  it("cycles system, light, dark, system and announces the next action", () => {
    expect(picker.disabled).toBe(false);
    expect(picker.getAttribute("aria-label")).toContain("Включить светлую тему");
    for (const mode of ["light", "dark", "os"]) {
      picker.click();
      expect(document.documentElement.dataset.theme).toBe(mode);
      expect(
        picker.querySelector("[data-theme-icon]:not(.d-none)")?.getAttribute("data-theme-icon"),
      ).toBe(mode);
    }
    expect(document.querySelector("[data-theme-status]")?.textContent).toBe("Тема: системная");
  });

  it("saves explicit choices using TypeDoc's preference key", () => {
    choose("dark");
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    expect(localStorage.getItem("tsd-theme")).toBe("dark");
    expect(picker.title).toBe("Тема: тёмная");
    systemChangesTo(false);
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
  });

  it("follows system changes only in system mode", () => {
    systemChangesTo(true);
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    choose("light");
    systemChangesTo(true);
    expect(document.documentElement.dataset.bsTheme).toBe("light");
    choose("os");
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    systemChangesTo(false);
    expect(document.documentElement.dataset.bsTheme).toBe("light");
  });

  it("works when saving storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    choose("dark");
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    expect(picker.title).toBe("Тема: тёмная");
  });

  it("receives other tabs' changes and resets to the system on storage clear", () => {
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "tsd-theme",
        newValue: "dark",
        storageArea: localStorage,
      }),
    );
    expect(document.documentElement.dataset.bsTheme).toBe("dark");
    expect(picker.title).toBe("Тема: тёмная");
    window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage }));
    expect(picker.title).toBe("Тема: системная");
    expect(document.documentElement.dataset.bsTheme).toBe("light");
  });
});
