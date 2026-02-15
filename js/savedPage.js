import { getWishlistIds } from "./wishlist.js";
import { qs, escapeHtml } from "./utils.js";

export function initSavedPage() {
  const root = qs("#savedRoot");
  if (!root) return;

  const ids = getWishlistIds();

  root.innerHTML = `
    <h1>Saved</h1>
    ${
      ids.length
        ? `<div class="saved-grid">
            ${ids
              .map(
                (id) => `
              <a class="saved-tile" href="./item.html?id=${encodeURIComponent(id)}">
                ${escapeHtml(id)}
              </a>
            `
              )
              .join("")}
          </div>`
        : `<p>No saved items yet.</p>`
    }
  `;
}
