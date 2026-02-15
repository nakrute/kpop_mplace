// js/main.js — single entrypoint for all pages
// NOTE: app.js and header.js live in the repo root.
import { initHeader } from "./header.js";
import "./app.js"; // boots page logic

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
});
