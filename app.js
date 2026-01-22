// Mobile menu toggle (used by every page)
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

// --- Browse filtering logic (only runs on browse.html) ---
function applyBrowseFilters() {
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const typeEl = document.getElementById("typeFilter");
  const noResultsEl = document.getElementById("noResults");

  // Not on browse page? Exit quietly.
  if (!searchEl || !groupEl || !typeEl) return;

  const query = (searchEl.value || "").trim().toLowerCase();
  const group = (groupEl.value || "").trim().toLowerCase();
  const type = (typeEl.value || "").trim().toLowerCase();

  const items = document.querySelectorAll(".rowitem[data-group][data-type]");
  let visibleCount = 0;

  items.forEach((item) => {
    const itemGroup = (item.dataset.group || "").toLowerCase();
    const itemType = (item.dataset.type || "").toLowerCase();
    const itemText = (item.dataset.text || item.textContent || "").toLowerCase();

    const matchesGroup = !group || itemGroup === group;
    const matchesType = !type || itemType === type;
    const matchesQuery = !query || itemText.includes(query);

    const show = matchesGroup && matchesType && matchesQuery;

    item.style.display = show ? "" : "none";
    if (show) visibleCount += 1;
  });

  if (noResultsEl) {
    noResultsEl.style.display = visibleCount === 0 ? "" : "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Wire up browse listeners if present
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const typeEl = document.getElementById("typeFilter");

  if (searchEl && groupEl && typeEl) {
    searchEl.addEventListener("input", applyBrowseFilters);
    groupEl.addEventListener("change", applyBrowseFilters);
    typeEl.addEventListener("change", applyBrowseFilters);

    // Run once on load
    applyBrowseFilters();
  }
});
