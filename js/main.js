// js/main.js — single entrypoint for all pages
import { initHeader } from "./header.js";
import "./app.js"; // runs boot (DOMContentLoaded) and all page logic

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
});
