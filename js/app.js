import { addToCart, initCart } from "./cart.js";
import {
  clearCurrentUser,
  getCart,
  getCurrentUser,
  getListings,
  getUsers,
  initializeStore,
  saveCart,
  saveListings,
  saveUsers,
  setCurrentUser
} from "./store.js";
import { createId, escapeHtml, money, normalize, qs, qsa } from "./utils.js";

function bestShipping(listing) {
  const costs = [Number(listing.shippingStamped), Number(listing.shippingTracked)]
    .filter((cost) => Number.isFinite(cost) && cost >= 0);
  return costs.length ? Math.min(...costs) : 0;
}

function listingTotal(listing) {
  return (Number(listing.price) || 0) + bestShipping(listing);
}

function requireUser(needsAuth, authenticatedContent) {
  const user = getCurrentUser();
  if (needsAuth) needsAuth.hidden = Boolean(user);
  if (authenticatedContent) authenticatedContent.hidden = !user;
  return user;
}

function updateAuthButton() {
  const slot = qs("#authBtnSlot");
  if (!slot) return;
  slot.innerHTML = getCurrentUser()
    ? `<button class="btn" type="button" data-logout>Logout</button>`
    : `<a class="btn" href="login.html">Login</a>`;
}

function fillBandOptions(select, selected = "") {
  if (!select) return;
  const bands = [...new Set(getListings()
    .map((listing) => listing.group?.trim())
    .filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  select.innerHTML = `<option value="">Any band</option>${bands
    .map((band) => `<option value="${escapeHtml(band)}">${escapeHtml(band)}</option>`)
    .join("")}`;
  select.value = selected;
}

function listingRow(listing) {
  return `
    <article class="panel rowitem" data-listing-id="${escapeHtml(listing.id)}">
      <a class="left" href="item.html?id=${encodeURIComponent(listing.id)}">
        ${listing.imageUrl
          ? `<img class="thumbimg" src="${escapeHtml(listing.imageUrl)}" alt="${escapeHtml(listing.title)}">`
          : `<div class="thumb" aria-hidden="true"></div>`}
        <div>
          <div class="title">${escapeHtml(listing.group)} - ${escapeHtml(listing.title)}</div>
          <div class="meta">${escapeHtml(listing.era || "Photocard listing")}</div>
          <div class="meta">${escapeHtml(listing.condition)} &middot; ${money(listing.price)} + shipping &middot; ${escapeHtml(listing.sellerName)}</div>
        </div>
      </a>
      <div class="row-right">
        <a class="btn primary" href="item.html?id=${encodeURIComponent(listing.id)}">View</a>
      </div>
    </article>
  `;
}

function renderBrowse() {
  const list = qs("#browseList");
  if (!list) return;

  const search = qs("#searchInput");
  const band = qs("#groupFilter");
  const sort = qs("#sortFilter");
  const count = qs("#resultsCount");
  const noResults = qs("#noResults");
  fillBandOptions(band, band?.value || "");

  const applyFilters = () => {
    const queryValue = normalize(search?.value);
    const bandValue = normalize(band?.value);
    const sortValue = sort?.value || "";
    const listings = getListings().filter((listing) => {
      const searchable = normalize(`${listing.group} ${listing.title} ${listing.era} ${listing.notes}`);
      return (!queryValue || searchable.includes(queryValue))
        && (!bandValue || normalize(listing.group) === bandValue);
    });

    if (sortValue === "price-asc") listings.sort((a, b) => listingTotal(a) - listingTotal(b));
    if (sortValue === "price-desc") listings.sort((a, b) => listingTotal(b) - listingTotal(a));
    if (sortValue === "newest") listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.innerHTML = listings.map(listingRow).join("");
    count.textContent = `Showing ${listings.length} listing${listings.length === 1 ? "" : "s"}`;
    noResults.hidden = listings.length > 0;
  };

  band?.addEventListener("change", applyFilters);
  search?.addEventListener("input", applyFilters);
  sort?.addEventListener("change", applyFilters);
  qs("#clearFiltersBtn")?.addEventListener("click", () => {
    search.value = "";
    band.value = "";
    sort.value = "";
    applyFilters();
  });
  applyFilters();
}

function renderLogin() {
  const loginForm = qs("#loginForm");
  const signupForm = qs("#signupForm");
  if (!loginForm && !signupForm) return;

  if (getCurrentUser()) {
    location.href = "account.html";
    return;
  }

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = normalize(qs("#li_email").value);
    const password = qs("#li_password").value;
    const user = getUsers().find((candidate) => candidate.email === email && candidate.password === password);
    if (!user) {
      qs("#loginMsg").textContent = "No matching account. Check your email and password.";
      return;
    }
    setCurrentUser(user);
    location.href = "account.html";
  });

  signupForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const users = getUsers();
    const email = normalize(qs("#su_email").value);
    const password = qs("#su_password").value;
    const displayName = qs("#su_display_name").value.trim() || email.split("@")[0];

    if (password.length < 6) {
      qs("#signupMsg").textContent = "Use at least 6 characters for the password.";
      return;
    }
    if (users.some((user) => user.email === email)) {
      qs("#signupMsg").textContent = "That email already has an account.";
      return;
    }

    const user = {
      id: createId("user"), email, password, displayName,
      location: "", bio: "", defaultStamped: 1.25, defaultTracked: 4.75,
      packaging: "Sleeve, toploader, and team bag"
    };
    saveUsers([...users, user]);
    setCurrentUser(user);
    location.href = "account.html";
  });
}

