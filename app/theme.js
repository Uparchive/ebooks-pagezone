(() => {
  "use strict";
  const KEY = "pagezone-theme";
  const LEGACY_KEY = "readerTheme";
  const values = new Set(["light", "dark", "system"]);
  const media = matchMedia("(prefers-color-scheme: dark)");

  function storedChoice() {
    try {
      const value = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
      return values.has(value) ? value : "system";
    } catch { return document.documentElement.dataset.themeChoice || "system"; }
  }

  function resolve(choice) {
    return choice === "system" ? (media.matches ? "dark" : "light") : choice;
  }

  function apply(choice, persist = false) {
    const selected = values.has(choice) ? choice : "system";
    const effective = resolve(selected);
    document.documentElement.dataset.themeChoice = selected;
    document.documentElement.dataset.theme = effective;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = effective === "dark" ? "#11151d" : "#f4f1ea";
    document.querySelectorAll("[data-theme-value]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.themeValue === selected));
    });
    if (persist) {
      try {
        localStorage.setItem(KEY, selected);
        localStorage.removeItem(LEGACY_KEY);
      } catch (_) {}
    }
  }

  function init() {
    const choice = storedChoice();
    apply(choice);
    try {
      if (!localStorage.getItem(KEY) && localStorage.getItem(LEGACY_KEY)) {
        localStorage.setItem(KEY, choice);
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch (_) {}
    document.addEventListener("click", event => {
      const button = event.target.closest("[data-theme-value]");
      if (button) apply(button.dataset.themeValue, true);
    });
    media.addEventListener?.("change", () => {
      if (document.documentElement.dataset.themeChoice === "system") apply("system");
    });
    window.addEventListener("storage", event => {
      if (event.key === KEY) apply(values.has(event.newValue) ? event.newValue : "system");
    });
  }

  window.PageZoneTheme = { apply, get choice() { return document.documentElement.dataset.themeChoice; } };
  init();
})();
