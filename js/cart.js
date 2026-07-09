import { getCart, getListings, saveCart } from "./store.js";
import { escapeHtml, money, qs, qsa } from "./utils.js";

function listingName(listing) {
  return [listing.group, listing.member, listing.title].filter(Boolean).join(" - ");
}

function updateCount() {
  const indicator = qs("#cartCountDot");
  if (indicator) indicator.textContent = String(getCart().reduce((sum, line) => sum + line.qty, 0));
}

function closeCart() {
  qs("#cartDrawer")?.classList.remove("open");
  window.setTimeout(() => {
    const overlay = qs("#cartOverlay");
    if (overlay) overlay.hidden = true;
  }, 180);
}

function changeQuantity(id, delta) {
  const cart = getCart()
    .map((line) => line.id === id ? { ...line, qty: Math.max(0, line.qty + delta) } : line)
    .filter((line) => line.qty > 0);
  saveCart(cart);
  renderCart();
  updateCount();
}

function removeLine(id) {
  saveCart(getCart().filter((line) => line.id !== id));
  renderCart();
  updateCount();
}

function renderCart() {
  const body = qs("#cartBody");
  if (!body) return;

  const listings = getListings({ includeInactive: true });
  const cart = getCart();
  let subtotal = 0;

  body.innerHTML = cart.length
    ? cart.map((line) => {
        const listing = listings.find((item) => item.id === line.id);
        if (!listing) return "";
        const lineTotal = (Number(listing.price) || 0) * line.qty;
        subtotal += lineTotal;

        return `
          <div class="cart-item">
            ${listing.imageUrl
              ? `<img class="thumbimg" src="${escapeHtml(listing.imageUrl)}" alt="${escapeHtml(listing.title)}" data-fallback-image>`
              : `<div class="thumb" aria-hidden="true"></div>`}
            <div class="ci-main">
              <div class="ci-title">${escapeHtml(listingName(listing))}</div>
              <div class="ci-meta">${money(listing.price)} &middot; Qty ${line.qty}</div>
              <div class="qty">
                <button type="button" data-cart-dec="${escapeHtml(line.id)}" aria-label="Decrease quantity">-</button>
                <button type="button" data-cart-inc="${escapeHtml(line.id)}" aria-label="Increase quantity">+</button>
                <button class="btn" type="button" data-cart-remove="${escapeHtml(line.id)}">Remove</button>
              </div>
            </div>
          </div>
        `;
      }).join("")
    : `<div class="cart-empty">Your cart is empty.</div>`;

  qs("#cartSubtotal").textContent = money(subtotal);
  qsa("[data-cart-inc]", body).forEach((button) => button.addEventListener("click", () => changeQuantity(button.dataset.cartInc, 1)));
  qsa("[data-cart-dec]", body).forEach((button) => button.addEventListener("click", () => changeQuantity(button.dataset.cartDec, -1)));
  qsa("[data-cart-remove]", body).forEach((button) => button.addEventListener("click", () => removeLine(button.dataset.cartRemove)));
}

function openCart() {
  renderCart();
  qs("#cartOverlay").hidden = false;
  requestAnimationFrame(() => qs("#cartDrawer").classList.add("open"));
}

function ensureCartUi() {
  if (qs("#cartFab")) return;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="cart-overlay" id="cartOverlay" hidden></div>
    <aside class="cart-drawer" id="cartDrawer" aria-label="Buy request list">
      <div class="cart-header">
        <strong>Request list</strong>
        <button class="btn" type="button" data-close-cart>Close</button>
      </div>
      <div class="cart-body" id="cartBody"></div>
      <div class="cart-footer">
        <div class="cart-row"><span class="small">Subtotal</span><strong id="cartSubtotal">$0.00</strong></div>
        <a class="btn primary" href="checkout.html">Send buy request</a>
      </div>
    </aside>
    <button class="cart-fab" type="button" id="cartFab">Requests <span class="cart-dot" id="cartCountDot">0</span></button>
  `);

  qs("#cartFab").addEventListener("click", openCart);
  qs("#cartOverlay").addEventListener("click", closeCart);
  qs("[data-close-cart]").addEventListener("click", closeCart);
}

export function addToCart(id) {
  const listing = getListings().find((item) => item.id === id);
  if (!listing) return;

  const cart = getCart();
  const existing = cart.find((line) => line.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, qty: 1 });

  saveCart(cart);
  updateCount();
  openCart();
}

export function initCart() {
  ensureCartUi();
  updateCount();
}
