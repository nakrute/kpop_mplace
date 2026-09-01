const HEADER_MARKUP = `
  <a class="brand" href="index.html">
    <img class="logo" src="assets/brand-mark.png" alt="" aria-hidden="true" />
    <div class="brand-copy">
      <strong>K-Card Market</strong>
      <span>Photocard marketplace</span>
    </div>
  </a>

  <button class="hamburger" type="button" data-menu-toggle aria-label="Toggle navigation" aria-expanded="false">Menu</button>

  <nav class="navlinks" aria-label="Primary navigation">
    <a data-nav href="index.html">Home</a>
    <a data-nav href="browse.html">Browse</a>
    <a data-nav href="dashboard.html">Sell</a>
    <a data-nav href="account.html">Account</a>
  </nav>

  <div class="nav-cta">
    <button class="btn" type="button" data-theme-toggle aria-label="Switch color theme">Dark mode</button>
    <div id="authBtnSlot"><a class="btn" href="login.html">Login</a></div>
    <a class="btn primary" href="dashboard.html">List a card</a>
  </div>
`;

function renderHeader() {
  const el = document.getElementById("siteHeader");
  if (!el) return null;

  el.classList.add("panel", "nav", "enhanced");
  if (!el.innerHTML.trim()) el.innerHTML = HEADER_MARKUP;

  const menuButton = el.querySelector("[data-menu-toggle]");
  menuButton?.addEventListener("click", () => {
    const isOpen = el.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  return el;
}

function markActiveNav(root = document) {
  const path = location.pathname.split("/").pop() || "index.html";
  root.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === path);
  });
}

export function initHeader() {
  const header = renderHeader();
  if (header) markActiveNav(header);
}
