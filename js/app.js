import { addToCart, initCart } from "./cart.js";
import {
  clearCurrentUser,
  getCart,
  getCurrentUser,
  getListings,
  getRequests,
  getUsers,
  initializeStore,
  resetDemoData,
  saveCart,
  saveListings,
  saveRequests,
  saveUsers,
  setCurrentUser
} from "./store.js";
import { createId, escapeHtml, money, normalize, qs, qsa } from "./utils.js";

function listingName(listing) {
  return [listing.group, listing.member, listing.title].filter(Boolean).join(" - ");
}

function listingMeta(listing) {
  return [listing.era, listing.condition].filter(Boolean).join(" - ") || "Photocard";
}

function imageSrc(listing) {
  return listing.imageUrl || "assets/photocard-hero.png";
}

function listingImage(listing, className = "thumbimg") {
  return `<img class="${className}" src="${escapeHtml(imageSrc(listing))}" alt="${escapeHtml(listing.title)}" data-fallback-image>`;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function sellerForListing(listing) {
  return getUsers().find((user) => user.id === listing.sellerId) ?? {
    displayName: listing.sellerName,
    location: "",
    bio: "",
    packaging: "",
    joinedAt: listing.createdAt
  };
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

function availabilityLabel(status) {
  if (status === "reserved") return "Reserved";
  if (status === "sold") return "Sold";
  if (status === "paused") return "Paused";
  return "Available";
}

function setListingStatus(listingId, status) {
  const listings = getListings({ includeInactive: true });
  const listing = listings.find((item) => item.id === listingId);
  if (!listing) return;
  listing.status = status;
  saveListings(listings);
}

function requestTimeline(status) {
  const steps = ["pending", "accepted", "completed"];
  const activeIndex = status === "declined" ? 0 : Math.max(0, steps.indexOf(status));
  if (status === "declined") return `<div class="timeline"><span class="active">Requested</span><span class="active">Declined</span></div>`;
  return `<div class="timeline">${steps
    .map((step, index) => `<span class="${index <= activeIndex ? "active" : ""}">${step === "pending" ? "Requested" : step[0].toUpperCase() + step.slice(1)}</span>`)
    .join("")}</div>`;
}

function validateListingForm() {
  const requiredFields = [
    ["#ls_group_name", "Add a group name."],
    ["#ls_member", "Add the member name."],
    ["#ls_card_title", "Add a card title or version."]
  ];
  for (const [selector, message] of requiredFields) {
    if (!qs(selector).value.trim()) return message;
  }

  if ((qs("#ls_group_name").value.trim()).length > 40) return "Keep the group name under 40 characters.";
  if ((qs("#ls_member").value.trim()).length > 40) return "Keep the member name under 40 characters.";
  if ((qs("#ls_card_title").value.trim()).length > 80) return "Keep the card title under 80 characters.";
  if ((qs("#ls_notes").value.trim()).length > 240) return "Keep notes under 240 characters.";
  if ((Number(qs("#ls_price").value) || 0) <= 0) return "Add a price greater than $0.";
  if (!qs("#ls_image_url").value.trim()) return "Add a card image before publishing.";
  return "";
}

function listingRow(listing) {
  return `
    <article class="panel rowitem" data-listing-id="${escapeHtml(listing.id)}">
      <a class="left" href="item.html?id=${encodeURIComponent(listing.id)}">
        ${listingImage(listing)}
        <div>
          <div class="title">${escapeHtml(listingName(listing))}</div>
          <div class="meta">${money(listing.price)} &middot; ${escapeHtml(listingMeta(listing))} &middot; ${escapeHtml(listing.sellerName)}</div>
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
  const maxPrice = qs("#maxPriceFilter");
  const sort = qs("#sortFilter");
  const count = qs("#resultsCount");
  const noResults = qs("#noResults");

  const applyFilters = () => {
    const queryValue = normalize(search?.value);
    const maxPriceValue = Number(maxPrice?.value);
    const sortValue = sort?.value || "";
    const listings = getListings().filter((listing) => {
      const searchable = normalize(`${listing.group} ${listing.member} ${listing.title} ${listing.era} ${listing.notes}`);
      return (!queryValue || searchable.includes(queryValue))
        && (!Number.isFinite(maxPriceValue) || !maxPrice?.value || Number(listing.price) <= maxPriceValue);
    });

    if (sortValue === "price-asc") listings.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortValue === "price-desc") listings.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortValue === "newest") listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    list.innerHTML = listings.map(listingRow).join("");
    count.textContent = `Showing ${listings.length} listing${listings.length === 1 ? "" : "s"}`;
    noResults.hidden = listings.length > 0;
  };

  maxPrice?.addEventListener("input", applyFilters);
  search?.addEventListener("input", applyFilters);
  sort?.addEventListener("change", applyFilters);
  qs("#clearFiltersBtn")?.addEventListener("click", () => {
    search.value = "";
    maxPrice.value = "";
    sort.value = "";
    applyFilters();
  });
  applyFilters();
}

function renderLogin() {
  const loginForm = qs("#loginForm");
  const signupForm = qs("#signupForm");
  const googleLoginBtn = qs("#googleLoginBtn");
  if (!loginForm && !signupForm) return;

  if (getCurrentUser()) {
    location.href = "account.html";
    return;
  }

  googleLoginBtn?.addEventListener("click", () => {
    const users = getUsers();
    const email = "google.demo@kcard.local";
    let user = users.find((candidate) => candidate.email === email);

    if (!user) {
      user = {
        id: createId("user"),
        email,
        password: "",
        displayName: "Google Demo User",
        location: "",
        bio: "",
        defaultStamped: 1.25,
        defaultTracked: 4.75,
        packaging: "Sleeve, toploader, and team bag",
        provider: "google",
        joinedAt: new Date().toISOString()
      };
      saveUsers([...users, user]);
    }

    setCurrentUser(user);
    location.href = "account.html";
  });

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
      packaging: "Sleeve, toploader, and team bag",
      joinedAt: new Date().toISOString()
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
  const editingListingId = qs("#editingListingId");
  const submitButton = qs("#listingSubmitBtn");
  const cancelEditButton = qs("#cancelEditListingBtn");
  const imageUrlInput = qs("#ls_image_url");
  const imageFileInput = qs("#ls_image_file");
  const imagePreview = qs("#listingImagePreview");
  const removeImageButton = qs("#removeListingImageBtn");
  const imageMessage = qs("#listingImageMsg");

  const updateImagePreview = () => {
    const src = imageUrlInput?.value.trim();
    if (!imagePreview) return;
    imagePreview.hidden = !src;
    removeImageButton.hidden = !src;
    imageMessage.textContent = "";
    if (src) {
      imagePreview.src = src;
      imagePreview.onerror = () => {
        imagePreview.hidden = true;
        imageMessage.textContent = "That image could not be loaded. Try another URL or upload a file.";
      };
    }
  };

  imageUrlInput?.addEventListener("input", updateImagePreview);
  imageFileInput?.addEventListener("change", () => {
    const file = imageFileInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      imageMessage.textContent = "Choose an image file.";
      imageFileInput.value = "";
      return;
    }
    if (file.size > 1_500_000) {
      imageMessage.textContent = "Choose an image under 1.5 MB for this local MVP.";
      imageFileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      imageUrlInput.value = String(reader.result || "");
      updateImagePreview();
    });
    reader.readAsDataURL(file);
  });

  const resetListingForm = () => {
    form.reset();
    editingListingId.value = "";
    submitButton.textContent = "Publish listing";
    cancelEditButton.hidden = true;
    updateImagePreview();
  };

  cancelEditButton?.addEventListener("click", resetListingForm);
  removeImageButton?.addEventListener("click", () => {
    imageUrlInput.value = "";
    imageFileInput.value = "";
    updateImagePreview();
  });
  qs("#resetDemoBtn")?.addEventListener("click", () => {
    resetDemoData();
    location.href = "index.html";
  });

  const renderMyListings = () => {
    const container = qs("#myListings");
    const listings = getListings({ includeInactive: true }).filter((listing) => listing.sellerId === user.id);
    container.innerHTML = listings.length
      ? listings.map((listing) => `
          <div class="panel rowitem">
            <div class="left">
              ${listingImage(listing)}
              <div>
                <div class="title">${escapeHtml(listingName(listing))}</div>
                <div class="meta">${money(listing.price)} &middot; ${escapeHtml(listingMeta(listing))} &middot; ${escapeHtml(availabilityLabel(listing.status))}</div>
              </div>
            </div>
            <div class="row-right">
              <button class="btn" type="button" data-edit-listing="${escapeHtml(listing.id)}">Edit</button>
              <button class="btn" type="button" data-toggle-listing="${escapeHtml(listing.id)}">${listing.status === "active" ? "Pause" : "Activate"}</button>
              <button class="btn" type="button" data-sold-listing="${escapeHtml(listing.id)}">Mark sold</button>
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
    qsa("[data-edit-listing]", container).forEach((button) => {
      button.addEventListener("click", () => {
        const listing = getListings({ includeInactive: true }).find((item) => item.id === button.dataset.editListing);
        if (!listing) return;
        editingListingId.value = listing.id;
        qs("#ls_group_name").value = listing.group || "";
        qs("#ls_member").value = listing.member || "";
        qs("#ls_card_title").value = listing.title || "";
        qs("#ls_era").value = listing.era || "";
        qs("#ls_condition").value = listing.condition || "Near Mint";
        qs("#ls_price").value = listing.price ?? "";
        qs("#ls_image_url").value = listing.imageUrl || "";
        qs("#ls_notes").value = listing.notes || "";
        submitButton.textContent = "Save listing";
        cancelEditButton.hidden = false;
        updateImagePreview();
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    qsa("[data-sold-listing]", container).forEach((button) => {
      button.addEventListener("click", () => {
        setListingStatus(button.dataset.soldListing, "sold");
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

  const requestRow = (request, mode) => `
    <div class="panel request-item">
      <div>
        <div class="title">${escapeHtml(request.listingName)}</div>
        <div class="meta">${money(request.total)} &middot; Qty ${request.qty} &middot; ${escapeHtml(request.status)}</div>
        <div class="small">${mode === "seller"
          ? `Buyer: ${escapeHtml(request.buyerName)} (${escapeHtml(request.buyerEmail)})`
          : `Seller: ${escapeHtml(request.sellerName)}`}</div>
      </div>
      <details class="request-detail">
        <summary>Request details</summary>
        ${requestTimeline(request.status)}
        <div class="detail-grid">
          <div><strong>Buyer</strong><span>${escapeHtml(request.buyerName || "Not provided")}</span></div>
          <div><strong>Email</strong><span>${escapeHtml(request.buyerEmail || "Not provided")}</span></div>
          <div><strong>Ship to</strong><span>${escapeHtml(request.buyerAddress || "Not provided")}</span></div>
          <div><strong>Message</strong><span>${escapeHtml(request.buyerMessage || "No message added.")}</span></div>
          <div><strong>Status</strong><span>${escapeHtml(request.status)}</span></div>
          <div><strong>Next step</strong><span>${request.status === "accepted"
            ? "Seller and buyer can coordinate by email."
            : request.status === "completed"
              ? "Request marked complete."
              : request.status === "declined"
                ? "Request declined."
                : "Seller can accept or decline this request."}</span></div>
        </div>
      </details>
      ${mode === "seller" ? `
        <div class="request-actions">
          <button class="btn" type="button" data-request-status="${escapeHtml(request.id)}" data-status-value="accepted">Accept</button>
          <button class="btn" type="button" data-request-status="${escapeHtml(request.id)}" data-status-value="declined">Decline</button>
          <button class="btn" type="button" data-request-status="${escapeHtml(request.id)}" data-status-value="completed">Complete</button>
        </div>
      ` : ""}
    </div>
  `;

  const renderRequests = () => {
    const requests = getRequests();
    const sellerRequests = qs("#sellerRequests");
    const buyerRequests = qs("#buyerRequests");
    const incoming = requests.filter((request) => request.sellerId === user.id);
    const outgoing = requests.filter((request) => request.buyerId === user.id || request.buyerEmail === user.email);

    if (sellerRequests) {
      sellerRequests.innerHTML = incoming.length
        ? incoming.map((request) => requestRow(request, "seller")).join("")
        : `<div class="cart-empty">No buyer requests yet.</div>`;
    }
    if (buyerRequests) {
      buyerRequests.innerHTML = outgoing.length
        ? outgoing.map((request) => requestRow(request, "buyer")).join("")
        : `<div class="cart-empty">No requests sent yet.</div>`;
    }

    qsa("[data-request-status]", sellerRequests).forEach((button) => {
      button.addEventListener("click", () => {
        const requests = getRequests();
        const request = requests.find((item) => item.id === button.dataset.requestStatus);
        if (!request) return;
        request.status = button.dataset.statusValue;
        if (request.status === "accepted") setListingStatus(request.listingId, "reserved");
        if (request.status === "completed") setListingStatus(request.listingId, "sold");
        saveRequests(requests);
        renderMyListings();
        renderRequests();
      });
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const validationMessage = validateListingForm();
    if (validationMessage) {
      qs("#listingMsg").textContent = validationMessage;
      return;
    }
    const existingId = editingListingId.value;
    const listing = {
      id: existingId || createId("listing"), sellerId: user.id,
      sellerName: user.displayName || user.email.split("@")[0],
      group: qs("#ls_group_name").value.trim(),
      member: qs("#ls_member").value.trim(),
      title: qs("#ls_card_title").value.trim(),
      condition: qs("#ls_condition").value,
      era: qs("#ls_era").value.trim(),
      price: Number(qs("#ls_price").value) || 0,
      shippingStamped: 0,
      shippingTracked: 0,
      imageUrl: qs("#ls_image_url").value.trim(),
      notes: qs("#ls_notes").value.trim(), status: "active",
      createdAt: new Date().toISOString()
    };
    const listings = getListings({ includeInactive: true });
    if (existingId) {
      const index = listings.findIndex((item) => item.id === existingId);
      const previous = listings[index];
      listings[index] = { ...previous, ...listing, status: previous.status || "active", createdAt: previous.createdAt };
      saveListings(listings);
    } else {
      saveListings([listing, ...listings]);
    }
    resetListingForm();
    qs("#listingMsg").textContent = existingId ? "Listing saved." : "Listing published.";
    renderMyListings();
  });
  renderMyListings();
  renderRequests();
}

function renderItem() {
  const item = qs("#itemHeader");
  if (!item) return;
  const id = new URL(location.href).searchParams.get("id");
  const listing = getListings({ includeInactive: true }).find((candidate) => candidate.id === id);
  qs("#itemHeaderLoading").hidden = true;
  item.hidden = false;

  if (!listing) {
    qs("#itemTitle").textContent = "Listing not found";
    qs("#listingsLoading").hidden = true;
    qs("#listingsEmpty").hidden = false;
    return;
  }

  qs("#itemImage").src = listing.imageUrl || "assets/photocard-hero.png";
  qs("#itemImage").dataset.fallbackImage = "true";
  qs("#itemImage").alt = listing.title;
  qs("#itemBadge").textContent = listing.group;
  qs("#itemTitle").textContent = listingName(listing);
  qs("#itemMetaLine").textContent = `${money(listing.price)} - ${listingMeta(listing)} - ${availabilityLabel(listing.status)}`;
  qs("#itemAttrs").innerHTML = `
    Group: ${escapeHtml(listing.group)}<br>
    Member: ${escapeHtml(listing.member || "Not specified")}<br>
    Album / era: ${escapeHtml(listing.era || "Not specified")}<br>
    Condition: ${escapeHtml(listing.condition)}<br>
    Notes: ${escapeHtml(listing.notes || "No notes added.")}
  `;
  const seller = sellerForListing(listing);
  const sellerListings = getListings({ includeInactive: true }).filter((item) => item.sellerId === listing.sellerId);
  const sellerCard = qs("#sellerCard");
  if (sellerCard) {
    sellerCard.innerHTML = `
      <h3 class="section-title">Seller</h3>
      <div class="seller-name">${escapeHtml(seller.displayName || listing.sellerName)}</div>
      <div class="small">${escapeHtml(seller.location || "Location not added")}</div>
      <div class="small">${sellerListings.length} listing${sellerListings.length === 1 ? "" : "s"}${seller.joinedAt ? ` &middot; Joined ${escapeHtml(formatDate(seller.joinedAt))}` : ""}</div>
      <p class="small">${escapeHtml(seller.bio || "No seller bio yet.")}</p>
      <p class="small flush">${escapeHtml(seller.packaging || "Packaging details not added.")}</p>
    `;
  }
  qs("#listingsLoading").hidden = true;
  qs("#listingsTable").hidden = false;
  const currentUser = getCurrentUser();
  const isOwnListing = currentUser?.id && currentUser.id === listing.sellerId;
  qs("#listingsBody").innerHTML = `
    <tr>
      <td>${escapeHtml(listing.sellerName)}</td>
      <td>${escapeHtml(listing.condition)}</td>
      <td>${money(listing.price)}</td>
      <td>${isOwnListing
        ? `<button class="btn" type="button" disabled>Your listing</button>`
        : listing.status === "active"
        ? `<button class="btn primary" type="button" data-add-cart="${escapeHtml(listing.id)}">Request to buy</button>`
        : `<button class="btn" type="button" disabled>${escapeHtml(availabilityLabel(listing.status))}</button>`}</td>
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
    const lineTotal = (Number(listing.price) || 0) * line.qty;
    total += lineTotal;
    return `
      <div class="cart-row checkout-line">
        <div>
          <strong>${escapeHtml(listingName(listing))}</strong>
          <div class="small">Qty ${line.qty}</div>
        </div>
        <strong>${money(lineTotal)}</strong>
      </div>
    `;
  }).filter(Boolean);

  summary.innerHTML = lines.length
    ? `<h2>Request summary</h2>${lines.join("")}<div class="cart-row checkout-total"><strong>Total</strong><strong>${money(total)}</strong></div>`
    : `<div class="cart-empty">Your cart is empty. <a href="browse.html">Browse listings</a> to add a card.</div>`;

  const user = getCurrentUser();
  if (user) {
    qs("#email").value = user.email;
    qs("#name").value = user.displayName || "";
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!cart.length) return;
    const buyer = getCurrentUser();
    const invalidLine = cart.find((line) => {
      const listing = listings.find((item) => item.id === line.id);
      return !listing || listing.status !== "active" || (buyer?.id && buyer.id === listing.sellerId);
    });
    if (invalidLine) {
      window.alert("One or more cards in your request list is unavailable or belongs to you.");
      return;
    }
    const buyerName = qs("#name").value.trim();
    const buyerEmail = normalize(qs("#email").value);
    const buyerMessage = qs("#buyerMessage").value.trim();
    const buyerAddress = [
      qs("#address1").value.trim(),
      qs("#address2").value.trim(),
      qs("#city").value.trim(),
      qs("#state").value.trim(),
      qs("#zip").value.trim(),
      qs("#country").value.trim()
    ].filter(Boolean).join(", ");
    const newRequests = cart.map((line) => {
      const listing = listings.find((item) => item.id === line.id);
      if (!listing) return null;
      const qty = line.qty;
      const total = (Number(listing.price) || 0) * qty;
      return {
        id: createId("request"),
        listingId: listing.id,
        listingName: listingName(listing),
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        buyerId: buyer?.id || "",
        buyerName,
        buyerEmail,
        buyerAddress,
        buyerMessage,
        qty,
        total,
        status: "pending",
        createdAt: new Date().toISOString()
      };
    }).filter(Boolean);
    saveRequests([...newRequests, ...getRequests()]);
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
    if (addButton) {
      const listing = getListings({ includeInactive: true }).find((item) => item.id === addButton.dataset.addCart);
      const user = getCurrentUser();
      if (listing?.sellerId && user?.id === listing.sellerId) {
        window.alert("You cannot request your own listing.");
        return;
      }
      addToCart(addButton.dataset.addCart);
    }
  });
  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.dataset.fallbackImage) return;
    if (image.src.endsWith("assets/photocard-hero.png")) return;
    image.src = "assets/photocard-hero.png";
  }, true);
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
