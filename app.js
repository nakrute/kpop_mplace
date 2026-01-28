// app.js (FULL) — Version B (structured pages)
// Supabase + local wishlist/cart, for GitHub Pages
// Pages should load with: <script type="module" src="app.js"></script>

import { supabase } from "./supabaseClient.js";

/* =========================
   Helpers
========================= */
function norm(str) {
  return (str || "").toLowerCase().replace(/\s+/g, " ").trim();
}
function toNum(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}
function toTime(val) {
  const t = new Date(val || "").getTime();
  return Number.isFinite(t) ? t : 0;
}
function money(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
}
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function getQueryParam(name) {
  const u = new URL(location.href);
  return u.searchParams.get(name);
}

/* =========================
   Wishlist (localStorage)
========================= */
const WISHLIST_KEY = "kcard_wishlist_v1";

function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || {};
  } catch {
    return {};
  }
}
function setWishlist(obj) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(obj));
}
function isSaved(id) {
  return !!getWishlist()[id];
}
function toggleSaved(item) {
  const wl = getWishlist();
  if (wl[item.id]) delete wl[item.id];
  else wl[item.id] = item;
  setWishlist(wl);
}
function updateHeartButton(btn, saved) {
  if (!btn) return;
  btn.classList.toggle("saved", saved);
  btn.textContent = saved ? "♥" : "♡";
}

function initRowSaveButtons() {
  document.querySelectorAll("[data-save-btn]").forEach((btn) => {
    const row = btn.closest(".rowitem");
    if (!row) return;
    const id = row.dataset.id;
    const title = row.dataset.title || row.querySelector(".title")?.textContent || "Saved item";
    const href = row.querySelector("a.left")?.getAttribute("href") || row.dataset.href || "browse.html";
    const img = row.dataset.img || "";

    updateHeartButton(btn, isSaved(id));

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSaved({ id, title, href, img, group: row.dataset.group || "", type: row.dataset.type || "" });
      updateHeartButton(btn, isSaved(id));
      // If we're sorting saved-first or filtering saved-only, reapply
      if (document.getElementById("sortFilter") || document.getElementById("savedOnly")) {
        applyBrowseFilters();
      }
    });
  });
}

function initItemWishlistButtonFromHeader(card) {
  const btn = document.getElementById("itemSaveBtn");
  if (!btn || !card?.id) return;

  const item = {
    id: card.id,
    title: card.title || card.id,
    href: `item.html?id=${encodeURIComponent(card.id)}`,
    img: card.image_url || ""
  };

  updateHeartButton(btn, isSaved(item.id));

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    toggleSaved(item);
    updateHeartButton(btn, isSaved(item.id));
  });
}

function renderSavedPage() {
  const listEl = document.getElementById("savedList");
  const emptyEl = document.getElementById("savedEmpty");
  if (!listEl || !emptyEl) return;

  const wl = getWishlist();
  const items = Object.values(wl);

  listEl.innerHTML = "";

  if (items.length === 0) {
    emptyEl.style.display = "";
    return;
  }
  emptyEl.style.display = "none";

  for (const it of items) {
    const row = document.createElement("div");
    row.className = "panel rowitem";
    row.innerHTML = `
      <a class="left" href="${escapeHtml(it.href || "browse.html")}">
        ${it.img ? `<img class="thumbimg" src="${escapeHtml(it.img)}" alt="thumb" />` : `<div class="thumb"></div>`}
        <div>
          <div class="title">${escapeHtml(it.title || "Saved item")}</div>
          <div class="meta">${escapeHtml([it.group, it.type].filter(Boolean).join(" · "))}</div>
        </div>
      </a>
      <div class="row-right">
        <button class="heart saved" type="button" aria-label="Remove from saved">♥</button>
        <a class="btn primary" href="${escapeHtml(it.href || "browse.html")}">View</a>
      </div>
    `;

    row.querySelector(".heart").addEventListener("click", (e) => {
      e.preventDefault();
      const wl2 = getWishlist();
      delete wl2[it.id];
      setWishlist(wl2);
      renderSavedPage();
    });

    listEl.appendChild(row);
  }
}

