const KEYS = {
  users: "kcard_users_v1",
  session: "kcard_session_v1",
  listings: "kcard_listings_v1",
  requests: "kcard_requests_v1",
  cart: "kcard_cart_v1",
  schema: "kcard_schema_v3"
};

const SEED_USERS = [
  {
    id: "demo-user",
    email: "toploaderclub@kcard.local",
    password: "", 
    displayName: "toploaderclub",
    location: "NJ, USA",
    bio: "US-based collector packing every card in a sleeve, toploader, and team bag.",
    defaultStamped: 1.25,
    defaultTracked: 4.75,
    packaging: "Sleeve, toploader, team bag, and rigid mailer",
    joinedAt: "2026-01-18T15:00:00.000Z"
  },
  {
    id: "seed-staytrades",
    email: "staytrades@kcard.local",
    password: "",
    displayName: "staytrades",
    location: "CA, USA",
    bio: "Stray Kids collector with fast replies and careful packaging.",
    defaultStamped: 1.5,
    defaultTracked: 5,
    packaging: "Sleeve, toploader, and cardboard reinforcement",
    joinedAt: "2026-01-24T18:30:00.000Z"
  },
  {
    id: "seed-bunnybinder",
    email: "bunnybinder@kcard.local",
    password: "",
    displayName: "bunnybinder",
    location: "TX, USA",
    bio: "Girl group binder cleanout. Happy to bundle requests.",
    defaultStamped: 1.25,
    defaultTracked: 4.5,
    packaging: "Sleeve, toploader, team bag, and stamped envelope",
    joinedAt: "2026-02-01T12:15:00.000Z"
  },
  {
    id: "seed-onceagain",
    email: "onceagain@kcard.local",
    password: "",
    displayName: "onceagain",
    location: "IL, USA",
    bio: "TWICE collector selling extras from album pulls.",
    defaultStamped: 1,
    defaultTracked: 4.25,
    packaging: "Sleeve, toploader, and thank-you card",
    joinedAt: "2026-01-30T10:45:00.000Z"
  }
];

const SEED_LISTINGS = [
  {
    id: "seed-svt-mingyu-1",
    sellerId: "demo-user",
    sellerName: "toploaderclub",
    group: "SEVENTEEN",
    member: "Mingyu",
    title: "FML Carat Ver. photocard",
    era: "FML",
    condition: "Near Mint",
    price: 12,
    shippingStamped: 1.25,
    shippingTracked: 4.75,
    imageUrl: "assets/photocard-hero.png",
    notes: "Sleeved, toploader, and team bag.",
    status: "active",
    createdAt: "2026-02-12T16:00:00.000Z"
  },
  {
    id: "seed-skz-felix-1",
    sellerId: "seed-staytrades",
    sellerName: "staytrades",
    group: "Stray Kids",
    member: "Felix",
    title: "5-Star limited POB",
    era: "5-Star",
    condition: "Mint",
    price: 18,
    shippingStamped: 1.5,
    shippingTracked: 5,
    imageUrl: "assets/photocard-hero.png",
    notes: "US stamped or tracked.",
    status: "active",
    createdAt: "2026-02-10T15:30:00.000Z"
  },
  {
    id: "seed-nwj-hanni-1",
    sellerId: "seed-bunnybinder",
    sellerName: "bunnybinder",
    group: "NewJeans",
    member: "Hanni",
    title: "Get Up Weverse album card",
    era: "Get Up",
    condition: "Near Mint",
    price: 9,
    shippingStamped: 1.25,
    shippingTracked: 4.5,
    imageUrl: "assets/photocard-hero.png",
    notes: "Tiny print line visible under direct light.",
    status: "active",
    createdAt: "2026-02-08T19:15:00.000Z"
  },
  {
    id: "seed-twice-sana-1",
    sellerId: "seed-onceagain",
    sellerName: "onceagain",
    group: "TWICE",
    member: "Sana",
    title: "Ready To Be digipack card",
    era: "Ready To Be",
    condition: "Good",
    price: 7,
    shippingStamped: 1,
    shippingTracked: 4.25,
    imageUrl: "assets/photocard-hero.png",
    notes: "Small corner nick.",
    status: "active",
    createdAt: "2026-02-04T12:45:00.000Z"
  }
];

const SEED_SELLER_IDS = Object.fromEntries(SEED_USERS.map((user) => [user.displayName, user.id]));
const REQUEST_STATUSES = new Set(["pending", "accepted", "declined", "completed"]);

