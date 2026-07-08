import { getCart, getListings, saveCart } from "./store.js";
import { escapeHtml, money, qs, qsa } from "./utils.js";

function shippingCost(listing, method) {
  return method === "Tracked" ? listing.shippingTracked : listing.shippingStamped;
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

function updateShipping(id, shipping) {
  saveCart(getCart().map((line) => line.id === id ? { ...line, shipping } : line));
  renderCart();
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

        const shipping = shippingCost(listing, line.shipping);
        subtotal += (listing.price + shipping) * line.qty;

        return `
          <div class="cart-item">
            <div class="thumb"></div>
            <div class="ci-main">
              <div class="ci-title">${escapeHtml(listing.group)} - ${escapeHtml(listing.title)}</div>
              <div class="ci-meta">${money(listing.price)} &middot; ${escapeHtml(line.shipping)} ${money(shipping)} &middot; Qty ${line.qty}</div>
              <div class="qty">
                <button type="button" data-cart-dec="${escapeHtml(line.id)}" aria-label="Decrease quantity">-</button>
                <button type="button" data-cart-inc="${escapeHtml(line.id)}" aria-label="Increase quantity">+</button>
                <select class="input" data-cart-ship="${escapeHtml(line.id)}" aria-label="Shipping method">
                  <option ${line.shipping === "Stamped" ? "selected" : ""}>Stamped</option>
                  <option ${line.shipping === "Tracked" ? "selected" : ""}>Tracked</option>
                </select>
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
  qsa("[data-cart-ship]", body).forEach((select) => select.addEventListener("change", () => updateShipping(select.dataset.cartShip, select.value)));
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
    <aside class="cart-drawer" id="cartDrawer" aria-label="Shopping cart">
      <div class="cart-header">
        <strong>Your cart</strong>
        <button class="btn" type="button" data-close-cart>Close</button>
      </div>
      <div class="cart-body" id="cartBody"></div>
      <div class="cart-footer">
        <div class="cart-row"><span class="small">Subtotal</span><strong id="cartSubtotal">$0.00</strong></div>
        <a class="btn primary" href="checkout.html">Checkout demo</a>
      </div>
    </aside>
    <button class="cart-fab" type="button" id="cartFab">Cart <span class="cart-dot" id="cartCountDot">0</span></button>
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
  else cart.push({ id, qty: 1, shipping: "Stamped" });

  saveCart(cart);
  updateCount();
  openCart();
}

export function initCart() {
  ensureCartUi();
  updateCount();
}