/* =========================
   Cart (localStorage) + Drawer
========================= */
const CART_KEY = "kcard_cart_v3";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [] };
  } catch {
    return { items: [] };
  }
}
function setCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function cartCount(cart = getCart()) {
  return (cart.items || []).reduce((sum, it) => sum + (it.qty || 0), 0);
}
function cartSubtotal(cart = getCart()) {
  return (cart.items || []).reduce((sum, it) => {
    const price = Number(it.price) || 0;
    const ship = Number(it.shippingCost) || 0;
    return sum + (price + ship) * (it.qty || 0);
  }, 0);
}

function ensureCartUI() {
  if (document.getElementById("cartOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "cartOverlay";
  overlay.className = "cart-overlay";
  overlay.addEventListener("click", closeCart);

  const drawer = document.createElement("div");
  drawer.id = "cartDrawer";
  drawer.className = "cart-drawer";
  drawer.innerHTML = `
    <div class="cart-header">
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="font-weight:900;">Your cart</div>
        <span class="badge" id="cartBadge">0 items</span>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="btn" type="button" id="cartClearBtn">Clear</button>
        <button class="btn" type="button" id="cartCloseBtn">Close</button>
      </div>
    </div>
    <div class="cart-body" id="cartBody"></div>
    <div class="cart-footer">
      <div class="cart-row">
        <div class="small">Subtotal</div>
        <div style="font-weight:900;" id="cartSubtotal">$0.00</div>
      </div>
      <a class="btn primary" href="checkout.html">Checkout (demo)</a>
      <div class="small">Demo cart only — payments later.</div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  const fab = document.createElement("button");
  fab.id = "cartFab";
  fab.className = "cart-fab";
  fab.type = "button";
  fab.innerHTML = `<span style="font-size:18px;">🛒</span> <span class="small">Cart</span> <span class="cart-dot" id="cartCountDot">0</span>`;
  fab.addEventListener("click", openCart);
  document.body.appendChild(fab);

  drawer.querySelector("#cartCloseBtn").addEventListener("click", closeCart);
  drawer.querySelector("#cartClearBtn").addEventListener("click", () => {
    setCart({ items: [] });
    renderCart();
    updateCartCountUI();
  });
}

function openCart() {
  ensureCartUI();
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  overlay.style.display = "block";
  requestAnimationFrame(() => drawer.classList.add("open"));
  renderCart();
}
function closeCart() {
  const overlay = document.getElementById("cartOverlay");
  const drawer = document.getElementById("cartDrawer");
  if (!overlay || !drawer) return;
  drawer.classList.remove("open");
  setTimeout(() => (overlay.style.display = "none"), 220);
}
function updateCartCountUI() {
  ensureCartUI();
  const cart = getCart();
  const c = cartCount(cart);
  const dot = document.getElementById("cartCountDot");
  const badge = document.getElementById("cartBadge");
  if (dot) dot.textContent = String(c);
  if (badge) badge.textContent = `${c} item${c === 1 ? "" : "s"}`;
}

function addToCart(line) {
  const cart = getCart();
  cart.items = cart.items || [];

  const existing = cart.items.find((x) => x.key === line.key);
  if (existing) existing.qty += 1;
  else cart.items.push({ ...line, qty: 1 });

  setCart(cart);
  updateCartCountUI();
  openCart();
}

function changeQty(key, delta) {
  const cart = getCart();
  cart.items = (cart.items || [])
    .map((it) => (it.key !== key ? it : { ...it, qty: Math.max(0, (it.qty || 0) + delta) }))
    .filter((it) => (it.qty || 0) > 0);

  setCart(cart);
  renderCart();
  updateCartCountUI();
}

function removeLine(key) {
  const cart = getCart();
  cart.items = (cart.items || []).filter((it) => it.key !== key);
  setCart(cart);
  renderCart();
  updateCartCountUI();
}

function updateShipping(key, nextLabel) {
  const cart = getCart();
  cart.items = (cart.items || []).map((it) => {
    if (it.key !== key) return it;
    const opt = (it.shippingOptions || []).find((o) => o.label === nextLabel);
    if (!opt) return it;
    return { ...it, shippingLabel: opt.label, shippingCost: Number(opt.cost) || 0 };
  });
  setCart(cart);
  renderCart();
  updateCartCountUI();
}

function renderCart() {
  ensureCartUI();
  const body = document.getElementById("cartBody");
  const subtotalEl = document.getElementById("cartSubtotal");
  const cart = getCart();
  const items = cart.items || [];

  if (!body || !subtotalEl) return;

  body.innerHTML = "";

  if (items.length === 0) {
    body.innerHTML = `<div class="cart-empty">Your cart is empty. Add a listing to see it here.</div>`;
    subtotalEl.textContent = `$0.00`;
    return;
  }

  for (const it of items) {
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <div class="thumb"></div>
      <div class="ci-main">
        <div class="ci-title">${escapeHtml(it.title)}</div>
        <div class="ci-meta">
          ${it.seller ? `Seller: ${escapeHtml(it.seller)}` : ""}
          ${it.seller ? " · " : ""}
          Item $${money(it.price)}
          · Ship <span style="font-weight:800;">${escapeHtml(it.shippingLabel || "Shipping")}</span> ($${money(it.shippingCost)})
        </div>

        <div class="qty">
          <button type="button" aria-label="Decrease">−</button>
          <span>${it.qty}</span>
          <button type="button" aria-label="Increase">+</button>

          ${
            it.shippingOptions && it.shippingOptions.length
              ? `<select class="input" style="max-width:220px; margin-left:auto;" data-ship-select>
                   ${it.shippingOptions
                     .map((o) => `<option value="${escapeHtml(o.label)}">${escapeHtml(o.label)} ($${money(o.cost)})</option>`)
                     .join("")}
                 </select>`
              : `<span style="margin-left:auto;"></span>`
          }

          <button type="button" class="btn" style="margin-left:auto;" data-remove>Remove</button>
        </div>
      </div>
    `;

    const [decBtn, incBtn] = row.querySelectorAll(".qty button");
    decBtn.addEventListener("click", () => changeQty(it.key, -1));
    incBtn.addEventListener("click", () => changeQty(it.key, +1));

    row.querySelector("[data-remove]").addEventListener("click", () => removeLine(it.key));

    const shipSelect = row.querySelector("[data-ship-select]");
    if (shipSelect) {
      shipSelect.value = it.shippingLabel || shipSelect.value;
      shipSelect.addEventListener("change", () => updateShipping(it.key, shipSelect.value));
    }

    body.appendChild(row);
  }

  subtotalEl.textContent = `$${money(cartSubtotal(cart))}`;
}

/* =========================
   Auth CTA (Version B uses #authCta)
========================= */
async function renderAuthButton() {
  const slot = document.getElementById("authBtnSlot");
  if (!slot) return;

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (session?.user) {
    slot.innerHTML = `<button class="btn" type="button" data-action="logout">Logout</button>`;
  } else {
    slot.innerHTML = `<a class="btn" href="login.html">Login</a>`;
  }
}


async function initAccountFromSupabase() {
  const needs = document.getElementById("acctNeedsAuth");
  const authed = document.getElementById("acctAuthed");
  const form = document.getElementById("accountForm");
  const msg = document.getElementById("accountMsg");
  const emailEl = document.getElementById("acctEmail");
  if (!needs || !authed || !form) return;

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    needs.style.display = "";
    authed.style.display = "none";
    return;
  }

  needs.style.display = "none";
  authed.style.display = "";
  if (emailEl) emailEl.textContent = `Signed in as ${user.email}`;

  // Load profile row (should exist due to trigger; but we’ll be safe with upsert)
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    // If missing row, create it
    await supabase.from("profiles").upsert({ id: user.id });
  }

  const p = profile || {};

  document.getElementById("ac_display_name").value = p.display_name || "";
  document.getElementById("ac_location").value = p.location || "";
  document.getElementById("ac_is_seller").checked = !!p.is_seller;
  document.getElementById("ac_bio").value = p.bio || "";
  document.getElementById("ac_ship_stamped").value = (p.default_shipping_stamped ?? 0);
  document.getElementById("ac_ship_tracked").value = (p.default_shipping_tracked ?? 0);
  document.getElementById("ac_packaging").value = p.packaging_notes || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "Saving…";

    const payload = {
      id: user.id,
      display_name: document.getElementById("ac_display_name").value.trim(),
      location: document.getElementById("ac_location").value.trim(),
      is_seller: document.getElementById("ac_is_seller").checked,
      bio: document.getElementById("ac_bio").value.trim(),
      default_shipping_stamped: Number(document.getElementById("ac_ship_stamped").value) || 0,
      default_shipping_tracked: Number(document.getElementById("ac_ship_tracked").value) || 0,
      packaging_notes: document.getElementById("ac_packaging").value.trim()
    };

    const { error } = await supabase.from("profiles").upsert(payload);
    if (error) {
      if (msg) msg.textContent = error.message;
      return;
    }
    if (msg) msg.textContent = "Saved!";
  });
}


