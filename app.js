// Mobile menu toggle
function toggleMenu() {
  const nav = document.querySelector(".nav");
  if (nav) nav.classList.toggle("open");
}

// Highlight current page in nav
(function () {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
})();

function norm(str) {
  return (str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toNum(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function toTime(val) {
  const t = new Date(val).getTime();
  return Number.isFinite(t) ? t : 0;
}

/* ---------------------------
   Wishlist (localStorage)
---------------------------- */
const WISHLIST_KEY = "kcard_wishlist_v1";

function getWishlist() {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setWishlist(obj) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(obj));
}

function isSaved(id) {
  const wl = getWishlist();
  return !!wl[id];
}

function toggleSaved(item) {
  const wl = getWishlist();
  if (wl[item.id]) delete wl[item.id];
  else wl[item.id] = item;
  setWishlist(wl);
  return wl;
}

function updateHeartButton(btn, saved) {
  if (!btn) return;
  btn.classList.toggle("saved", saved);
  btn.textContent = saved ? "♥" : "♡";
}

/* ---------------------------
   Browse filtering + sorting
---------------------------- */
function applyBrowseFilters() {
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const typeEl = document.getElementById("typeFilter");
  const sortEl = document.getElementById("sortFilter");
  const noResultsEl = document.getElementById("noResults");
  const resultsCountEl = document.getElementById("resultsCount");
  const listEl = document.getElementById("browseList");

  if (!searchEl || !groupEl || !typeEl || !sortEl || !listEl) return;

  const query = norm(searchEl.value);
  const group = norm(groupEl.value);
  const type = norm(typeEl.value);
  const sort = sortEl.value;

  const items = Array.from(listEl.querySelectorAll(".rowitem[data-id]"));

  const visible = [];
  for (const item of items) {
    const itemGroup = norm(item.dataset.group);
    const itemType = norm(item.dataset.type);
    const itemText = norm(item.dataset.tags || item.textContent);

    const matchesGroup = !group || itemGroup === group || itemGroup.includes(group) || group.includes(itemGroup);
    const matchesType = !type || itemType === type || itemType.includes(type) || type.includes(itemType);

    const qParts = query ? query.split(" ") : [];
    const matchesQuery = !query || qParts.every((p) => itemText.includes(p));

    const show = matchesGroup && matchesType && matchesQuery;
    item.style.display = show ? "" : "none";
    if (show) visible.push(item);
  }

  if (sort) {
    visible.sort((a, b) => {
      if (sort === "price-asc") return toNum(a.dataset.price) - toNum(b.dataset.price);
      if (sort === "price-desc") return toNum(b.dataset.price) - toNum(a.dataset.price);
      if (sort === "newest") return toTime(b.dataset.date) - toTime(a.dataset.date);
      return 0;
    });
    for (const el of visible) listEl.appendChild(el);
  }

  if (noResultsEl) noResultsEl.style.display = visible.length === 0 ? "" : "none";

  if (resultsCountEl) {
    if (!query && !group && !type) resultsCountEl.textContent = "Showing all results";
    else resultsCountEl.textContent = `Showing ${visible.length}`;
  }
}

/* ---------------------------
   Wishlist wiring
---------------------------- */
function initBrowseWishlistButtons() {
  const listEl = document.getElementById("browseList");
  if (!listEl) return;

  listEl.querySelectorAll(".rowitem[data-id]").forEach((row) => {
    const id = row.dataset.id;
    const btn = row.querySelector("[data-save-btn]");
    updateHeartButton(btn, isSaved(id));
  });

  listEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-save-btn]");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const row = btn.closest(".rowitem");
    if (!row) return;

    const item = {
      id: row.dataset.id,
      title: row.dataset.title || row.querySelector(".title")?.textContent?.trim() || "Saved item",
      href: row.dataset.href || row.querySelector("a")?.getAttribute("href") || "item.html",
      group: row.dataset.group || "",
      type: row.dataset.type || "",
      price: row.dataset.price || "",
      date: row.dataset.date || "",
    };

    toggleSaved(item);
    updateHeartButton(btn, isSaved(item.id));
  });
}

