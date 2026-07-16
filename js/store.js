const CART_KEY = "kcard_cart_v1";
let listings = [];
let users = [];
let requests = [];
let currentUser = null;

async function api(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, {
    credentials: "same-origin",
    ...options,
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

export async function initializeStore() {
  const [listingResult, userResult, sessionResult] = await Promise.all([
    api("/listings?includeInactive=true"), api("/users"), api("/auth/me")
  ]);
  listings = listingResult.listings;
  users = userResult.users;
  currentUser = sessionResult.user;
  requests = currentUser ? (await api("/requests")).requests : [];
}

export function getListings({ includeInactive = false } = {}) {
  return includeInactive ? [...listings] : listings.filter((listing) => listing.status === "active");
}
export function getUsers() { return [...users]; }
export function getRequests() { return [...requests]; }
export function getCurrentUser() { return currentUser; }

export async function login(email, password) {
  const result = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  currentUser = result.user;
  requests = (await api("/requests")).requests;
  return currentUser;
}

export async function signup(displayName, email, password) {
  const result = await api("/auth/signup", { method: "POST", body: JSON.stringify({ displayName, email, password }) });
  currentUser = result.user;
  users = [...users, currentUser];
  requests = [];
  return currentUser;
}

export async function clearCurrentUser() {
  await api("/auth/logout", { method: "POST" });
  currentUser = null;
  requests = [];
}

export async function updateProfile(profile) {
  const result = await api("/profile", { method: "PATCH", body: JSON.stringify(profile) });
  currentUser = result.user;
  users = users.map((user) => user.id === currentUser.id ? currentUser : user);
  return currentUser;
}

export async function createListing(listing) {
  const result = await api("/listings", { method: "POST", body: JSON.stringify(listing) });
  listings = [result.listing, ...listings];
  return result.listing;
}

export async function updateListing(id, changes) {
  const result = await api(`/listings/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(changes) });
  listings = listings.map((listing) => listing.id === id ? result.listing : listing);
  return result.listing;
}

export async function deleteListing(id) {
  await api(`/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
  listings = listings.filter((listing) => listing.id !== id);
}

export async function createBuyRequests(items, details) {
  const created = [];
  for (const item of items) {
    const result = await api("/requests", { method: "POST", body: JSON.stringify({
      listingId: item.id, buyerAddress: details.buyerAddress, buyerMessage: details.buyerMessage
    }) });
    created.push(result.request);
  }
  requests = [...created, ...requests];
  return created;
}

export async function updateRequestStatus(id, status) {
  const result = await api(`/requests/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
  requests = requests.map((request) => request.id === id ? result.request : request);
  const listingStatus = status === "accepted" ? "reserved" : status === "completed" ? "sold" : "";
  if (listingStatus) listings = listings.map((listing) => listing.id === result.request.listingId ? { ...listing, status: listingStatus } : listing);
  return result.request;
}

function readCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}

export function getCart() {
  return readCart().filter((line) => line && typeof line.id === "string" && Number(line.qty) > 0)
    .map((line) => ({ id: line.id, qty: 1 }));
}

export function saveCart(cart) {
  const uniqueLines = new Map();
  cart.forEach((line) => {
    if (line && typeof line.id === "string" && Number(line.qty) > 0) uniqueLines.set(line.id, { id: line.id, qty: 1 });
  });
  localStorage.setItem(CART_KEY, JSON.stringify([...uniqueLines.values()]));
}
