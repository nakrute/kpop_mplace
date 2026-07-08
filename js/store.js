import { normalize } from "./utils.js";

const KEYS = {
  users: "kcard_users_v1",
  session: "kcard_session_v1",
  listings: "kcard_listings_v1",
  cart: "kcard_cart_v1",
  schema: "kcard_schema_v2"
};

const SEED_LISTINGS = [
  {
    id: "seed-svt-mingyu-1",
    sellerId: "demo-user",
    sellerName: "toploaderclub",
    group: "SEVENTEEN",
    title: "Mingyu FML Carat Ver. photocard",
    era: "FML",
    condition: "Near Mint",
    price: 12,
    shippingStamped: 1.25,
    shippingTracked: 4.75,
    imageUrl: "",
    notes: "Sleeved, toploader, and team bag.",
    status: "active",
    createdAt: "2026-02-12T16:00:00.000Z"
  },
  {
    id: "seed-skz-felix-1",
    sellerId: "demo-user",
    sellerName: "staytrades",
    group: "Stray Kids",
    title: "Felix 5-Star limited POB",
    era: "5-Star",
    condition: "Mint",
    price: 18,
    shippingStamped: 1.5,
    shippingTracked: 5,
    imageUrl: "",
    notes: "US stamped or tracked.",
    status: "active",
    createdAt: "2026-02-10T15:30:00.000Z"
  },
  {
    id: "seed-nwj-hanni-1",
    sellerId: "demo-user",
    sellerName: "bunnybinder",
    group: "NewJeans",
    title: "Hanni Get Up Weverse album card",
    era: "Get Up",
    condition: "Near Mint",
    price: 9,
    shippingStamped: 1.25,
    shippingTracked: 4.5,
    imageUrl: "",
    notes: "Tiny print line visible under direct light.",
    status: "active",
    createdAt: "2026-02-08T19:15:00.000Z"
  },
  {
    id: "seed-twice-sana-1",
    sellerId: "demo-user",
    sellerName: "onceagain",
    group: "TWICE",
    title: "Sana Ready To Be digipack card",
    era: "Ready To Be",
    condition: "Good",
    price: 7,
    shippingStamped: 1,
    shippingTracked: 4.25,
    imageUrl: "",
    notes: "Small corner nick.",
    status: "active",
    createdAt: "2026-02-04T12:45:00.000Z"
  }
];

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
  if (!localStorage.getItem(KEYS.listings)) {
    write(KEYS.listings, SEED_LISTINGS);
    write(KEYS.schema, true);
    return;
  }

  if (!read(KEYS.schema, false)) {
    const migrated = read(KEYS.listings, []).map((listing) => {
      const { member, subunit, ...bandListing } = listing;
      const titleHasMember = member && normalize(listing.title).includes(normalize(member));
      return {
        ...bandListing,
        title: member && !titleHasMember ? `${member} ${listing.title}` : listing.title
      };
    });
    write(KEYS.listings, migrated);
    write(KEYS.schema, true);
  }
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
  return read(KEYS.cart, []);
}

export function saveCart(cart) {
  write(KEYS.cart, cart);
}