function initItemWishlistButton() {
  const meta = document.getElementById("itemMeta");
  const btn = document.getElementById("itemSaveBtn");
  if (!meta || !btn) return;

  const item = {
    id: meta.dataset.id,
    title: meta.dataset.title,
    href: meta.dataset.href || "item.html",
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

  items.sort((a, b) => toTime(b.date) - toTime(a.date));

  for (const it of items) {
    const card = document.createElement("div");
    card.className = "panel rowitem";
    card.setAttribute("data-id", it.id);

    card.innerHTML = `
      <div class="left">
        <div class="thumb"></div>
        <div>
          <div class="title">${it.title || "Saved item"}</div>
          <div class="meta">${[it.group, it.type].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
      <div class="row-right">
        <button class="heart saved" type="button" aria-label="Remove from saved">♥</button>
        <a class="btn primary" href="${it.href || "item.html"}">View</a>
      </div>
    `;

    const heart = card.querySelector(".heart");
    heart.addEventListener("click", () => {
      const wl2 = getWishlist();
      delete wl2[it.id];
      setWishlist(wl2);
      renderSavedPage();
    });

    listEl.appendChild(card);
  }
}

/* ---------------------------
   Cart (localStorage) + Drawer UI
---------------------------- */
const CART_KEY = "kcard_cart_v1";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
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

function money(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
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
      <button class="btn primary" type="button" id="fakeCheckoutBtn">Checkout (demo)</button>
      <div class="small">Demo cart only — no payment yet.</div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  // Floating cart button
  const fab = document.createElement("button");
  fab.id = "cartFab";
  fab.className = "cart-fab";
  fab.type = "button";
  fab.innerHTML = `<span style="font-size:18px;">🛒</span> <span class="small">Cart</span> <span class="cart-dot" id="cartCountDot">0</span>`;
  fab.addEventListener("click", openCart);
  document.body.appendChild(fab);

  // Drawer controls
  drawer.querySelector("#cartCloseBtn").addEventListener("click", closeCart);
  drawer.querySelector("#cartClearBtn").addEventListener("click", () => {
    setCart({ items: [] });
    renderCart();
    updateCartCountUI();
  });

  drawer.querySelector("#fakeCheckoutBtn").addEventListener("click", () => {
    alert("Demo checkout — next step is Stripe + Supabase!");
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
  setTimeout(() => {
    overlay.style.display = "none";
  }, 220);
}

function updateCartCountUI() {
  ensureCartUI();
  const dot = document.getElementById("cartCountDot");
  const cart = getCart();
  const c = cartCount(cart);
  if (dot) dot.textContent = String(c);
  const badge = document.getElementById("cartBadge");
  if (badge) badge.textContent = `${c} item${c === 1 ? "" : "s"}`;
}

function addToCart(line) {
  const cart = getCart();
  cart.items = cart.items || [];

  // key by listing id (seller + card id + price/shipping)
  const key = line.key;
  const existing = cart.items.find((x) => x.key === key);

  if (existing) existing.qty += 1;
  else cart.items.push({ ...line, qty: 1 });

  setCart(cart);
  updateCartCountUI();
  openCart();
}

function changeQty(key, delta) {
  const cart = getCart();
  cart.items = (cart.items || []).map((it) => {
    if (it.key !== key) return it;
    return { ...it, qty: Math.max(0, (it.qty || 0) + delta) };
  }).filter((it) => (it.qty || 0) > 0);

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

function cartSubtotal(cart = getCart()) {
  return (cart.items || []).reduce((sum, it) => {
    const price = Number(it.price) || 0;
    const ship = Number(it.shipping) || 0;
    return sum + (price + ship) * (it.qty || 0);
  }, 0);
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
        <div class="ci-title">${it.title}</div>
        <div class="ci-meta">${it.seller ? `Seller: ${it.seller}` : ""}${it.seller ? " · " : ""}Item $${money(it.price)} · Ship $${money(it.shipping)}</div>
        <div class="qty">
          <button type="button" aria-label="Decrease">−</button>
          <span>${it.qty}</span>
          <button type="button" aria-label="Increase">+</button>
          <button type="button" class="btn" style="margin-left:auto;">Remove</button>
        </div>
      </div>
    `;

    const [decBtn, incBtn, removeBtn] = row.querySelectorAll(".qty button");
    decBtn.addEventListener("click", () => changeQty(it.key, -1));
    incBtn.addEventListener("click", () => changeQty(it.key, +1));
    removeBtn.addEventListener("click", () => removeLine(it.key));

    body.appendChild(row);
  }

  subtotalEl.textContent = `$${money(cartSubtotal(cart))}`;
}

/* ---------------------------
   Hook "Add to cart" buttons
---------------------------- */
function initAddToCartButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-cart]");
    if (!btn) return;

    e.preventDefault();

    const title = btn.dataset.itemTitle || "Listing";
    const seller = btn.dataset.itemSeller || "";
    const price = btn.dataset.itemPrice || "0";
    const shipping = btn.dataset.itemShipping || "0";
    const cardId = btn.dataset.cardId || "card";
    const sellerKey = seller ? norm(seller).replace(/\s+/g, "-") : "seller";
    const key = `${cardId}__${sellerKey}__${price}__${shipping}`;

    addToCart({
      key,
      cardId,
      title,
      seller,
      price,
      shipping
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Always ensure cart UI exists + count is correct
  ensureCartUI();
  updateCartCountUI();

  // Browse: filters + sorting
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const typeEl = document.getElementById("typeFilter");
  const sortEl = document.getElementById("sortFilter");
  const clearBtn = document.getElementById("clearFiltersBtn");

  if (searchEl && groupEl && typeEl && sortEl) {
    searchEl.addEventListener("input", applyBrowseFilters);
    groupEl.addEventListener("change", applyBrowseFilters);
    typeEl.addEventListener("change", applyBrowseFilters);
    sortEl.addEventListener("change", applyBrowseFilters);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchEl.value = "";
        groupEl.value = "";
        typeEl.value = "";
        sortEl.value = "";
        applyBrowseFilters();
      });
    }

    applyBrowseFilters();
  }

  // Wishlist
  initBrowseWishlistButtons();
  initItemWishlistButton();
  renderSavedPage();

  // Cart
  initAddToCartButtons();
});
