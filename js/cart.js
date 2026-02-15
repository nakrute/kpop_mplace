const KEY = "kcard_cart_v1";

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}
function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(listing, qty = 1) {
  const items = read();
  const existing = items.find((x) => x.id === listing.id);
  if (existing) existing.qty += qty;
  else items.push({ ...listing, qty });
  write(items);
  return items;
}

export function getCart() {
  return read();
}

export function clearCart() {
  write([]);
}

export function initCartUI() {
  // no-op for now (you can wire your drawer later)
}