function createId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function cleanText(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function normalizeEmail(email) {
  return cleanText(email, 254).toLowerCase();
}

function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("Sign in to continue.");
  return user;
}

function validateListing(input) {
  const listing = {
    group: cleanText(input.group, 40),
    member: cleanText(input.member, 40),
    title: cleanText(input.title, 80),
    era: cleanText(input.era, 80),
    condition: cleanText(input.condition || "Near Mint", 40),
    imageUrl: cleanText(input.imageUrl, 500_000),
    notes: cleanText(input.notes, 240),
    price: Number(input.price) || 0,
    shippingStamped: Number(input.shippingStamped) || 0,
    shippingTracked: Number(input.shippingTracked) || 0,
    status: cleanText(input.status || "active", 20)
  };

  if (!listing.group || !listing.member || !listing.title) throw new Error("Group, member, and card title are required.");
  if (listing.price <= 0) throw new Error("Price must be greater than $0.");
  if (!["active", "paused", "reserved", "sold"].includes(listing.status)) throw new Error("Listing status is invalid.");
  return listing;
}

export function initializeStore() {
  if (!localStorage.getItem(KEYS.users)) write(KEYS.users, SEED_USERS);
  if (!localStorage.getItem(KEYS.listings)) write(KEYS.listings, SEED_LISTINGS);
  if (!localStorage.getItem(KEYS.requests)) write(KEYS.requests, []);

  if (!read(KEYS.schema, false)) {
    const migrated = read(KEYS.listings, []).map((listing) => {
      const { member, subunit, ...groupListing } = listing;
      return {
        ...groupListing,
        member: member || "",
        title: listing.title
      };
    });
    write(KEYS.listings, migrated);
    write(KEYS.schema, true);
  }

  const users = getUsers();
  const missingSeedUsers = SEED_USERS.filter((seedUser) => !users.some((user) => user.id === seedUser.id));
  if (missingSeedUsers.length) {
    write(KEYS.users, [...missingSeedUsers, ...users]);
  }
  const listings = read(KEYS.listings, []).map((listing) => ({
    member: "",
    era: "",
    imageUrl: "",
    status: "active",
    ...listing,
    sellerId: SEED_SELLER_IDS[listing.sellerName] || listing.sellerId
  }));
  write(KEYS.listings, listings);

  const requests = read(KEYS.requests, []).map((request) => ({
    buyerMessage: "",
    status: "pending",
    ...request
  }));
  write(KEYS.requests, requests);
}

export function getListings({ includeInactive = false } = {}) {
  const listings = read(KEYS.listings, []);
  return includeInactive ? listings : listings.filter((listing) => listing.status === "active");
}

export function saveListings(listings) {
  write(KEYS.listings, listings);
}

export function getUsers() {
  return read(KEYS.users, []);
}

export function saveUsers(users) {
  write(KEYS.users, users);
}

export function getCurrentUser() {
  const session = read(KEYS.session, null);
  if (!session?.email) return null;
  return getUsers().find((user) => user.email === session.email) ?? null;
}

export function setCurrentUser(user) {
  write(KEYS.session, { email: user.email });
}

export function signup(displayName, email, password) {
  const normalizedEmail = normalizeEmail(email);
  const users = getUsers();
  if (!cleanText(displayName, 80) || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    throw new Error("Add a display name and valid email.");
  }
  if (String(password || "").length < 8) throw new Error("Use at least 8 characters for the password.");
  if (users.some((user) => normalizeEmail(user.email) === normalizedEmail)) {
    throw new Error("That email already has an account.");
  }

  const user = {
    id: createId("user"),
    email: normalizedEmail,
    password: String(password),
    displayName: cleanText(displayName, 80),
    location: "",
    bio: "",
    packaging: "",
    joinedAt: new Date().toISOString()
  };
  saveUsers([...users, user]);
  setCurrentUser(user);
  return user;
}

export function login(email, password) {
  const normalizedEmail = normalizeEmail(email);
  const user = getUsers().find((candidate) => normalizeEmail(candidate.email) === normalizedEmail);
  if (!user || user.password !== String(password)) throw new Error("Email or password is incorrect.");
  setCurrentUser(user);
  return user;
}

export function clearCurrentUser() {
  localStorage.removeItem(KEYS.session);
}