/* =========================
   Browse: filters + auto-member dropdown
========================= */
const GROUP_MEMBERS = {
  "seventeen": ["Mingyu","S.Coups","Jeonghan","Joshua","Jun","Hoshi","Wonwoo","Woozi","DK","The8","Seungkwan","Vernon","Dino"],
  "stray kids": ["Bang Chan","Lee Know","Changbin","Hyunjin","Han","Felix","Seungmin","I.N"],
  "twice": ["Nayeon","Jeongyeon","Momo","Sana","Jihyo","Mina","Dahyun","Chaeyoung","Tzuyu"]
};

function updateMemberDropdown() {
  const groupEl = document.getElementById("groupFilter");
  const memberEl = document.getElementById("memberFilter");
  if (!groupEl || !memberEl) return;

  const selectedGroup = norm(groupEl.value);
  const current = memberEl.value;

  memberEl.innerHTML = `<option value="">Any member</option>`;

  if (!selectedGroup || !GROUP_MEMBERS[selectedGroup]) {
    const all = new Set();
    Object.values(GROUP_MEMBERS).forEach((arr) => arr.forEach((m) => all.add(m)));
    [...all].sort().forEach((name) => {
      const opt = document.createElement("option");
      opt.value = norm(name);
      opt.textContent = name;
      memberEl.appendChild(opt);
    });
  } else {
    GROUP_MEMBERS[selectedGroup].forEach((name) => {
      const opt = document.createElement("option");
      opt.value = norm(name);
      opt.textContent = name;
      memberEl.appendChild(opt);
    });
  }

  memberEl.value = current;
}

