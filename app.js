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
  if (wl[item.id]) {
    delete wl[item.id];
  } else {
    wl[item.id] = item; // store minimal data
  }
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
   Wire up wishlist buttons
---------------------------- */
function initBrowseWishlistButtons() {
  const listEl = document.getElementById("browseList");
  if (!listEl) return;

  // Set initial heart states
  listEl.querySelectorAll(".rowitem[data-id]").forEach((row) => {
    const id = row.dataset.id;
    const btn = row.querySelector("[data-save-btn]");
    updateHeartButton(btn, isSaved(id));
  });

  // Handle heart clicks (event delegation)
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

  // Sort saved items newest-first if date exists
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

    // Remove handler
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

document.addEventListener("DOMContentLoaded", () => {
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

  // Wishlist wiring
  initBrowseWishlistButtons();
  initItemWishlistButton();
  renderSavedPage();
});
