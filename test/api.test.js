import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { createApp } = require("../server/app.cjs");

async function withServer(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "kcard-api-"));
  const server = createApp({ root: path.resolve("."), dataFile: path.join(directory, "store.json") });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function signup(baseUrl, email = "seller@example.com") {
  const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName: "Collector", email, password: "secure-password" })
  });
  assert.equal(response.status, 201);
  return response.headers.get("set-cookie").split(";")[0];
}

test("health endpoint reports the API version", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/v1/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok", service: "k-card-market", version: 1 });
}));

test("creates and persists a validated listing", () => withServer(async (baseUrl) => {
  const cookie = await signup(baseUrl);
  const createResponse = await fetch(`${baseUrl}/api/v1/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      sellerId: "seller-1",
      sellerName: "Collector",
      group: "TWICE",
      member: "Sana",
      title: "Album card",
      condition: "Near Mint",
      price: 12
    })
  });
  assert.equal(createResponse.status, 201);
  const { listing } = await createResponse.json();
  assert.ok(listing.id);

  const listResponse = await fetch(`${baseUrl}/api/v1/listings`);
  assert.deepEqual((await listResponse.json()).listings.map((item) => item.id), [listing.id]);
}));

test("derives buy-request seller and total from the stored listing", () => withServer(async (baseUrl) => {
  const sellerCookie = await signup(baseUrl);
  const listingResponse = await fetch(`${baseUrl}/api/v1/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: sellerCookie },
    body: JSON.stringify({ sellerId: "real-seller", sellerName: "Seller", group: "IVE", member: "Yujin", title: "POB", price: 15 })
  });
  const { listing } = await listingResponse.json();

  const buyerCookie = await signup(baseUrl, "buyer@example.com");
  const requestResponse = await fetch(`${baseUrl}/api/v1/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: buyerCookie },
    body: JSON.stringify({ listingId: listing.id, sellerId: "spoofed", total: 1, buyerName: "Buyer", buyerEmail: "buyer@example.com" })
  });
  assert.equal(requestResponse.status, 201);
  const { request } = await requestResponse.json();
  assert.equal(request.sellerId, listing.sellerId);
  assert.equal(request.total, 15);
}));

test("rejects unauthenticated listing writes", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/v1/listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ group: "IVE", member: "Yujin", title: "POB", price: 15 })
  });
  assert.equal(response.status, 401);
}));

test("does not expose password hashes through the user API", () => withServer(async (baseUrl) => {
  await signup(baseUrl);
  const response = await fetch(`${baseUrl}/api/v1/users`);
  const { users } = await response.json();
  assert.equal(users.length, 1);
  assert.equal("passwordHash" in users[0], false);
  assert.equal("passwordSalt" in users[0], false);
  assert.equal("email" in users[0], false);
}));