function applyBrowseFilters() {
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const eraEl = document.getElementById("eraFilter");
  const memberEl = document.getElementById("memberFilter");
  const typeEl = document.getElementById("typeFilter");
  const sortEl = document.getElementById("sortFilter");
  const savedOnlyEl = document.getElementById("savedOnly");
  const noResultsEl = document.getElementById("noResults");
  const resultsCountEl = document.getElementById("resultsCount");
  const listEl = document.getElementById("browseList");
  const chipsEl = document.getElementById("activeChips");

  if (!searchEl || !groupEl || !typeEl || !sortEl || !listEl) return;

  const query = norm(searchEl.value);
  const group = norm(groupEl.value);
  const era = norm(eraEl ? eraEl.value : "");
  const member = norm(memberEl ? memberEl.value : "");
  const type = norm(typeEl.value);
  const sort = sortEl.value;
  const savedOnly = !!(savedOnlyEl && savedOnlyEl.checked);

  const items = Array.from(listEl.querySelectorAll(".rowitem[data-id]"));

  const visible = [];
  for (const item of items) {
    const itemGroup = norm(item.dataset.group);
    const itemEra = norm(item.dataset.era);
    const itemMember = norm(item.dataset.member);
    const itemType = norm(item.dataset.type);
    const itemText = norm(item.dataset.tags || item.textContent);
    const id = item.dataset.id;

    const matchesGroup = !group || itemGroup.includes(group);
    const matchesEra = !era || itemEra.includes(era);
    const matchesMember = !member || itemMember.includes(member);
    const matchesType = !type || itemType.includes(type);

    const qParts = query ? query.split(" ") : [];
    const matchesQuery = !query || qParts.every((p) => itemText.includes(p));

    const matchesSaved = !savedOnly || isSaved(id);

    const show = matchesGroup && matchesEra && matchesMember && matchesType && matchesQuery && matchesSaved;
    item.style.display = show ? "" : "none";
    if (show) visible.push(item);
  }

  if (sort) {
    visible.sort((a, b) => {
      if (sort === "price-asc") return toNum(a.dataset.price) - toNum(b.dataset.price);
      if (sort === "price-desc") return toNum(b.dataset.price) - toNum(a.dataset.price);
      if (sort === "newest") return toTime(b.dataset.date) - toTime(a.dataset.date);
      if (sort === "saved-first") return (isSaved(b.dataset.id) ? 1 : 0) - (isSaved(a.dataset.id) ? 1 : 0);
      return 0;
    });
    for (const el of visible) listEl.appendChild(el);
  }

  if (noResultsEl) noResultsEl.style.display = visible.length === 0 ? "" : "none";

  if (resultsCountEl) {
    if (!query && !group && !era && !member && !type && !savedOnly) resultsCountEl.textContent = "Showing all results";
    else resultsCountEl.textContent = `Showing ${visible.length}`;
  }

  if (chipsEl) {
    const chips = [];
    if (group) chips.push(`Group: ${groupEl.options[groupEl.selectedIndex].text}`);
    if (eraEl && era) chips.push(`Era: ${eraEl.options[eraEl.selectedIndex].text}`);
    if (memberEl && member) chips.push(`Member: ${memberEl.options[memberEl.selectedIndex].text}`);
    if (type) chips.push(`Type: ${typeEl.options[typeEl.selectedIndex].text}`);
    if (query) chips.push(`Search: "${searchEl.value.trim()}"`);
    if (savedOnly) chips.push("Saved only");
    chipsEl.innerHTML = chips.map((c) => `<span class="chip">${escapeHtml(c)}</span>`).join("");
  }
}

