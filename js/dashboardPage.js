import { requireAuth } from "./auth.js";
import { getMyListings, updateListingStatus } from "./api.js";
import { qs, escapeHtml, formatMoney } from "./utils.js";

export async function initDashboardPage() {
  const user = await requireAuth();
  if (!user) return;

  const root = qs("#dashboardRoot");
  if (!root) return;

  const listings = await getMyListings(user.id);

  root.innerHTML = `
    <section class="panel card">
      <h1 style="margin:0 0 6px 0;">Seller Dashboard</h1>
      <div class="small">Signed in as <strong>${escapeHtml(user.email ?? "")}</strong></div>
    </section>

    <section class="panel card" style="margin-top:14px;">
      <h2 style="margin:0 0 10px 0;">Your Listings</h2>
      ${
        listings.length
          ? listings.map((r) => `
            <div class="row" style="justify-content:space-between; gap:12px; padding:10px 0; border-top:1px solid rgba(0,0,0,0.08);">
              <div style="flex:1;">
                <div style="font-weight:700;">${escapeHtml(r.card_title ?? r.card_id)}</div>
                <div class="small">Status: ${escapeHtml(r.status ?? "")}</div>
              </div>
              <div style="min-width:90px; text-align:right;">${formatMoney(r.price)}</div>
              ${
                r.status === "active"
                  ? `<button class="btn" type="button" data-close="${escapeHtml(r.id)}">Close</button>`
                  : ""
              }
            </div>
          `).join("")
          : `<p class="small" style="margin:0;">You have no listings yet.</p>`
      }
    </section>
  `;

  root.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      await updateListingStatus(btn.dataset.close, "closed");
      initDashboardPage(); // refresh
    });
  });
}