function renderAccount() {
  const form = qs("#accountForm");
  if (!form) return;
  const user = requireUser(qs("#acctNeedsAuth"), qs("#acctAuthed"));
  if (!user) return;

  qs("#acctEmail").textContent = `Signed in as ${user.email}`;
  qs("#ac_display_name").value = user.displayName || "";
  qs("#ac_location").value = user.location || "";
  qs("#ac_is_seller").checked = true;
  qs("#ac_bio").value = user.bio || "";
  qs("#ac_ship_stamped").value = user.defaultStamped ?? "";
  qs("#ac_ship_tracked").value = user.defaultTracked ?? "";
  qs("#ac_packaging").value = user.packaging || "";

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const users = getUsers();
    const index = users.findIndex((candidate) => candidate.id === user.id);
    users[index] = {
      ...users[index],
      displayName: qs("#ac_display_name").value.trim(),
      location: qs("#ac_location").value.trim(),
      bio: qs("#ac_bio").value.trim(),
      defaultStamped: Number(qs("#ac_ship_stamped").value) || 0,
      defaultTracked: Number(qs("#ac_ship_tracked").value) || 0,
      packaging: qs("#ac_packaging").value.trim()
    };
    saveUsers(users);
    qs("#accountMsg").textContent = "Profile saved.";
    updateAuthButton();
  });
}