function initBrowseFilters() {
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const eraEl = document.getElementById("eraFilter");
  const memberEl = document.getElementById("memberFilter");
  const typeEl = document.getElementById("typeFilter");
  const sortEl = document.getElementById("sortFilter");
  const clearBtn = document.getElementById("clearFiltersBtn");
  const savedOnlyEl = document.getElementById("savedOnly");

  if (!(searchEl && groupEl && typeEl && sortEl)) return;

  if (memberEl) {
    updateMemberDropdown();
    groupEl.addEventListener("change", () => {
      updateMemberDropdown();
      applyBrowseFilters();
    });
    memberEl.addEventListener("change", applyBrowseFilters);
  } else {
    groupEl.addEventListener("change", applyBrowseFilters);
  }

  searchEl.addEventListener("input", applyBrowseFilters);
  if (eraEl) eraEl.addEventListener("change", applyBrowseFilters);
  typeEl.addEventListener("change", applyBrowseFilters);
  sortEl.addEventListener("change", applyBrowseFilters);
  if (savedOnlyEl) savedOnlyEl.addEventListener("change", applyBrowseFilters);

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchEl.value = "";
      groupEl.value = "";
      if (eraEl) eraEl.value = "";
      if (memberEl) memberEl.value = "";
      typeEl.value = "";
      sortEl.value = "";
      if (savedOnlyEl) savedOnlyEl.checked = false;
      if (memberEl) updateMemberDropdown();
      applyBrowseFilters();
    });
  }

  applyBrowseFilters();
}

/* =========================
   Supabase: Item page (Version B placeholders)
========================= */
function sellerLabelFromUuid(uuid) {
  if (!uuid) return "Seller";
  const s = String(uuid);
  return `Seller ${s.slice(0, 6)}`;
}

