/***********************
  Helpers
************************/
function toggleMenu() {
  const nav = document.querySelector(".nav");
  if (nav) nav.classList.toggle("open");
}

// Highlight active page in nav
(function () {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
})();

function norm(str) {
  return (str || "").toLowerCase().replace(/\s+/g, " ").trim();
}
function toNum(val) {
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}
function toTime(val) {
  const t = new Date(val).getTime();
  return Number.isFinite(t) ? t : 0;
}
function money(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
}
function safeJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

/***********************
  Wishlist (localStorage)
************************/
const WISHLIST_KEY = "kcard_wishlist_v1";

function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || {}; }
  catch { return {}; }
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

/***********************
  Cart (localStorage) + Drawer UI
************************/
const CART_KEY = "kcard_cart_v2";

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [] }; }
  catch { return { items: [] }; }
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
      <a class="btn primary" href="checkout.html" id="cartCheckoutLink">Checkout (demo)</a>
      <div class="small">Demo cart only — no payment yet.</div>
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
  setTimeout(() => { overlay.style.display = "none"; }, 220);
}

function updateCartCountUI() {
  ensureCartUI();
  const cart = getCart();
  const c = cartCount(cart);
  const dot = document.getElementById("cartCountDot");
  if (dot) dot.textContent = String(c);
  const badge = document.getElementById("cartBadge");
  if (badge) badge.textContent = `${c} item${c === 1 ? "" : "s"}`;
}

