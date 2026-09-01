(function () {
  const storageKey = "kcard_theme";
  const root = document.documentElement;
  let initialized = false;

  function storedTheme() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === "light" || saved === "dark" ? saved : "";
    } catch {
      return "";
    }
  }

  function preferredTheme() {
    return storedTheme() || (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  function applyTheme(theme, persist = false) {
    const nextTheme = theme === "dark" ? "dark" : "light";
    root.dataset.theme = nextTheme;
    if (persist) {
      try { localStorage.setItem(storageKey, nextTheme); } catch { /* Keep the in-page theme when storage is unavailable. */ }
    }
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const nextLabel = nextTheme === "dark" ? "light" : "dark";
      button.textContent = nextTheme === "dark" ? "Light mode" : "Dark mode";
      button.setAttribute("aria-label", `Switch to ${nextLabel} mode`);
      button.setAttribute("aria-pressed", String(nextTheme === "dark"));
    });
  }

  function toggleTheme(event) {
    if (!event.target?.closest?.("[data-theme-toggle]")) return;
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
  }

  function initToggle() {
    applyTheme(root.dataset.theme || preferredTheme());
    if (initialized) return;
    initialized = true;
    document.addEventListener("click", toggleTheme);
  }

  applyTheme(preferredTheme());

  window.KCardTheme = {
    applyTheme,
    initToggle
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initToggle, { once: true });
  } else {
    initToggle();
  }
})();
