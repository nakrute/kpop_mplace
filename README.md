# K-Card Market

A backend-backed MVP for buying and selling KPop photocards. Accounts, seller profiles, listings, and buy requests use the versioned server API. Only the temporary request cart remains in the current browser.

## Run locally

```powershell
npm run dev
```

Then open `http://127.0.0.1:4173`.

## Quality checks

```powershell
npm run check
npm test
```

The check script validates JavaScript syntax and verifies that local page links and asset references resolve. The tests cover the localStorage data layer and its migration behavior.

## Project structure

- `js/store.js` is the browser API client and owns the local cart.
- `server/app.cjs` owns HTTP routes, authentication, and authorization.
- `server/database.cjs` owns persistent server-side data writes.
- `js/cart.js` owns the cart drawer and cart actions.
- `js/app.js` initializes page-specific behavior.
- `js/header.js` renders shared navigation.
- `js/utils.js` contains small DOM and formatting helpers.

## Backend API

The development server includes a dependency-free Node API with persistent JSON storage. See [`BACKEND.md`](BACKEND.md) for routes, configuration, and the production migration plan.

Passwords are hashed with Node's `scrypt`, and authentication uses HTTP-only, same-site session cookies. See the production checklist before deploying publicly.