function addToCart(line) {
  const cart = getCart();
  cart.items = cart.items || [];

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
  cart.items = (cart.items || [])
    .map((it) => it.key !== key ? it : ({ ...it, qty: Math.max(0, (it.qty || 0) + delta) }))
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
    const opt = (it.shippingOptions || []).find(o => o.label === nextLabel);
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
        <div class="ci-title">${it.title}</div>
        <div class="ci-meta">
          ${it.seller ? `Seller: ${it.seller}` : ""}
          ${it.seller ? " · " : ""}
          Item $${money(it.price)}
          · Ship <span style="font-weight:800;">${it.shippingLabel || "Shipping"}</span> ($${money(it.shippingCost)})
        </div>

        <div class="qty">
          <button type="button" aria-label="Decrease">−</button>
          <span>${it.qty}</span>
          <button type="button" aria-label="Increase">+</button>

          ${
            (it.shippingOptions && it.shippingOptions.length > 0)
              ? `<select class="input" style="max-width:220px; margin-left:auto;" data-ship-select>
                   ${(it.shippingOptions || []).map(o => `<option value="${o.label}">${o.label} ($${money(o.cost)})</option>`).join("")}
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

    const removeBtn = row.querySelector("[data-remove]");
    removeBtn.addEventListener("click", () => removeLine(it.key));

    const shipSelect = row.querySelector("[data-ship-select]");
    if (shipSelect) {
      shipSelect.value = it.shippingLabel || shipSelect.value;
      shipSelect.addEventListener("change", () => updateShipping(it.key, shipSelect.value));
    }

    body.appendChild(row);
  }

  subtotalEl.textContent = `$${money(cartSubtotal(cart))}`;
}

/***********************
  Browse: filtering + sorting
************************/
function applyBrowseFilters() {
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
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
  const type = norm(typeEl.value);
  const sort = sortEl.value;
  const savedOnly = !!(savedOnlyEl && savedOnlyEl.checked);

  const items = Array.from(listEl.querySelectorAll(".rowitem[data-id]"));

  const visible = [];
  for (const item of items) {
    const itemGroup = norm(item.dataset.group);
    const itemType = norm(item.dataset.type);
    const itemText = norm(item.dataset.tags || item.textContent);
    const id = item.dataset.id;

    const matchesGroup = !group || itemGroup.includes(group);
    const matchesType = !type || itemType.includes(type);

    const qParts = query ? query.split(" ") : [];
    const matchesQuery = !query || qParts.every((p) => itemText.includes(p));

    const matchesSaved = !savedOnly || isSaved(id);

    const show = matchesGroup && matchesType && matchesQuery && matchesSaved;
    item.style.display = show ? "" : "none";
    if (show) visible.push(item);
  }

  // Sorting
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
    if (!query && !group && !type && !savedOnly) resultsCountEl.textContent = "Showing all results";
    else resultsCountEl.textContent = `Showing ${visible.length}`;
  }

  // Chips (nice UX)
  if (chipsEl) {
    const chips = [];
    if (group) chips.push(`Group: ${groupEl.options[groupEl.selectedIndex].text}`);
    if (type) chips.push(`Type: ${typeEl.options[typeEl.selectedIndex].text}`);
    if (query) chips.push(`Search: "${searchEl.value.trim()}"`);
    if (savedOnly) chips.push("Saved only");

    chipsEl.innerHTML = chips.map(c => `<span class="chip">${c}</span>`).join("");
  }
}

/***********************
  Wishlist wiring
************************/
function initBrowseWishlistButtons() {
  const listEl = document.getElementById("browseList");
  if (!listEl) return;

  // initial hearts + thumbs
  listEl.querySelectorAll(".rowitem[data-id]").forEach((row) => {
    const id = row.dataset.id;
    updateHeartButton(row.querySelector("[data-save-btn]"), isSaved(id));

    const img = row.querySelector("img.thumbimg");
    if (img && row.dataset.img) img.src = row.dataset.img;
  });

  // event delegation
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
      img: row.dataset.img || ""
    };

    toggleSaved(item);
    updateHeartButton(btn, isSaved(item.id));

    // if "saved only" is on, reapply filters so items disappear/appear correctly
    const savedOnlyEl = document.getElementById("savedOnly");
    if (savedOnlyEl && savedOnlyEl.checked) applyBrowseFilters();
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
    img: meta.dataset.img || ""
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
        ${it.img ? `<img class="thumbimg" src="${it.img}" alt="thumb" />` : `<div class="thumb"></div>`}
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

/***********************
  Add-to-cart wiring
************************/
function initAddToCartButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-cart]");
    if (!btn) return;

    e.preventDefault();

    const title = btn.dataset.itemTitle || "Listing";
    const seller = btn.dataset.itemSeller || "";
    const price = Number(btn.dataset.itemPrice) || 0;

    const cardId = btn.dataset.cardId || "card";
    const sellerKey = seller ? norm(seller).replace(/\s+/g, "-") : "seller";

    const options = safeJSON(btn.dataset.shippingOptions || "[]", []);
    const defaultLabel = btn.dataset.shippingLabel || (options[0]?.label) || "Shipping";
    const defaultCost = Number(btn.dataset.shippingCost || options[0]?.cost || 0) || 0;

    const key = `${cardId}__${sellerKey}__${price}__${defaultLabel}__${defaultCost}`;

    addToCart({
      key,
      cardId,
      title,
      seller,
      price,
      shippingLabel: defaultLabel,
      shippingCost: defaultCost,
      shippingOptions: options
    });
  });
}

/***********************
  Demo Checkout + Orders
************************/
const CHECKOUT_INFO_KEY = "kcard_checkout_info_v1";
const ORDERS_KEY = "kcard_orders_v1";

function getOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
  catch { return []; }
}
function setOrders(arr) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(arr));
}

function initCheckoutPage() {
  const form = document.getElementById("checkoutForm");
  const summary = document.getElementById("checkoutSummary");
  if (!form || !summary) return;

  const cart = getCart();
  const items = cart.items || [];

  if (items.length === 0) {
    summary.innerHTML = `<div class="cart-empty">Your cart is empty. Go add a listing first.</div>`;
    return;
  }

  const savedInfo = safeJSON(localStorage.getItem(CHECKOUT_INFO_KEY) || "{}", {});
  ["name","email","address1","address2","city","state","zip","country"].forEach(k=>{
    const el = document.getElementById(k);
    if (el && savedInfo[k]) el.value = savedInfo[k];
  });

  summary.innerHTML = `
    <div class="card">
      <h3 style="margin:0 0 8px 0;">Order summary</h3>
      ${items.map(it => `
        <div class="cart-row" style="margin:8px 0;">
          <div class="small" style="max-width:280px;">
            ${it.title}<br/>
            <span class="small">Seller: ${it.seller} · ${it.shippingLabel}</span>
          </div>
          <div style="font-weight:900;">$${money((Number(it.price)+Number(it.shippingCost))*(it.qty||1))}</div>
        </div>
      `).join("")}
      <div class="cart-row" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
        <div class="small">Subtotal</div>
        <div style="font-weight:900;">$${money(cartSubtotal(cart))}</div>
      </div>
      <div class="small">Demo only — no payment.</div>
    </div>
  `;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const info = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      address1: document.getElementById("address1").value.trim(),
      address2: document.getElementById("address2").value.trim(),
      city: document.getElementById("city").value.trim(),
      state: document.getElementById("state").value.trim(),
      zip: document.getElementById("zip").value.trim(),
      country: document.getElementById("country").value.trim(),
    };

    localStorage.setItem(CHECKOUT_INFO_KEY, JSON.stringify(info));

    const orderId = "KC-" + Math.random().toString(16).slice(2, 8).toUpperCase();
    const order = {
      id: orderId,
      createdAt: new Date().toISOString(),
      info,
      items,
      subtotal: cartSubtotal(cart),
      status: "Placed (demo)"
    };

    const orders = getOrders();
    orders.unshift(order);
    setOrders(orders);

    setCart({ items: [] });
    updateCartCountUI();

    localStorage.setItem("kcard_last_order_id", orderId);
    location.href = "order-success.html";
  });
}

function initOrderSuccessPage() {
  const el = document.getElementById("orderSuccess");
  if (!el) return;

  const last = localStorage.getItem("kcard_last_order_id");
  if (!last) {
    el.innerHTML = `<div class="cart-empty">No recent order found.</div>`;
    return;
  }
  const orders = getOrders();
  const order = orders.find(o => o.id === last);
  if (!order) {
    el.innerHTML = `<div class="cart-empty">Order not found.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="badge">Demo order placed</div>
    <h2 style="margin:10px 0 8px 0;">Order ${order.id}</h2>
    <p class="small" style="margin:0 0 12px 0;">Status: ${order.status}</p>
    <div class="card">
      <h3 style="margin:0 0 8px 0;">Items</h3>
      ${order.items.map(it => `
        <div class="cart-row" style="margin:8px 0;">
          <div class="small">${it.title}<br/><span class="small">Seller: ${it.seller} · ${it.shippingLabel}</span></div>
          <div style="font-weight:900;">$${money((Number(it.price)+Number(it.shippingCost))*(it.qty||1))}</div>
        </div>
      `).join("")}
      <div class="cart-row" style="margin-top:10px; padding-top:10px; border-top:1px solid var(--border);">
        <div class="small">Subtotal</div>
        <div style="font-weight:900;">$${money(order.subtotal)}</div>
      </div>
    </div>
    <div style="margin-top:12px; display:flex; gap:10px; flex-wrap:wrap;">
      <a class="btn" href="browse.html">Continue browsing</a>
      <a class="btn primary" href="dashboard.html">Go to dashboard</a>
    </div>
  `;
}

/***********************
  Catalog request form
************************/
const REQUESTS_KEY = "kcard_requests_v1";

function initRequestPage() {
  const form = document.getElementById("requestForm");
  const msg = document.getElementById("requestMsg");
  if (!form || !msg) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const payload = {
      createdAt: new Date().toISOString(),
      group: document.getElementById("rq_group").value.trim(),
      album: document.getElementById("rq_album").value.trim(),
      member: document.getElementById("rq_member").value.trim(),
      type: document.getElementById("rq_type").value.trim(),
      store: document.getElementById("rq_store").value.trim(),
      round: document.getElementById("rq_round").value.trim(),
      notes: document.getElementById("rq_notes").value.trim(),
    };

    const arr = safeJSON(localStorage.getItem(REQUESTS_KEY) || "[]", []);
    arr.unshift(payload);
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(arr));

    form.reset();
    msg.textContent = "Request submitted (stored locally for now).";
  });
}

/***********************
  Demo Seller listings CRUD
************************/
const LISTINGS_KEY = "kcard_my_listings_v1";

function getMyListings() {
  return safeJSON(localStorage.getItem(LISTINGS_KEY) || "[]", []);
}
function setMyListings(arr) {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(arr));
}

function renderDashboard() {
  const wrap = document.getElementById("myListings");
  const ordersWrap = document.getElementById("myOrders");
  const form = document.getElementById("listingForm");
  if (!wrap || !form) return;

  function drawListings() {
    const listings = getMyListings();
    wrap.innerHTML = "";

    if (listings.length === 0) {
      wrap.innerHTML = `<div class="cart-empty">No listings yet. Create one above.</div>`;
      return;
    }

    for (const l of listings) {
      const row = document.createElement("div");
      row.className = "panel rowitem";
      row.innerHTML = `
        <div class="left">
          <div class="thumb"></div>
          <div>
            <div class="title">${l.title}</div>
            <div class="meta">${l.condition} · $${money(l.price)} · ${l.status}</div>
          </div>
        </div>
        <div class="row-right">
          <button class="btn" type="button" data-edit>edit</button>
          <button class="btn" type="button" data-toggle>${l.status === "Active" ? "pause" : "activate"}</button>
          <button class="btn" type="button" data-del>delete</button>
        </div>
      `;

      row.querySelector("[data-edit]").addEventListener("click", () => {
        const nextPrice = prompt("New price (USD):", String(l.price));
        if (nextPrice === null) return;
        const nextCond = prompt("Condition:", l.condition);
        if (nextCond === null) return;

        const listings = getMyListings().map(x => x.id === l.id ? ({...x, price: Number(nextPrice)||x.price, condition: nextCond}) : x);
        setMyListings(listings);
        drawListings();
      });

      row.querySelector("[data-toggle]").addEventListener("click", () => {
        const listings = getMyListings().map(x => x.id === l.id ? ({...x, status: x.status === "Active" ? "Paused" : "Active"}) : x);
        setMyListings(listings);
        drawListings();
      });

      row.querySelector("[data-del]").addEventListener("click", () => {
        if (!confirm("Delete this listing?")) return;
        const listings = getMyListings().filter(x => x.id !== l.id);
        setMyListings(listings);
        drawListings();
      });

      wrap.appendChild(row);
    }
  }

  function drawOrders() {
    if (!ordersWrap) return;
    const orders = getOrders();
    if (orders.length === 0) {
      ordersWrap.innerHTML = `<div class="cart-empty">No demo orders yet. Place one via checkout.</div>`;
      return;
    }
    ordersWrap.innerHTML = `
      <table class="table">
        <thead><tr><th>Order</th><th>Status</th><th>Total</th><th>Date</th></tr></thead>
        <tbody>
          ${orders.slice(0,10).map(o => `
            <tr>
              <td>${o.id}</td>
              <td>${o.status}</td>
              <td>$${money(o.subtotal)}</td>
              <td>${new Date(o.createdAt).toLocaleString()}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = document.getElementById("ls_title").value.trim();
    const price = Number(document.getElementById("ls_price").value) || 0;
    const condition = document.getElementById("ls_condition").value;
    const status = "Active";

    const listings = getMyListings();
    listings.unshift({
      id: "L-" + Math.random().toString(16).slice(2, 8),
      title,
      price,
      condition,
      status,
      createdAt: new Date().toISOString()
    });
    setMyListings(listings);
    form.reset();
    drawListings();
  });

  drawListings();
  drawOrders();
}

/***********************
  Boot
************************/
document.addEventListener("DOMContentLoaded", () => {
  // Cart always available
  ensureCartUI();
  updateCartCountUI();
  initAddToCartButtons();

  // Browse page
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const typeEl = document.getElementById("typeFilter");
  const sortEl = document.getElementById("sortFilter");
  const clearBtn = document.getElementById("clearFiltersBtn");
  const savedOnlyEl = document.getElementById("savedOnly");

  if (searchEl && groupEl && typeEl && sortEl) {
    searchEl.addEventListener("input", applyBrowseFilters);
    groupEl.addEventListener("change", applyBrowseFilters);
    typeEl.addEventListener("change", applyBrowseFilters);
    sortEl.addEventListener("change", applyBrowseFilters);
    if (savedOnlyEl) savedOnlyEl.addEventListener("change", applyBrowseFilters);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchEl.value = "";
        groupEl.value = "";
        typeEl.value = "";
        sortEl.value = "";
        if (savedOnlyEl) savedOnlyEl.checked = false;
        applyBrowseFilters();
      });
    }
    applyBrowseFilters();
  }

  // Wishlist pages
  initBrowseWishlistButtons();
  initItemWishlistButton();
  renderSavedPage();

  // Request, checkout, success, dashboard
  initRequestPage();
  initCheckoutPage();
  initOrderSuccessPage();
  renderDashboard();
});
