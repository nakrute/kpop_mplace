import assert from "node:assert/strict";
import test from "node:test";

class MemoryStorage {
  #values = new Map();

  getItem(key) {
    return this.#values.has(key) ? this.#values.get(key) : null;
  }

  setItem(key, value) {
    this.#values.set(key, String(value));
  }

  removeItem(key) {
    this.#values.delete(key);
  }

  clear() {
    this.#values.clear();
  }
}

globalThis.localStorage = new MemoryStorage();
const store = await import("../js/store.js");

test.beforeEach(() => localStorage.clear());

test("initializes the demo data", () => {
  store.initializeStore();
  assert.equal(store.getUsers().length, 4);
  assert.equal(store.getListings().length, 4);
  assert.deepEqual(store.getRequests(), []);
});

test("does not overwrite existing users when listings are missing", () => {
  const user = { id: "local-user", email: "collector@example.com", displayName: "collector" };
  store.saveUsers([user]);

  store.initializeStore();

  assert.equal(store.getUsers().some((candidate) => candidate.id === user.id), true);
  assert.equal(store.getListings().length, 4);
});

test("normalizes the cart to one line per one-of-a-kind listing", () => {
  store.saveCart([
    { id: "card-1", qty: 3 },
    { id: "card-1", qty: 1 },
    { id: "card-2", qty: 0 },
    { id: "card-3", qty: 1 }
  ]);

  assert.deepEqual(store.getCart(), [
    { id: "card-1", qty: 1 },
    { id: "card-3", qty: 1 }
  ]);
});