export function updateProfile(profile) {
  const currentUser = requireCurrentUser();
  const users = getUsers();
  const index = users.findIndex((user) => user.id === currentUser.id);
  if (index < 0) throw new Error("Account not found.");

  const updated = {
    ...users[index],
    displayName: cleanText(profile.displayName, 80) || users[index].displayName,
    location: cleanText(profile.location, 100),
    bio: cleanText(profile.bio, 500),
    packaging: cleanText(profile.packaging, 500)
  };
  users[index] = updated;
  saveUsers(users);

  const listings = getListings({ includeInactive: true }).map((listing) => (
    listing.sellerId === updated.id ? { ...listing, sellerName: updated.displayName } : listing
  ));
  saveListings(listings);
  return updated;
}

export function getCart() {
  return read(KEYS.cart, [])
    .filter((line) => line && typeof line.id === "string" && Number(line.qty) > 0)
    .map((line) => ({ id: line.id, qty: 1 }));
}

export function saveCart(cart) {
  const uniqueLines = new Map();
  cart.forEach((line) => {
    if (line && typeof line.id === "string" && Number(line.qty) > 0) {
      uniqueLines.set(line.id, { id: line.id, qty: 1 });
    }
  });
  write(KEYS.cart, [...uniqueLines.values()]);
}

export function getRequests() {
  return read(KEYS.requests, []);
}

export function saveRequests(requests) {
  write(KEYS.requests, requests);
}

export function createListing(input) {
  const user = requireCurrentUser();
  const listing = {
    ...validateListing(input),
    id: createId("listing"),
    sellerId: user.id,
    sellerName: user.displayName,
    createdAt: new Date().toISOString()
  };
  saveListings([listing, ...getListings({ includeInactive: true })]);
  return listing;
}

export function updateListing(id, input) {
  const user = requireCurrentUser();
  const listings = getListings({ includeInactive: true });
  const index = listings.findIndex((listing) => listing.id === id && listing.sellerId === user.id);
  if (index < 0) throw new Error("Listing not found.");

  const updated = {
    ...listings[index],
    ...validateListing({ ...listings[index], ...input }),
    sellerId: user.id,
    sellerName: user.displayName,
    updatedAt: new Date().toISOString()
  };
  listings[index] = updated;
  saveListings(listings);
  return updated;
}

export function deleteListing(id) {
  const user = requireCurrentUser();
  const listings = getListings({ includeInactive: true });
  const nextListings = listings.filter((listing) => !(listing.id === id && listing.sellerId === user.id));
  if (nextListings.length === listings.length) throw new Error("Listing not found.");
  saveListings(nextListings);
}

export function createBuyRequests(listings, { buyerAddress = "", buyerMessage = "" } = {}) {
  const user = requireCurrentUser();
  const activeListings = getListings();
  const requests = listings.map((listing) => {
    const currentListing = activeListings.find((item) => item.id === listing.id);
    if (!currentListing) throw new Error(`${listing.title || "This listing"} is unavailable.`);
    if (currentListing.sellerId === user.id) throw new Error("You cannot request your own listing.");

    return {
      id: createId("request"),
      listingId: currentListing.id,
      listingName: [currentListing.group, currentListing.member, currentListing.title].filter(Boolean).join(" - "),
      sellerId: currentListing.sellerId,
      sellerName: currentListing.sellerName,
      buyerId: user.id,
      buyerName: user.displayName,
      buyerEmail: user.email,
      buyerAddress: cleanText(buyerAddress, 500),
      buyerMessage: cleanText(buyerMessage, 500),
      qty: 1,
      total: Number(currentListing.price) || 0,
      status: "pending",
      createdAt: new Date().toISOString()
    };
  });
  saveRequests([...requests, ...getRequests()]);
  return requests;
}

export function updateRequestStatus(id, status) {
  const user = requireCurrentUser();
  if (!REQUEST_STATUSES.has(status)) throw new Error("Request status is invalid.");

  const requests = getRequests();
  const index = requests.findIndex((request) => request.id === id && request.sellerId === user.id);
  if (index < 0) throw new Error("Request not found.");

  requests[index] = { ...requests[index], status, updatedAt: new Date().toISOString() };
  saveRequests(requests);

  if (status === "accepted" || status === "completed") {
    const listings = getListings({ includeInactive: true }).map((listing) => {
      if (listing.id !== requests[index].listingId) return listing;
      return { ...listing, status: status === "accepted" ? "reserved" : "sold" };
    });
    saveListings(listings);
  }

  return requests[index];
}

export function resetDemoData() {
  write(KEYS.users, SEED_USERS);
  write(KEYS.listings, SEED_LISTINGS);
  write(KEYS.requests, []);
  write(KEYS.cart, []);
  write(KEYS.schema, true);
  localStorage.removeItem(KEYS.session);
}
