(function () {
  const storageKey = "kcard_theme";
  const root = document.documentElement;

  function preferredTheme() {
    let saved = "";
    try { saved = localStorage.getItem(storageKey); } catch { /* Storage can be unavailable in private contexts. */ }
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme, persist = false) {
    root.dataset.theme = theme;
    if (persist) {
      try { localStorage.setItem(storageKey, theme); } catch { /* Keep the in-page theme when storage is unavailable. */ }
    }
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const nextTheme = theme === "dark" ? "light" : "dark";
      button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      button.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
      button.setAttribute("aria-pressed", String(theme === "dark"));
    });
  }

  applyTheme(preferredTheme());

  window.KCardTheme = {
    initToggle() {
      applyTheme(root.dataset.theme || preferredTheme());
      document.addEventListener("click", (event) => {
        if (!event.target.closest("[data-theme-toggle]")) return;
        applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
      });
    }
  };
})();
