import { getWishlistIds } from "./wishlist.js";
import { qs, escapeHtml } from "./utils.js";

export function initSavedPage() {
  const root = qs("#savedRoot");
  if (!root) return;

  const ids = getWishlistIds();

  root.innerHTML = `
    <section class="panel card">
      <h1 style="margin:0 0 10px 0;">Saved</h1>
      ${
        ids.length
          ? `<div class="list">
              ${ids.map((id) => `
                <a class="panel card" href="./item.html?id=${encodeURIComponent(id)}"
                   style="display:block; text-decoration:none;">
                  <div style="font-weight:700;">${escapeHtml(id)}</div>
                  <div class="small">View listings</div>
                </a>
              `).join("")}
            </div>`
          : `<p class="small" style="margin:0;">No saved items yet.</p>`
      }
    </section>
  `;
}
