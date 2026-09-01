import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

function createThemeHarness() {
  const listeners = new Map();
  const storage = new Map();
  const button = {
    textContent: "",
    attributes: {},
    closest(selector) {
      return selector === "[data-theme-toggle]" ? this : null;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
  const document = {
    documentElement: { dataset: {} },
    readyState: "complete",
    addEventListener(type, handler) {
      listeners.set(type, handler);
    },
    querySelectorAll(selector) {
      return selector === "[data-theme-toggle]" ? [button] : [];
    }
  };
  const context = {
    document,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); }
    },
    matchMedia() {
      return { matches: false };
    }
  };
  context.window = context;

  vm.createContext(context);
  vm.runInContext(
    fs.readFileSync(path.resolve("js/theme.js"), "utf8"),
    context,
    { filename: "js/theme.js" }
  );

  return { button, document, listeners, storage };
}

test("theme toggle switches the page theme and persists the choice", () => {
  const { button, document, listeners, storage } = createThemeHarness();

  assert.equal(document.documentElement.dataset.theme, "light");
  assert.equal(button.textContent, "Dark mode");
  assert.equal(button.attributes["aria-pressed"], "false");

  listeners.get("click")({ target: button });

  assert.equal(document.documentElement.dataset.theme, "dark");
  assert.equal(storage.get("kcard_theme"), "dark");
  assert.equal(button.textContent, "Light mode");
  assert.equal(button.attributes["aria-pressed"], "true");
});