async function initItemFromSupabase() {
  const headerLoading = document.getElementById("itemHeaderLoading");
  const headerWrap = document.getElementById("itemHeader");
  const listingsLoading = document.getElementById("listingsLoading");
  const listingsTable = document.getElementById("listingsTable");
  const listingsBody = document.getElementById("listingsBody");
  const listingsEmpty = document.getElementById("listingsEmpty");

  // If not on item.html, bail
  if (!headerLoading || !headerWrap || !listingsLoading || !listingsTable || !listingsBody || !listingsEmpty) return;

  const cardId = getQueryParam("id");
  if (!cardId) {
    headerLoading.textContent = "Missing card id. Go back to Browse and click an item.";
    listingsLoading.style.display = "none";
    return;
  }

  const { data: card, error: cardErr } = await supabase
    .from("cards")
    .select("*")
    .eq("id", cardId)
    .single();

  if (cardErr || !card) {
    headerLoading.textContent = "Card not found in catalog.";
    listingsLoading.style.display = "none";
    return;
  }

  // Render header
  const titleEl = document.getElementById("itemTitle");
  const badgeEl = document.getElementById("itemBadge");
  const metaEl = document.getElementById("itemMetaLine");
  const imgEl = document.getElementById("itemImage");
  const attrsEl = document.getElementById("itemAttrs");
  const statsEl = document.getElementById("itemStats");

  if (titleEl) titleEl.textContent = card.title || card.id;
  if (badgeEl) badgeEl.textContent = card.is_verified ? "Verified catalog entry" : "Catalog";
  if (metaEl) {
    metaEl.textContent =
      `${card.group_name || "—"}${card.era ? " · " + card.era : ""}${card.member ? " · " + card.member : ""}${card.card_type ? " · " + card.card_type : ""}`;
  }
  if (imgEl) imgEl.src = card.image_url || "https://placehold.co/256x256/png?text=Card";
  if (attrsEl) {
    attrsEl.innerHTML = `
      Group: ${escapeHtml(card.group_name || "—")}<br/>
      Release: ${escapeHtml(card.era || "—")}<br/>
      Member: ${escapeHtml(card.member || "—")}<br/>
      Type: ${escapeHtml(card.card_type || "—")}
    `;
  }

  headerLoading.style.display = "none";
  headerWrap.style.display = "";

  initItemWishlistButtonFromHeader(card);

  // Listings
  const { data: rows, error: listErr } = await supabase
    .from("listings")
    .select("*")
    .eq("card_id", cardId)
    .eq("status", "active")
    .order("price", { ascending: true });

  listingsLoading.style.display = "none";

  if (listErr) {
    listingsEmpty.style.display = "";
    listingsEmpty.textContent = "Could not load listings.";
    return;
  }

  if (!rows || rows.length === 0) {
    listingsEmpty.style.display = "";
    return;
  }

  // Stats
  const totals = rows
    .map((r) => {
      const p = Number(r.price) || 0;
      const stamped = Number(r.shipping_stamped) || 0;
      const tracked = Number(r.shipping_tracked) || 0;
      const bestShip = Math.min(stamped || Infinity, tracked || Infinity);
      const ship = Number.isFinite(bestShip) ? bestShip : 0;
      return p + ship;
    })
    .sort((a, b) => a - b);

  const min = totals[0];
  const max = totals[totals.length - 1];
  const mid =
    totals.length % 2
      ? totals[(totals.length - 1) / 2]
      : (totals[totals.length / 2 - 1] + totals[totals.length / 2]) / 2;

  if (statsEl) statsEl.textContent = `From $${money(min)} · Median $${money(mid)} · High $${money(max)} (${rows.length} listings)`;

  // Table
  listingsBody.innerHTML = "";

  for (const r of rows) {
    const seller = sellerLabelFromUuid(r.seller_id);

    const options = [];
    if (Number(r.shipping_stamped) >= 0) options.push({ label: "Stamped", cost: Number(r.shipping_stamped) || 0 });
    if (Number(r.shipping_tracked) >= 0) options.push({ label: "Tracked", cost: Number(r.shipping_tracked) || 0 });

    const defaultOpt = options.find((o) => o.label === "Stamped") || options[0] || { label: "Shipping", cost: 0 };
    const keyBase = `${card.id}__${r.id}`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(seller)}</td>
      <td>${escapeHtml(r.condition)}</td>
      <td>$${money(r.price)}</td>
      <td>${options.map((o) => `${escapeHtml(o.label)} $${money(o.cost)}`).join(" / ")}</td>
      <td style="display:flex; gap:8px; flex-wrap:wrap;">
        ${options
          .map(
            (o) => `
            <button
              class="${o.label === defaultOpt.label ? "btn primary" : "btn"}"
              type="button"
              data-add-cart
              data-card-id="${escapeHtml(card.id)}"
              data-item-title="${escapeHtml(card.title || card.id)}"
              data-item-seller="${escapeHtml(seller)}"
              data-item-price="${escapeHtml(String(r.price))}"
              data-shipping-options='${escapeHtml(JSON.stringify(options))}'
              data-shipping-label="${escapeHtml(o.label)}"
              data-shipping-cost="${escapeHtml(String(o.cost))}"
              data-line-key="${escapeHtml(keyBase + "__" + o.label)}"
            >
              Add (${escapeHtml(o.label)})
            </button>
          `
          )
          .join("")}
      </td>
    `;
    listingsBody.appendChild(tr);
  }

  listingsTable.style.display = "";
}

/* =========================
   Add-to-cart wiring (works on Item listings buttons)
========================= */
function initAddToCartButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-cart]");
    if (!btn) return;

    e.preventDefault();

    const title = btn.dataset.itemTitle || "Listing";
    const seller = btn.dataset.itemSeller || "";
    const price = Number(btn.dataset.itemPrice) || 0;

    let options = [];
    try {
      options = JSON.parse(btn.dataset.shippingOptions || "[]");
    } catch {
      options = [];
    }

    const shippingLabel = btn.dataset.shippingLabel || options[0]?.label || "Shipping";
    const shippingCost = Number(btn.dataset.shippingCost || options[0]?.cost || 0) || 0;

    const key =
      btn.dataset.lineKey ||
      `${btn.dataset.cardId || "card"}__${norm(seller)}__${price}__${shippingLabel}__${shippingCost}`;

    addToCart({
      key,
      cardId: btn.dataset.cardId || "",
      title,
      seller,
      price,
      shippingLabel,
      shippingCost,
      shippingOptions: options
    });
  });
}

/* =========================
   Supabase: Dashboard (seller listings)
========================= */
async function initDashboardFromSupabase() {
  const needs = document.getElementById("dashNeedsAuth");
  const authed = document.getElementById("dashAuthed");
  const form = document.getElementById("listingForm");
  const msg = document.getElementById("listingMsg");
  const listWrap = document.getElementById("myListings");

  if (!needs || !authed || !form || !listWrap) return;

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    needs.style.display = "";
    authed.style.display = "none";
    return;
  }

  needs.style.display = "none";
  authed.style.display = "";

  async function loadMyListings() {
    listWrap.innerHTML = `<div class="small">Loading your listings…</div>`;

    const { data: rows, error } = await supabase
      .from("listings")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      listWrap.innerHTML = `<div class="cart-empty">Could not load listings. (You likely need a “select own listings” RLS policy.)</div>`;
      return;
    }

    if (!rows || rows.length === 0) {
      listWrap.innerHTML = `<div class="cart-empty">No listings yet. Create one on the left.</div>`;
      return;
    }

    listWrap.innerHTML = "";
    for (const r of rows) {
      const row = document.createElement("div");
      row.className = "panel rowitem";
      row.innerHTML = `
        <div class="left">
          <div class="thumb"></div>
          <div>
            <div class="title">${escapeHtml(r.card_id)} <span class="small">(${escapeHtml(r.condition)})</span></div>
            <div class="meta">$${money(r.price)} · Stamped $${money(r.shipping_stamped)} · Tracked $${money(r.shipping_tracked)} · <b>${escapeHtml(r.status)}</b></div>
          </div>
        </div>
        <div class="row-right">
          <button class="btn" type="button" data-toggle>${r.status === "active" ? "pause" : "activate"}</button>
          <button class="btn" type="button" data-del>delete</button>
        </div>
      `;

      row.querySelector("[data-toggle]").addEventListener("click", async () => {
        const next = r.status === "active" ? "paused" : "active";
        const { error } = await supabase.from("listings").update({ status: next }).eq("id", r.id).eq("seller_id", user.id);
        if (error) alert(error.message);
        await loadMyListings();
      });

      row.querySelector("[data-del]").addEventListener("click", async () => {
        if (!confirm("Delete this listing?")) return;
        const { error } = await supabase.from("listings").delete().eq("id", r.id).eq("seller_id", user.id);
        if (error) alert(error.message);
        await loadMyListings();
      });

      listWrap.appendChild(row);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "Saving…";

    const card_id = document.getElementById("ls_card_id").value.trim();
    const condition = document.getElementById("ls_condition").value;
    const price = Number(document.getElementById("ls_price").value) || 0;
    const shipping_stamped = Number(document.getElementById("ls_ship_stamped").value) || 0;
    const shipping_tracked = Number(document.getElementById("ls_ship_tracked").value) || 0;

    const { error } = await supabase.from("listings").insert({
      card_id,
      seller_id: user.id,
      condition,
      price,
      shipping_stamped,
      shipping_tracked,
      status: "active"
    });

    if (error) {
      if (msg) msg.textContent = error.message;
      return;
    }

    if (msg) msg.textContent = "Listing published!";
    form.reset();
    await loadMyListings();
  });

  await loadMyListings();
}

/* =========================
   Supabase: Requests page (Version B expects rq_era)
========================= */
async function initRequestsFromSupabase() {
  const needs = document.getElementById("reqNeedsAuth");
  const authed = document.getElementById("reqAuthed");
  const form = document.getElementById("requestForm");
  const msg = document.getElementById("requestMsg");

  if (!needs || !authed || !form) return;

  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;

  if (!user) {
    needs.style.display = "";
    authed.style.display = "none";
    return;
  }

  needs.style.display = "none";
  authed.style.display = "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "Submitting…";

    const payload = {
      user_id: user.id,
      group_name: document.getElementById("rq_group").value.trim(),
      era: (document.getElementById("rq_era")?.value || "").trim(),
      member: (document.getElementById("rq_member")?.value || "").trim(),
      card_type: (document.getElementById("rq_type")?.value || "").trim(),
      store: (document.getElementById("rq_store")?.value || "").trim(),
      round: (document.getElementById("rq_round")?.value || "").trim(),
      notes: (document.getElementById("rq_notes")?.value || "").trim()
    };

    const { error } = await supabase.from("requests").insert(payload);
    if (error) {
      if (msg) msg.textContent = error.message;
      return;
    }

    if (msg) msg.textContent = "Request submitted!";
    form.reset();
  });
}

/* =========================
   Boot
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  // Cart
  ensureCartUI();
  updateCartCountUI();
  initAddToCartButtons();

  // Auth CTA
  await renderAuthButton();
  supabase.auth.onAuthStateChange(async () => {
    await renderAuthButton();
    await initDashboardFromSupabase();
    await initRequestsFromSupabase();
    await initAccountFromSupabase();
  });

  // Local pages
  renderSavedPage();
  initBrowseFilters();
  initRowSaveButtons();

  // Supabase pages
  await initItemFromSupabase();
  await initDashboardFromSupabase();
  await initRequestsFromSupabase();
  await initAccountFromSupabase();

});

async function doLogout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert("Logout failed: " + error.message);
      return;
    }
  } catch (e) {
    alert("Logout failed: " + (e?.message || e));
    return;
  }

  // Make it obvious it worked
  location.href = "browse.html";
}

document.addEventListener("click", async (e) => {
  const el = e.target.closest('[data-action="logout"]');
  if (!el) return;
  e.preventDefault();
  await doLogout();
});
