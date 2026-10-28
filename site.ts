import "./src/styles/bootstrap.scss";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import javascript from "highlight.js/lib/languages/javascript";
import xml from "highlight.js/lib/languages/xml";
import CopyButtonPlugin from "highlightjs-copy";

import { initializeThemePicker } from "./theme.ts";

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("xml", xml);

export function replaceSdkBaseUrl(root: ParentNode = document): void {
  const baseUrl = new URL(".", window.location.href).href.replace(/\/$/, "");
  root.querySelectorAll("code").forEach((element) => {
    if (element.textContent?.includes("__BASE_URL__")) {
      element.textContent = element.textContent.split("__BASE_URL__").join(baseUrl);
    }
  });
}

/** Place the existing copy controls in Bootstrap card headers. */
export function decorateCodeBlocks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("pre > code.hljs").forEach((code) => {
    const pre = code.parentElement!;
    if (pre.parentElement?.classList.contains("card")) return;

    const card = document.createElement("div");
    card.className = "card mb-3 overflow-hidden";
    const header = document.createElement("div");
    header.className = "card-header d-flex align-items-center justify-content-between gap-2 py-2";
    const label = document.createElement("span");
    label.className = "small fw-semibold text-body-secondary";
    const language = code.className.match(/language-(\w+)/)?.[1];
    label.textContent =
      language === "bash" ? "Терминал" : language === "html" ? "HTML" : "JavaScript";
    header.appendChild(label);

    const controls = pre.querySelector<HTMLElement>(".hljs-copy-container");
    const button = controls?.querySelector("button");
    if (controls && button) {
      controls.removeAttribute("style");
      button.classList.add("btn", "btn-sm", "btn-secondary");
      button.setAttribute("type", "button");
      button.setAttribute("aria-label", `Копировать код: ${label.textContent}`);
      header.appendChild(controls);
    }
    pre.before(card);
    card.append(header, pre);
    pre.classList.add("mb-0");
    code.classList.add("bg-body-tertiary", "p-3");
  });
}

/** Restore a known tab without inserting untrusted URL text into a selector. */
export function restoreSetupTab(): void {
  const selected = new URL(window.location.href).searchParams.get("tab") ?? "cdn";
  const buttons = document.querySelectorAll<HTMLButtonElement>("#setupTabs [data-bs-target]");
  const button = Array.from(buttons).find((item) => item.dataset.bsTarget === `#${selected}`);
  if (button && !button.classList.contains("active")) button.click();
}

/** Keep links shareable while preserving other URL parameters and the section anchor. */
export function updateSetupTabUrl(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const tab = target.dataset.bsTarget?.slice(1);
  if (!tab) return;
  const url = new URL(window.location.href);
  url.searchParams.set("tab", tab);
  window.history.replaceState(window.history.state, "", url);
}

document.addEventListener("DOMContentLoaded", () => {
  initializeThemePicker();
  replaceSdkBaseUrl();
  hljs.addPlugin(new CopyButtonPlugin({ autohide: false }));
  hljs.highlightAll();
  decorateCodeBlocks();

  restoreSetupTab();
  document.getElementById("setupTabs")?.addEventListener("shown.bs.tab", updateSetupTabUrl);
});

window.addEventListener("popstate", restoreSetupTab);
