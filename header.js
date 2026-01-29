// header.js — no imports (renders instantly)

function toggleMenu() {
  const nav = document.querySelector(".nav");
  if (nav) nav.classList.toggle("open");
}
window.toggleMenu = toggleMenu;

function renderHeader() {
  const el = document.getElementById("siteHeader");
  if (!el) return;

  el.className = "panel nav";
  el.innerHTML = `
    <div class="brand">
      <div class="logo"></div>
      <div>
        K-Card Market
        <div class="small">Buy and Sell KPop POC’s!</div>
      </div>
    </div>

    <button class="hamburger" type="button" onclick="toggleMenu()">Menu</button>

    <nav class="navlinks">
      <a data-nav href="index.html">Home</a>
      <a data-nav href="browse.html">Browse</a>
      <a data-nav href="saved.html">Saved</a>
      <a data-nav href="seller.html">Sellers</a>
      <a data-nav href="dashboard.html">Sell</a>
      <a data-nav href="about.html">About</a>
      <a data-nav href="account.html">Account</a>
    </nav>

    <div class="nav-cta">
      <div id="authBtnSlot">
        <!-- app.js will fill Login/Logout -->
        <a class="btn" href="login.html">Login</a>
      </div>

      <div id="authCta">
        <a class="btn" href="checkout.html">Checkout</a>
        <a class="btn primary" href="dashboard.html">List a card</a>
      </div>
    </div>
  `;
}

function markActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  markActiveNav();
});
