/***********************
  Global helpers
************************/
function toggleMenu() {
  const nav = document.querySelector(".nav");
  if (nav) nav.classList.toggle("open");
}

// Highlight active nav
(function () {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
})();

function norm(str){
  return (str || "").toLowerCase().replace(/\s+/g," ").trim();
}
function toNum(val){
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}
function toTime(val){
  const t = new Date(val).getTime();
  return Number.isFinite(t) ? t : 0;
}

/***********************
  WISHLIST
************************/
const WISHLIST_KEY = "kcard_wishlist_v1";

function getWishlist(){
  try{ return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || {}; }
  catch{ return {}; }
}
function setWishlist(w){ localStorage.setItem(WISHLIST_KEY, JSON.stringify(w)); }
function isSaved(id){ return !!getWishlist()[id]; }

function toggleSaved(item){
  const w = getWishlist();
  if(w[item.id]) delete w[item.id];
  else w[item.id] = item;
  setWishlist(w);
}

function updateHeart(btn, saved){
  if(!btn) return;
  btn.classList.toggle("saved", saved);
  btn.textContent = saved ? "♥" : "♡";
}

/***********************
  CART
************************/
const CART_KEY = "kcard_cart_v1";

function getCart(){
  try{ return JSON.parse(localStorage.getItem(CART_KEY)) || {items:[]}; }
  catch{ return {items:[]}; }
}
function setCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); }

function cartCount(){
  return getCart().items.reduce((s,i)=>s+i.qty,0);
}

function ensureCartUI(){
  if(document.getElementById("cartDrawer")) return;

  const overlay = document.createElement("div");
  overlay.id="cartOverlay"; overlay.className="cart-overlay";
  overlay.onclick = closeCart;

  const drawer = document.createElement("div");
  drawer.id="cartDrawer"; drawer.className="cart-drawer";
  drawer.innerHTML = `
    <div class="cart-header">
      <strong>Your cart</strong>
      <button class="btn" id="closeCart">Close</button>
    </div>
    <div class="cart-body" id="cartBody"></div>
    <div class="cart-footer">
      <div class="cart-row"><span>Total</span><span id="cartTotal">$0.00</span></div>
      <button class="btn primary">Checkout (demo)</button>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  const fab = document.createElement("button");
  fab.className="cart-fab";
  fab.innerHTML=`🛒 <span class="cart-dot" id="cartDot">0</span>`;
  fab.onclick=openCart;
  document.body.appendChild(fab);

  document.getElementById("closeCart").onclick=closeCart;
}

function openCart(){
  ensureCartUI();
  document.getElementById("cartOverlay").style.display="block";
  document.getElementById("cartDrawer").classList.add("open");
  renderCart();
}
function closeCart(){
  document.getElementById("cartOverlay").style.display="none";
  document.getElementById("cartDrawer").classList.remove("open");
}

function addToCart(item){
  const c = getCart();
  const existing = c.items.find(i=>i.key===item.key);
  if(existing) existing.qty++;
  else c.items.push({...item, qty:1});
  setCart(c);
  renderCart();
  updateCartUI();
  openCart();
}

function renderCart(){
  ensureCartUI();
  const c = getCart();
  const body = document.getElementById("cartBody");
  const totalEl = document.getElementById("cartTotal");
  body.innerHTML="";
  let total=0;

  c.items.forEach(i=>{
    total += (i.price+i.shipping)*i.qty;
    const row = document.createElement("div");
    row.className="cart-item";
    row.innerHTML = `<div>${i.title}</div><div>x${i.qty}</div>`;
    body.appendChild(row);
  });

  totalEl.textContent = "$"+total.toFixed(2);
}

function updateCartUI(){
  const dot = document.getElementById("cartDot");
  if(dot) dot.textContent = cartCount();
}

/***********************
  ADD TO CART buttons
************************/
document.addEventListener("click", e=>{
  const btn = e.target.closest("[data-add-cart]");
  if(!btn) return;

  e.preventDefault();

  addToCart({
    key: btn.dataset.cardId + btn.dataset.itemSeller,
    title: btn.dataset.itemTitle,
    price: parseFloat(btn.dataset.itemPrice),
    shipping: parseFloat(btn.dataset.itemShipping)
  });
});

/***********************
  INIT
************************/
document.addEventListener("DOMContentLoaded", ()=>{
  ensureCartUI();
  updateCartUI();
});
