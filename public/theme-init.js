// Run before styles and modules to avoid flashing the wrong color mode.
(() => {
  let preference = "os";
  try {
    const stored = localStorage.getItem("tsd-theme");
    if (stored === "light" || stored === "dark") preference = stored;
  } catch {
    // Theme selection remains usable when persistent storage is unavailable.
  }
  document.documentElement.dataset.theme = preference;
  document.documentElement.dataset.bsTheme =
    preference === "os"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : preference;
})();
