const KEY = "kcard_wishlist_v1";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(ids) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function isWishlisted(cardId) {
  return read().includes(cardId);
}

export function toggleWishlist(cardId) {
  const ids = read();
  const next = ids.includes(cardId) ? ids.filter((x) => x !== cardId) : [...ids, cardId];
  write(next);
  return next;
}

export function getWishlistIds() {
  return read();
}
