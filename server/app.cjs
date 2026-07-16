const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { randomBytes, randomUUID, scrypt: scryptCallback, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const { createDatabase } = require("./database.cjs");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png"
};
const listingStatuses = new Set(["active", "paused", "reserved", "sold"]);
const requestStatuses = new Set(["pending", "accepted", "declined", "completed"]);
const scrypt = promisify(scryptCallback);
const sessions = new Map();

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
}

function publicProfile(user) {
  const { email, ...profile } = publicUser(user);
  return profile;
}

async function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = await scrypt(password, salt, 64);
  return { passwordSalt: salt, passwordHash: Buffer.from(hash).toString("hex") };
}

async function passwordMatches(password, user) {
  if (!user?.passwordHash || !user?.passwordSalt) return false;
  const actual = Buffer.from(await scrypt(password, user.passwordSalt, 64));
  const expected = Buffer.from(user.passwordHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function cookieValue(request, name) {
  const cookies = String(request.headers.cookie || "").split(";");
  for (const cookie of cookies) {
    const [key, ...parts] = cookie.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
}

function sessionUser(request, database) {
  const session = sessions.get(cookieValue(request, "kcard_session"));
  if (!session || session.expiresAt < Date.now()) return null;
  return database.read().users.find((user) => user.id === session.userId) || null;
}

function beginSession(response, user) {
  const token = randomBytes(32).toString("base64url");
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  response.setHeader("Set-Cookie", `kcard_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800`);
}

function requireUser(request, response, database) {
  const user = sessionUser(request, database);
  if (!user) sendJson(response, 401, { error: "Authentication required." });
  return user;
}

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

function cleanText(value, maximum) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function validateListing(input, existing = {}) {
  const listing = {
    ...existing,
    sellerId: cleanText(input.sellerId ?? existing.sellerId, 100),
    sellerName: cleanText(input.sellerName ?? existing.sellerName, 80),
    group: cleanText(input.group ?? existing.group, 40),
    member: cleanText(input.member ?? existing.member, 40),
    title: cleanText(input.title ?? existing.title, 80),
    era: cleanText(input.era ?? existing.era, 80),
    condition: cleanText(input.condition ?? existing.condition, 40),
    imageUrl: cleanText(input.imageUrl ?? existing.imageUrl, 500_000),
    notes: cleanText(input.notes ?? existing.notes, 240),
    price: Number(input.price ?? existing.price),
    status: cleanText(input.status ?? existing.status ?? "active", 20)
  };
  if (!listing.sellerId || !listing.group || !listing.member || !listing.title) {
    return { error: "sellerId, group, member, and title are required." };
  }
  if (!Number.isFinite(listing.price) || listing.price <= 0 || listing.price > 100_000) {
    return { error: "price must be greater than 0 and no more than 100000." };
  }
  if (!listingStatuses.has(listing.status)) return { error: "status is invalid." };
  return { value: listing };
}

function validateRequest(input) {
  const request = {
    listingId: cleanText(input.listingId, 100),
    buyerId: cleanText(input.buyerId, 100),
    buyerName: cleanText(input.buyerName, 80),
    buyerEmail: cleanText(input.buyerEmail, 254).toLowerCase(),
    buyerAddress: cleanText(input.buyerAddress, 500),
    buyerMessage: cleanText(input.buyerMessage, 500),
    qty: 1,
    status: "pending"
  };
  if (!request.listingId || !request.buyerName || !/^\S+@\S+\.\S+$/.test(request.buyerEmail)) {
    return { error: "listingId, buyerName, and a valid buyerEmail are required." };
  }
  return { value: request };
}

function createApp({ root, dataFile }) {
  const database = createDatabase(dataFile);

  return http.createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Referrer-Policy", "same-origin");

    let url;
    try {
      url = new URL(request.url, "http://localhost");
      if (url.pathname === "/api/v1/auth/signup" && request.method === "POST") {
        const input = await readJson(request);
        const email = cleanText(input.email, 254).toLowerCase();
        const displayName = cleanText(input.displayName, 80);
        const password = typeof input.password === "string" ? input.password : "";
        if (!/^\S+@\S+\.\S+$/.test(email) || !displayName || password.length < 8 || password.length > 200) {
          return sendJson(response, 422, { error: "Display name, a valid email, and a password of at least 8 characters are required." });
        }
        if (database.read().users.some((user) => user.email === email)) return sendJson(response, 409, { error: "That email already has an account." });
        const credentials = await hashPassword(password);
        const user = { id: randomUUID(), email, displayName, location: "", bio: "", packaging: "", joinedAt: new Date().toISOString(), ...credentials };
        database.update((data) => data.users.push(user));
        beginSession(response, user);
        sendJson(response, 201, { user: publicUser(user) });
        return;
      }

      if (url.pathname === "/api/v1/auth/login" && request.method === "POST") {
        const input = await readJson(request);
        const email = cleanText(input.email, 254).toLowerCase();
        const user = database.read().users.find((candidate) => candidate.email === email);
        if (!await passwordMatches(typeof input.password === "string" ? input.password : "", user)) {
          return sendJson(response, 401, { error: "Email or password is incorrect." });
        }
        beginSession(response, user);
        sendJson(response, 200, { user: publicUser(user) });
        return;
      }

      if (url.pathname === "/api/v1/auth/logout" && request.method === "POST") {
        sessions.delete(cookieValue(request, "kcard_session"));
        response.setHeader("Set-Cookie", "kcard_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
        sendJson(response, 200, { ok: true });
        return;
      }

      if (url.pathname === "/api/v1/auth/me" && request.method === "GET") {
        sendJson(response, 200, { user: publicUser(sessionUser(request, database)) });
        return;
      }

      if (url.pathname === "/api/v1/profile" && request.method === "PATCH") {
        const user = requireUser(request, response, database);
        if (!user) return;
        const input = await readJson(request);
        database.update((data) => {
          const stored = data.users.find((candidate) => candidate.id === user.id);
          stored.displayName = cleanText(input.displayName ?? stored.displayName, 80) || stored.displayName;
          stored.location = cleanText(input.location ?? stored.location, 100);
          stored.bio = cleanText(input.bio ?? stored.bio, 500);
          stored.packaging = cleanText(input.packaging ?? stored.packaging, 500);
        });
        sendJson(response, 200, { user: publicUser(database.read().users.find((candidate) => candidate.id === user.id)) });
        return;
      }

      if (url.pathname === "/api/v1/users" && request.method === "GET") {
        sendJson(response, 200, { users: database.read().users.map(publicProfile) });
        return;
      }

    } catch (error) {
      sendJson(response, error.status || 500, { error: error.status ? error.message : "Internal server error." });
      return;
    }

    const segments = url.pathname.split("/").filter(Boolean);
    try {
      if (url.pathname === "/api/v1/health" && request.method === "GET") {
        sendJson(response, 200, { status: "ok", service: "k-card-market", version: 1 });
        return;
      }

      if (url.pathname === "/api/v1/listings" && request.method === "GET") {
        const includeInactive = url.searchParams.get("includeInactive") === "true";
        const user = sessionUser(request, database);
        const listings = database.read().listings.filter((listing) => listing.status === "active" || (includeInactive && listing.sellerId === user?.id));
        sendJson(response, 200, { listings });
        return;
      }

      if (url.pathname === "/api/v1/listings" && request.method === "POST") {
        const user = requireUser(request, response, database);
        if (!user) return;
        const result = validateListing({ ...await readJson(request), sellerId: user.id, sellerName: user.displayName });
        if (result.error) return sendJson(response, 422, { error: result.error });
        const listing = { ...result.value, id: randomUUID(), createdAt: new Date().toISOString() };
        database.update((data) => data.listings.unshift(listing));
        sendJson(response, 201, { listing });
        return;
      }

      if (segments.length === 4 && segments.slice(0, 3).join("/") === "api/v1/listings") {
        const id = decodeURIComponent(segments[3]);
        if (request.method === "GET") {
          const listing = database.read().listings.find((item) => item.id === id);
          return listing ? sendJson(response, 200, { listing }) : sendJson(response, 404, { error: "Listing not found." });
        }
        if (request.method === "PATCH") {
          const user = requireUser(request, response, database);
          if (!user) return;
          const input = await readJson(request);
          let updated;
          let validationError;
          database.update((data) => {
            const index = data.listings.findIndex((item) => item.id === id);
            if (index < 0) return;
            if (data.listings[index].sellerId !== user.id) {
              validationError = "You do not own this listing.";
              return;
            }
            const result = validateListing({ ...input, sellerId: user.id, sellerName: user.displayName }, data.listings[index]);
            if (result.error) validationError = result.error;
            else updated = data.listings[index] = { ...result.value, id, createdAt: data.listings[index].createdAt, updatedAt: new Date().toISOString() };
          });
          if (validationError) return sendJson(response, 422, { error: validationError });
          return updated ? sendJson(response, 200, { listing: updated }) : sendJson(response, 404, { error: "Listing not found." });
        }
        if (request.method === "DELETE") {
          const user = requireUser(request, response, database);
          if (!user) return;
          let removed = false;
          database.update((data) => {
            const index = data.listings.findIndex((item) => item.id === id && item.sellerId === user.id);
            if (index >= 0) { data.listings.splice(index, 1); removed = true; }
          });
          return removed ? sendJson(response, 200, { ok: true }) : sendJson(response, 404, { error: "Listing not found." });
        }
      }

      if (url.pathname === "/api/v1/requests" && request.method === "GET") {
        const user = requireUser(request, response, database);
        if (!user) return;
        const requests = database.read().requests.filter((item) => item.sellerId === user.id || item.buyerId === user.id);
        sendJson(response, 200, { requests });
        return;
      }

      if (url.pathname === "/api/v1/requests" && request.method === "POST") {
        const user = requireUser(request, response, database);
        if (!user) return;
        const result = validateRequest({ ...await readJson(request), buyerId: user.id, buyerName: user.displayName, buyerEmail: user.email });
        if (result.error) return sendJson(response, 422, { error: result.error });
        const listing = database.read().listings.find((item) => item.id === result.value.listingId && item.status === "active");
        if (!listing) return sendJson(response, 409, { error: "Listing is unavailable." });
        if (listing.sellerId === user.id) return sendJson(response, 409, { error: "You cannot request your own listing." });
        const buyRequest = {
          ...result.value,
          id: randomUUID(),
          listingName: [listing.group, listing.member, listing.title].filter(Boolean).join(" - "),
          sellerId: listing.sellerId,
          sellerName: listing.sellerName,
          total: listing.price,
          createdAt: new Date().toISOString()
        };
        database.update((data) => data.requests.unshift(buyRequest));
        sendJson(response, 201, { request: buyRequest });
        return;
      }

      if (segments.length === 5 && segments.slice(0, 3).join("/") === "api/v1/requests" && segments[4] === "status" && request.method === "PATCH") {
        const user = requireUser(request, response, database);
        if (!user) return;
        const id = decodeURIComponent(segments[3]);
        const { status } = await readJson(request);
        if (!requestStatuses.has(status)) return sendJson(response, 422, { error: "status is invalid." });
        let updated;
        database.update((data) => {
          const buyRequest = data.requests.find((item) => item.id === id);
          if (!buyRequest) return;
          if (buyRequest.sellerId !== user.id) return;
          buyRequest.status = status;
          buyRequest.updatedAt = new Date().toISOString();
          updated = buyRequest;
          const listing = data.listings.find((item) => item.id === buyRequest.listingId);
          if (listing && status === "accepted") listing.status = "reserved";
          if (listing && status === "completed") listing.status = "sold";
        });
        return updated ? sendJson(response, 200, { request: updated }) : sendJson(response, 404, { error: "Request not found." });
      }

      if (url.pathname.startsWith("/api/")) {
        sendJson(response, 404, { error: "API route not found." });
        return;
      }

      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        sendJson(response, 400, { error: "Invalid URL encoding." });
        return;
      }
      const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
      const filePath = path.resolve(root, relativePath);
      if (!filePath.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      fs.readFile(filePath, (error, data) => {
        if (error) return response.writeHead(404).end("Not found");
        response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
        response.end(request.method === "HEAD" ? undefined : data);
      });
    } catch (error) {
      console.error(error);
      sendJson(response, error.status || 500, { error: error.status ? error.message : "Internal server error." });
    }
  });
}

module.exports = { createApp };
