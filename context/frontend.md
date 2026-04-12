# Frontend Navigation

## Routes (`client/src/App.tsx`)

| Path               | Component          | Notes                             |
| ------------------ | ------------------ | --------------------------------- |
| `/`                | `Home`             | Dashboard placeholder             |
| `/signin`          | `SignIn`           | API key entry + confirmation flow |
| `/settings`        | `UserSettings`     | Theme selection, account settings |
| `/favourites`      | `FavouriteMarkets` | User's bookmarked items           |
| `/markets`         | `Markets`          | Hub/nav for market sub-pages      |
| `/city-markets`    | `CityMarkets`      | Torn City NPC vendor markets      |
| `/foreign-markets` | `ForeignMarkets`   | Foreign country stock (Yata data) |
| `/item/:itemId`    | `ItemDetails`      | Price history charts, item stats  |
| `/resale`          | `Resale`           | Profitable resale opportunities   |
| `/time`            | `Time`             | In-game clock / time utilities    |

All routes share `<Layout>` (nav drawer + footer). The `*` catch-all renders a bare
`<h1>Not Found</h1>` — no styled 404 page.

---

## Global State (`client/src/contexts/`)

Three React Context providers, each with a matching hook in `hooks/`.

### UserContext / `useUser`

File: `contexts/UserContext.tsx`, `hooks/useUser.ts`

State:

- `apiKey` — Torn API key (restored from localStorage on mount)
- `tornUserProfile` — fetched directly from Torn API (name, level, gender, id)
- `dotNetUserDetails` — fetched from backend on login or `getMe()` (includes `favouriteItems[]`,
  `preferredThemeId`)

Loading/error pairs for both async paths.

Key methods:

- `setApiKey(key)` — saves to localStorage, triggers `fetchTornProfileAsync`
- `confirmApiKeyAsync()` — POSTs to `/auth/login`, sets `dotNetUserDetails`
- `toggleFavouriteItemAsync(itemId)` — optimistically resolves from local set, then calls backend
- `logoutAsync()` — calls `/auth/logout`, clears all state + localStorage

Cache: localStorage, 24h TTL (`torntools:user:*:v1` keys). On mount: `getMe()` always fires to
restore JWT session; localStorage restores `apiKey` + `tornProfile` only if within TTL.

### ItemsContext / `useItems`

File: `contexts/ItemsContext.tsx`, `hooks/useItems.ts`

State: `itemsById` (map), `items` (sorted array), `loading`, `error` Source: `GET /api/GetItems`
Cache: localStorage, 1h TTL. Exposes `refresh()` to force re-fetch.

### ThemeContext / `useThemeSettings`

File: `contexts/ThemeContext.tsx`, `hooks/useThemeSettings.ts`

State: `availableThemes`, `selectedThemeId`, `currentTheme` Methods: `selectTheme(id)`,
`saveTheme(definition)`, `refreshThemes()` Built-in themes: Default Light, Default Dark (no user
ID). MUI theme created dynamically via `createTheme` from the active `ThemeDefinition`.

---

## API Layer (`client/src/lib/`)

### `dotnetapi.ts`

All backend calls. Uses `credentials: "include"` for cookie auth. Error pattern:
`try { data = await res.json() } catch { if (!res.ok) throw }` — silently returns empty on non-JSON
success responses.

Key functions: `login`, `getMe`, `logout`, `fetchItems`, `fetchForeignStockItems`,
`fetchProfitableListings`, `fetchItemPriceHistory`, `fetchItemVelocityHistory`,
`postAddUserFavourite`, `postRemoveUserFavourite`, `fetchThemes`, `postThemeDefinition`,
`postUserThemeSelection`.

Auth URL stripping: `/auth/*` endpoints strip `/api` suffix from `API_BASE_URL` via regex replace.

### `tornapi.ts`

Direct Torn API calls (used in SignIn flow and ForeignMarkets): `fetchTornKeyInfo(key, signal)`,
`fetchTornUserDetails(key, signal)`

### `weav3rapi.ts`

Weav3r API calls from the frontend (if any — distinct from backend Weav3r caller).

### Utilities

- `cache.ts` — localStorage cache helpers (get/set with TTL)
- `countries.ts` — country code ↔ name map
- `comparisons.ts` — item sort/comparison helpers
- `textFormat.ts` — price formatting, display helpers
- `time.ts` — in-game time calculations
- `error.ts` — error normalisation

---

## Key Pages

### Resale (`pages/Resale.tsx`)

- Polls `fetchProfitableListings` every 5 seconds via `useResaleScan` hook
- Filters by: min profit, max buy price, max time since last update (stepped sliders)
- Options: sale outlet (city / market), tax type (5% / 15%)
- Login guard: checks `menuItems` config + `dotNetUserDetails`; shows explanation if unauthenticated
- Sorting: by `cityProfit` or `marketProfit(taxType)` depending on sale outlet
- Bug: `rows.sort()` mutates the array in `useMemo` (sort is not pure)

### ItemDetails (`pages/ItemDetails.tsx`)

- Reads `:itemId` from URL params
- Loads price + velocity history with configurable time window
- Displays weapon/armor stats, descriptions, info cards
- Profitability calculation done client-side

### ForeignMarkets (`pages/ForeignMarkets.tsx`)

- Uses `apiKey` from UserContext directly to call Torn API (no login required)
- Fetches foreign stock from backend

---

## Components of Note

### SteppedSlider (`components/SteppedSlider.tsx`)

Custom slider using a discrete array of values (not linear range). Used in Resale for price/time
filters.

### Chart (`components/Chart.tsx`)

Recharts wrapper for price/velocity history. The Y-axis hiding bug (backlog card) is likely here.

### AutoBuyScriptDialog (`components/AutoBuyScriptDialog.tsx`)

Generates a script for bulk purchasing — useful for power users.

### ResaleItemsTable / CityMarketItemsTable / ForeignMarketItemsTable

Each has a paired `*Row` component. Tables handle filtering and display; rows handle per-item
rendering.

---

## TypeScript Types (`client/src/types/`)

| File                    | Key types                                                               |
| ----------------------- | ----------------------------------------------------------------------- |
| `items.ts`              | `Item` (full item with stats), `ItemsMap`                               |
| `foreignStockItems.ts`  | `ForeignStockItem`                                                      |
| `profitableListings.ts` | `ProfitableListing` (includes `cityProfit`, `marketProfit(tax)` method) |
| `history.ts`            | `HistoryResult`, `HistoryWindow`                                        |
| `themes.ts`             | `ThemeDefinition`, `ThemeInput`                                         |
| `markets.ts`            | `SaleOutlet`, `TaxType`                                                 |
| `common.ts`             | `saleOutletOptions`, `taxTypeOptions`                                   |

---

## Build & Dev

- Vite 7 dev server proxies `/api` and `/auth` to backend
- `tsconfig.json` — strict mode on
- ESLint 9 + Prettier 3
- No test suite currently
