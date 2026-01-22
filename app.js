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

// Normalize strings so "Stray   Kids" == "stray kids"
function norm(str) {
  return (str || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// Browse filtering
function applyBrowseFilters() {
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const typeEl = document.getElementById("typeFilter");
  const noResultsEl = document.getElementById("noResults");
  const resultsCountEl = document.getElementById("resultsCount");

  // Not on browse page
  if (!searchEl || !groupEl || !typeEl) return;

  const query = norm(searchEl.value);
  const group = norm(groupEl.value);
  const type = norm(typeEl.value);

  const items = document.querySelectorAll(".rowitem");

  let visibleCount = 0;
  let totalCount = 0;

  items.forEach((item) => {
    // Only filter items that actually have data-group + data-type
    // (prevents accidental filtering of other .rowitem elements)
    if (!item.dataset.group || !item.dataset.type) return;

    totalCount += 1;

    const itemGroup = norm(item.dataset.group);
    const itemType = norm(item.dataset.type);

    // searchable text: data-tags preferred, fallback to textContent
    const itemText = norm(item.dataset.tags || item.textContent);

    // Flexible group/type matching:
    // - exact match
    // - OR substring (helps if you later do keys like "seventeen (svt)" etc.)
    const matchesGroup = !group || itemGroup === group || itemGroup.includes(group) || group.includes(itemGroup);
    const matchesType = !type || itemType === type || itemType.includes(type) || type.includes(itemType);

    // Search query supports multiple words (AND behavior)
    const qParts = query ? query.split(" ") : [];
    const matchesQuery = !query || qParts.every((p) => itemText.includes(p));

    const show = matchesGroup && matchesType && matchesQuery;

    item.style.display = show ? "" : "none";
    if (show) visibleCount += 1;
  });

  if (noResultsEl) noResultsEl.style.display = visibleCount === 0 ? "" : "none";

  if (resultsCountEl) {
    if (!query && !group && !type) {
      resultsCountEl.textContent = "Showing all results";
    } else {
      resultsCountEl.textContent = `Showing ${visibleCount} of ${totalCount}`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const searchEl = document.getElementById("searchInput");
  const groupEl = document.getElementById("groupFilter");
  const typeEl = document.getElementById("typeFilter");
  const clearBtn = document.getElementById("clearFiltersBtn");

  if (searchEl && groupEl && typeEl) {
    searchEl.addEventListener("input", applyBrowseFilters);
    groupEl.addEventListener("change", applyBrowseFilters);
    typeEl.addEventListener("change", applyBrowseFilters);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchEl.value = "";
        groupEl.value = "";
        typeEl.value = "";
        applyBrowseFilters();
      });
    }

    applyBrowseFilters();
  }
});
