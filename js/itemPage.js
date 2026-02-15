import { getCardById, getListingsForCard } from "./api.js";
import { addToCart } from "./cart.js";
import { qs, getParam, escapeHtml, formatMoney } from "./utils.js";
import { isWishlisted, toggleWishlist } from "./wishlist.js";

function shipLine(r) {
  const stamped = Number(r.shipping_stamped) || 0;
  const tracked = Number(r.shipping_tracked) || 0;
  return `Stamped ${formatMoney(stamped)} • Tracked ${formatMoney(tracked)}`;
}

export async function initItemPage() {
  const cardId = getParam("id");
  const root = qs("#itemRoot");
  if (!root) return;

  if (!cardId) {
    root.innerHTML = `<section class="panel card"><p>Missing item id.</p></section>`;
    return;
  }

  const [card, listings] = await Promise.all([
    getCardById(cardId),
    getListingsForCard(cardId),
  ]);

  const display = {
    group: card?.group_name ?? listings[0]?.group_name ?? "Unknown Group",
    title: card?.title ?? listings[0]?.card_title ?? cardId,
    member: card?.member ?? listings[0]?.member ?? "",
    img: card?.image_url ?? listings[0]?.image_url ?? "",
  };

  const saved = isWishlisted(cardId);

  root.innerHTML = `
    <section class="panel card">
      <div class="row" style="gap:14px; align-items:flex-start;">
        <div style="flex:1;">
          <h1 style="margin:0 0 6px 0;">${escapeHtml(display.group)}</h1>
          <div style="font-weight:700; margin-bottom:6px;">${escapeHtml(display.title)}</div>
          ${display.member ? `<div class="small">${escapeHtml(display.member)}</div>` : ""}

          <div style="margin-top:12px;">
            <button id="itemSaveBtn" class="btn" type="button">${saved ? "★ Saved" : "☆ Save"}</button>
          </div>
        </div>

        ${display.img ? `
          <img src="${escapeHtml(display.img)}" alt=""
               style="width:140px; height:140px; object-fit:cover; border-radius:12px;">
        ` : ""}
      </div>
    </section>

    <section class="panel card" style="margin-top:14px;">
      <h2 style="margin:0 0 10px 0;">Active Listings</h2>
      <div id="listingRows">
        ${
          listings.length
            ? listings.map((r) => `
              <div class="row" style="justify-content:space-between; gap:12px; padding:10px 0; border-top:1px solid rgba(0,0,0,0.08);">
                <div style="flex:1;">
                  <div style="font-weight:700;">${escapeHtml(r.condition ?? "")}</div>
                  <div class="small">${escapeHtml(shipLine(r))}</div>
                </div>
                <div style="min-width:90px; text-align:right;">${formatMoney(r.price)}</div>
                <button class="btn addCartBtn" type="button" data-id="${escapeHtml(r.id)}">Add</button>
              </div>
            `).join("")
            : `<p class="small" style="margin:0;">No active listings for this card yet.</p>`
        }
      </div>
    </section>
  `;

  const saveBtn = qs("#itemSaveBtn");
  saveBtn?.addEventListener("click", () => {
    toggleWishlist(cardId);
    saveBtn.textContent = isWishlisted(cardId) ? "★ Saved" : "☆ Save";
  });

  root.querySelectorAll(".addCartBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const listing = listings.find((x) => String(x.id) === String(id));
      if (!listing) return;
      addToCart(listing, 1);
      btn.textContent = "Added!";
      setTimeout(() => (btn.textContent = "Add"), 800);
    });
  });
}
