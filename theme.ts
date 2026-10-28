/** Share the same preference values and storage key as TypeDoc's native theme picker. */
type ThemePreference = "light" | "dark" | "os";

function parsePreference(value: string | null | undefined): ThemePreference {
  return value === "light" || value === "dark" ? value : "os";
}

/** Connect Bootstrap's color mode to the picker, OS changes and other open tabs. */
export function initializeThemePicker(): void {
  const picker = document.querySelector<HTMLButtonElement>("[data-sdk-theme]");
  if (!picker) return;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = parsePreference(document.documentElement.dataset.theme);

  const applyTheme = () => {
    document.documentElement.dataset.theme = preference;
    document.documentElement.dataset.bsTheme =
      preference === "os" ? (systemTheme.matches ? "dark" : "light") : preference;
    const labels = { light: "светлая", dark: "тёмная", os: "системная" };
    const next = preference === "light" ? "dark" : preference === "dark" ? "os" : "light";
    picker.title = `Тема: ${labels[preference]}`;
    picker.setAttribute(
      "aria-label",
      `Тема: ${labels[preference]}. Включить ${next === "os" ? "системную" : next === "light" ? "светлую" : "тёмную"} тему`,
    );
    picker.querySelectorAll<HTMLElement>("[data-theme-icon]").forEach((icon) => {
      icon.classList.toggle("d-none", icon.dataset.themeIcon !== preference);
      icon.classList.toggle("d-inline-flex", icon.dataset.themeIcon === preference);
    });
    const status = document.querySelector("[data-theme-status]");
    if (status) status.textContent = picker.title;
  };

  picker.disabled = false;
  picker.addEventListener("click", () => {
    preference = preference === "light" ? "dark" : preference === "dark" ? "os" : "light";
    applyTheme();
    try {
      localStorage.setItem("tsd-theme", preference);
    } catch {
      // Keep the current selection even if the browser blocks persistent storage.
    }
  });
  systemTheme.addEventListener("change", () => {
    if (preference === "os") applyTheme();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== "tsd-theme" && event.key !== null) return;
    try {
      if (event.storageArea !== localStorage) return;
    } catch {
      return;
    }
    preference = parsePreference(event.newValue);
    applyTheme();
  });
  applyTheme();
}
