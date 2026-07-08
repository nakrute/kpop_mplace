import { initHeader } from "./header.js";
import { initApp } from "./app.js";

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  document.querySelectorAll("[data-current-year]")
    .forEach((element) => { element.textContent = String(new Date().getFullYear()); });
  initApp();
});
