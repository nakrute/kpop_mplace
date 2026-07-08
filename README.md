# K-Card Market

A browser-only MVP for buying and selling KPop photocards. Users can browse by band, create a local demo account, publish listings, manage a cart, and complete a demo checkout.

## Run locally

```powershell
npm run dev
```

Then open `http://127.0.0.1:4173`.

## Project structure

- `js/store.js` owns localStorage data and migrations.
- `js/cart.js` owns the cart drawer and cart actions.
- `js/app.js` initializes page-specific behavior.
- `js/header.js` renders shared navigation.
- `js/utils.js` contains small DOM and formatting helpers.

This MVP intentionally has no backend. Accounts, listings, and carts remain in the current browser and should not be treated as production data.
