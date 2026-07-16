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

export function clearCurrentUser() {
  localStorage.removeItem(KEYS.session);
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

export function resetDemoData() {
  write(KEYS.users, SEED_USERS);
  write(KEYS.listings, SEED_LISTINGS);
  write(KEYS.requests, []);
  write(KEYS.cart, []);
  write(KEYS.schema, true);
  localStorage.removeItem(KEYS.session);
}