function renderDashboard() {
  const form = qs("#listingForm");
  if (!form) return;
  const user = requireUser(qs("#dashNeedsAuth"), qs("#dashAuthed"));
  if (!user) return;

  qs("#ls_ship_stamped").value = user.defaultStamped ?? "";
  qs("#ls_ship_tracked").value = user.defaultTracked ?? "";

  const renderMyListings = () => {
    const container = qs("#myListings");
    const listings = getListings({ includeInactive: true }).filter((listing) => listing.sellerId === user.id);
    container.innerHTML = listings.length
      ? listings.map((listing) => `
          <div class="panel rowitem">
            <div class="left">
              <div class="thumb" aria-hidden="true"></div>
              <div>
                <div class="title">${escapeHtml(listing.group)} - ${escapeHtml(listing.title)}</div>
                <div class="meta">${money(listing.price)} &middot; ${escapeHtml(listing.status)}</div>
              </div>
            </div>
            <div class="row-right">
              <button class="btn" type="button" data-toggle-listing="${escapeHtml(listing.id)}">${listing.status === "active" ? "Pause" : "Activate"}</button>
              <button class="btn" type="button" data-delete-listing="${escapeHtml(listing.id)}">Delete</button>
            </div>
          </div>
        `).join("")
      : `<div class="cart-empty">No listings yet. Create your first photocard listing here.</div>`;

    qsa("[data-toggle-listing]", container).forEach((button) => {
      button.addEventListener("click", () => {
        const allListings = getListings({ includeInactive: true });
        const listing = allListings.find((item) => item.id === button.dataset.toggleListing);
        listing.status = listing.status === "active" ? "paused" : "active";
        saveListings(allListings);
        renderMyListings();
      });
    });
    qsa("[data-delete-listing]", container).forEach((button) => {
      button.addEventListener("click", () => {
        saveListings(getListings({ includeInactive: true })
          .filter((listing) => listing.id !== button.dataset.deleteListing));
        renderMyListings();
      });
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const listing = {
      id: createId("listing"), sellerId: user.id,
      sellerName: user.displayName || user.email.split("@")[0],
      group: qs("#ls_group_name").value.trim(),
      title: qs("#ls_card_title").value.trim(),
      era: qs("#ls_era").value.trim(),
      condition: qs("#ls_condition").value,
      price: Number(qs("#ls_price").value) || 0,
      shippingStamped: Number(qs("#ls_ship_stamped").value) || 0,
      shippingTracked: Number(qs("#ls_ship_tracked").value) || 0,
      imageUrl: qs("#ls_image_url").value.trim(),
      notes: qs("#ls_notes").value.trim(), status: "active",
      createdAt: new Date().toISOString()
    };
    saveListings([listing, ...getListings({ includeInactive: true })]);
    form.reset();
    qs("#ls_ship_stamped").value = user.defaultStamped ?? "";
    qs("#ls_ship_tracked").value = user.defaultTracked ?? "";
    qs("#listingMsg").textContent = "Listing published.";
    renderMyListings();
  });
  renderMyListings();
}

function renderItem() {
  const item = qs("#itemHeader");
  if (!item) return;
  const id = new URL(location.href).searchParams.get("id");
  const listing = getListings().find((candidate) => candidate.id === id);
  qs("#itemHeaderLoading").hidden = true;
  item.hidden = false;

  if (!listing) {
    qs("#itemTitle").textContent = "Listing not found";
    qs("#listingsLoading").hidden = true;
    qs("#listingsEmpty").hidden = false;
    return;
  }

  qs("#itemImage").src = listing.imageUrl || "assets/photocard-hero.png";
  qs("#itemImage").alt = listing.title;
  qs("#itemBadge").textContent = listing.group;
  qs("#itemTitle").textContent = listing.title;
  qs("#itemMetaLine").textContent = [listing.era, listing.condition].filter(Boolean).join(" - ");
  qs("#itemStats").textContent = `${money(listing.price)} item price - from ${money(listingTotal(listing))} with shipping`;
  qs("#itemAttrs").innerHTML = `Band: ${escapeHtml(listing.group)}<br>Seller: ${escapeHtml(listing.sellerName)}`;
  qs("#listingsLoading").hidden = true;
  qs("#listingsTable").hidden = false;
  qs("#listingsBody").innerHTML = `
    <tr>
      <td>${escapeHtml(listing.sellerName)}</td>
      <td>${escapeHtml(listing.condition)}</td>
      <td>${money(listing.price)}</td>
      <td>Stamped ${money(listing.shippingStamped)} / Tracked ${money(listing.shippingTracked)}</td>
      <td><button class="btn primary" type="button" data-add-cart="${escapeHtml(listing.id)}">Add to cart</button></td>
    </tr>
  `;
}

function renderCheckout() {
  const form = qs("#checkoutForm");
  const summary = qs("#checkoutSummary");
  if (!form || !summary) return;
  const listings = getListings({ includeInactive: true });
  const cart = getCart();
  let total = 0;

  const lines = cart.map((line) => {
    const listing = listings.find((item) => item.id === line.id);
    if (!listing) return "";
    const shipping = line.shipping === "Tracked" ? listing.shippingTracked : listing.shippingStamped;
    const lineTotal = (listing.price + shipping) * line.qty;
    total += lineTotal;
    return `
      <div class="cart-row checkout-line">
        <div>
          <strong>${escapeHtml(listing.group)} - ${escapeHtml(listing.title)}</strong>
          <div class="small">${escapeHtml(line.shipping)} &middot; Qty ${line.qty}</div>
        </div>
        <strong>${money(lineTotal)}</strong>
      </div>
    `;
  }).filter(Boolean);

  summary.innerHTML = lines.length
    ? `<h2>Order summary</h2>${lines.join("")}<div class="cart-row checkout-total"><strong>Total</strong><strong>${money(total)}</strong></div>`
    : `<div class="cart-empty">Your cart is empty. <a href="browse.html">Browse listings</a> to add a card.</div>`;

  const user = getCurrentUser();
  if (user) {
    qs("#email").value = user.email;
    qs("#name").value = user.displayName || "";
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!cart.length) return;
    saveCart([]);
    location.href = "order-success.html";
  });
}

function wireGlobalActions() {
  document.addEventListener("click", (event) => {
    const logout = event.target.closest("[data-logout]");
    if (logout) {
      clearCurrentUser();
      location.href = "index.html";
      return;
    }
    const addButton = event.target.closest("[data-add-cart]");
    if (addButton) addToCart(addButton.dataset.addCart);
  });
}

export function initApp() {
  initializeStore();
  initCart();
  updateAuthButton();
  wireGlobalActions();
  renderBrowse();
  renderLogin();
  renderAccount();
  renderDashboard();
  renderItem();
  renderCheckout();
}
