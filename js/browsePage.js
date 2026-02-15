import { getActiveListings } from "./api.js";
import { qs, escapeHtml, formatMoney, debounce } from "./utils.js";
import { isWishlisted, toggleWishlist } from "./wishlist.js";

function shippingBest(r) {
  const stamped = Number(r.shipping_stamped);
  const tracked = Number(r.shipping_tracked);

  const a = Number.isFinite(stamped) && stamped > 0 ? stamped : Infinity;
  const b = Number.isFinite(tracked) && tracked > 0 ? tracked : Infinity;

  const best = Math.min(a, b);
  return Number.isFinite(best) ? best : 0;
}

function listingTotal(r) {
  return (Number(r.price) || 0) + shippingBest(r);
}

function groupByCard(listings) {
  const map = new Map();
  for (const r of listings) {
    const key = r.card_id;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return map;
}

function summarizeCard(cardId, rows) {
  const sorted = [...rows].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const rep = sorted[0];

  const cheapest = rows.reduce((min, r) => Math.min(min, listingTotal(r)), Infinity);

  return {
    cardId,
    group: rep.group_name ?? "",
    title: rep.card_title ?? "",
    member: rep.member ?? "",
    img: rep.image_url ?? "",
    from: Number.isFinite(cheapest) ? cheapest : 0,
    newestAt: rep.created_at ?? null,
    count: rows.length
  };
}

function applyFilters(cards, { q, group, member }) {
  const qq = (q || "").trim().toLowerCase();
  const gg = (group || "").trim().toLowerCase();
  const mm = (member || "").trim().toLowerCase();

  return cards.filter((c) => {
    const hay = `${c.cardId} ${c.group} ${c.title} ${c.member}`.toLowerCase();
    if (qq && !hay.includes(qq)) return false;
    if (gg && !String(c.group).toLowerCase().includes(gg)) return false;
    if (mm && !String(c.member).toLowerCase().includes(mm)) return false;
    return true;
  });
}

function applySort(cards, sort) {
  const s = sort || "";
  const arr = [...cards];

  if (s === "price-asc") arr.sort((a, b) => a.from - b.from);
  else if (s === "price-desc") arr.sort((a, b) => b.from - a.from);
  else if (s === "newest") arr.sort((a, b) => new Date(b.newestAt) - new Date(a.newestAt));

  return arr;
}

function render(cards) {
  const list = qs("#browseList");
  const count = qs("#resultsCount");
  const noResults = qs("#noResults");

  if (!list) return;

  if (count) count.textContent = `Showing ${cards.length}`;
  if (noResults) noResults.style.display = cards.length ? "none" : "block";

  list.innerHTML = cards
    .map((c) => {
      const saved = isWishlisted(c.cardId);
      return `
        <article class="panel card">
          <div class="row" style="gap:12px; align-items:center;">
            <a href="./item.html?id=${encodeURIComponent(c.cardId)}"
               style="display:flex; gap:12px; align-items:center; flex:1; text-decoration:none;">
              ${c.img ? `<img src="${escapeHtml(c.img)}" alt=""
                          style="width:64px; height:64px; object-fit:cover; border-radius:10px;">` : ""}
              <div style="flex:1;">
                <div style="font-weight:700;">
                  ${escapeHtml(c.group)}${c.title ? ` — ${escapeHtml(c.title)}` : ""}
                </div>
                ${c.member ? `<div class="small">${escapeHtml(c.member)}</div>` : ""}
                <div class="small">From ${formatMoney(c.from)} • ${c.count} listing${c.count === 1 ? "" : "s"}</div>
              </div>
            </a>

            <button class="btn" type="button" data-save="${escapeHtml(c.cardId)}">
              ${saved ? "★ Saved" : "☆ Save"}
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-save]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.save;
      toggleWishlist(id);
      btn.textContent = isWishlisted(id) ? "★ Saved" : "☆ Save";
    });
  });
}

export async function initBrowsePage() {
  const searchInput = qs("#searchInput");
  const groupFilter = qs("#groupFilter");
  const memberFilter = qs("#memberFilter");
  const sortFilter = qs("#sortFilter");
  const clearBtn = qs("#clearFiltersBtn");

  const listings = await getActiveListings();
  const groups = groupByCard(listings);
  const allCards = Array.from(groups.entries()).map(([cardId, rows]) => summarizeCard(cardId, rows));

  const run = () => {
    const filtered = applyFilters(allCards, {
      q: searchInput?.value,
      group: groupFilter?.value,
      member: memberFilter?.value,
    });
    const sorted = applySort(filtered, sortFilter?.value);
    render(sorted);
  };

  run();

  const debouncedRun = debounce(run, 120);
  searchInput?.addEventListener("input", debouncedRun);
  groupFilter?.addEventListener("input", debouncedRun);
  memberFilter?.addEventListener("input", debouncedRun);
  sortFilter?.addEventListener("change", run);

  clearBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (groupFilter) groupFilter.value = "";
    if (memberFilter) memberFilter.value = "";
    if (sortFilter) sortFilter.value = "";
    run();
  });
}
