# TornTools — TODO

---

## Feature Backlog

### Core Product Improvements

- **Add page for users' items** — sortable table of inventory; show profit on bazaar/market; link to
  item details and add-items pages ([Trello](https://trello.com/c/6e2Jfkmu))
- **Home page: interesting items table** — high volatility, rising average price, etc. _Blocked:
  requires Hangfire price/volatility job_ ([Trello](https://trello.com/c/hYOe6Kej))
- **Add stale-data warning** — surface a warning when the backend hasn't updated recently
  ([Trello](https://trello.com/c/WIhkHBt0))
- **Document and display price source** — City vs Item Market vs Weav3r
  ([Trello](https://trello.com/c/GU1LDPMz))
- **Alerts and notifications** — e.g. for rare high-value bargains
  ([Trello](https://trello.com/c/02MvgY6i))
- **Improve Markets page UI** — clearer than YATA competitors
  ([Trello](https://trello.com/c/VkQsEZOC))
- **Persist slider values between page loads** — min profit, price range, etc.; also
  purchase/sale outlet selections and all other per-page option toggles, so the user's
  last-used settings are restored on return. ([Trello](https://trello.com/c/96CIJE0B))
- **Remove deleted keys** — if the API returns an error saying the key no longer exists
  ([Trello](https://trello.com/c/QGYI5sPx))
- **Add armour** — add armour as a tracked item type ([Trello](https://trello.com/c/PRmX5Ped))

### Resale Page

- **Bazaar sell chip** — "Sell at bazaar" profit is not shown because the user sets their own
  price; implement as a calculator modal (see UI/UX: Bazaar sell calculator modal).
- **Price alerts** — alert when an item drops below a given price, even before a profit exists
  (anticipating future profit) ([Trello](https://trello.com/c/wLJqUtW1))
- **Profit source indicator** — show profit from City, Bazaar, and Item Market (with 5%/15% tax +
  risk) as a chip set ([Trello](https://trello.com/c/EfWTmczO))
- **Min/max filters** — change most filters from single value to min/max range
  ([Trello](https://trello.com/c/mhlT5P45))
- **Filter by quantity** ([Trello](https://trello.com/c/hCwp8Kkr))
- **Filter out weapons-only markets** — where you can only buy in bulk
  ([Trello](https://trello.com/c/vcbymt73))

### Data and Analysis

- **Hangfire job: price and volatility data** — daily/twice-daily job storing per-market change
  counts and price deltas over 1 day/1 week. Schema: `item_id`, `market_changes_1_day … N_days`,
  `price_change_1_day … N_days`. Enables slider-driven filtering by volatility/price change.
  Unblocks home page and several indicators. ([Trello](https://trello.com/c/dahdcJHy))
- **"Item is heating up" volatility trend indicator** ([Trello](https://trello.com/c/mtc0N6ab))
- **Global high-volatility items list** — cross-item comparison
  ([Trello](https://trello.com/c/qELgIPtT))
- **Include armour data across the stack** — DB, API, and frontend
  ([Trello](https://trello.com/c/ZV5xipM0))

### Item Quality

- **Graph: market price vs quality** — scatter chart to identify underpriced outliers; click to go
  to selling page ([Trello](https://trello.com/c/iAIV4uaY))
- **Highlight underpriced high-quality items** on the price/quality graph
  ([Trello](https://trello.com/c/G1CrR8Jq))
- **Estimate reasonable sale price** based on quality curve
  ([Trello](https://trello.com/c/8sAzhtJw))
- **Model typical quality distribution** (Poisson-like) for given items
  ([Trello](https://trello.com/c/4vt8kLTn))

### City Markets Page

- **Use live listing price instead of Torn average** — City Markets currently uses `value_market_price`
  (Torn's daily average) for both the market and bazaar sell price columns. The `Item` type does not
  carry live bazaar price data (only `ProfitableListing` does), so both outlets share the same
  reference price. Joining the `profitable_listings` view (or a new endpoint) would let it show the
  real current lowest listing/bazaar price, matching the Resale page.

### Item Details Page

- **Add link to market and shop** where applicable ([Trello](https://trello.com/c/32izh7of))
- **Rename "City Buy Price"** to "Buy Price" and add the country in which to buy
  ([Trello](https://trello.com/c/fLk2OwZP))

### Foreign Markets

- **Profit chips (City / Market 5% / Anon 15%)** — currently shows profit with no fee applied at
  all; replace the single Profit column with three chips using the same `getSellRevenue` logic as
  the Resale page. Add a sale outlet toggle for sort/filter.
- **"Show profitable items only" checkbox** — same as the City Markets page already has; filter
  out rows where no sell outlet produces a positive profit given the current sale outlet selection.
- **Single ungrouped table option** — checkbox/toggle to collapse all country sub-tables into one
  flat table with an additional Country column, so users can sort across all countries at once.
  Consolidates the existing "See all products in all countries" Trello item.
  ([Trello](https://trello.com/c/IX5d3Suy))
- **Column sorting** — the table currently has no sortable headers; add `TableSortCell` + `stableSort`
  across all columns (Item, Type, Country, Buy Price, Market Price, Profit, Available, Last Updated).
  Most valuable when the ungrouped table option is active.
- **Don't show out of stock** ([Trello](https://trello.com/c/jEhH3v6x))
- **Add stock refill times** ([Trello](https://trello.com/c/6RIEi31r))
- **Different flight times by transport mode** — is that overkill?
  ([Trello](https://trello.com/c/4vSsfOrH))

### Selective Scanning and Performance

- **Implement selective Weav3r scanning** — focus on high-profit items only
  ([Trello](https://trello.com/c/4BWpAtBk))
- **Reduce API load** — focus queue on top profitable items only
  ([Trello](https://trello.com/c/N9Pgoh8h))
- **Allow user to restrict scans** to favourite items or categories
  ([Trello](https://trello.com/c/RJMcKi2B))
- **Add configuration options** for scan frequency tuning ([Trello](https://trello.com/c/iK063bgt))

### UI / UX Enhancements

- **Consistent search box width** — search fields are currently full-width on some pages and
  half-width on others; standardise to a single shared behaviour across all tables and pages.
- **Column sorting on all tables** — `CityMarketItemsTable` is fully sortable; `ForeignMarketItemsTable`,
  `ResaleItemsTable`, `FavouriteMarketsTable`, and `Weav3rListingTable` have no sortable headers.
  `ResaleItemsTable` is the trickiest since sort currently lives in `Resale.tsx`; the others are
  straightforward — define a sort key type, add state + `stableSort`, swap plain `TableCell`
  headers for `TableSortCell`.
- **Bazaar sell calculator modal** — on any item row, open a small modal where the user enters
  their intended bazaar price and sees: estimated profit, how it compares to the current cheapest
  bazaar listing, and a likelihood-of-sale indicator based on historical velocity. Deferred from
  Resale / City Markets / Foreign Markets profit chip work.
- **Persist user settings locally** — sliders, filters, favourites
  ([Trello](https://trello.com/c/FIGyufMq))
- **Add expected time-to-sell estimate** using historical data
  ([Trello](https://trello.com/c/YVhtTymK))
- **Add indicators on Resale page** — slow-moving, volatile, big price change
  ([Trello](https://trello.com/c/w8SFJGGg))
- **Improve Volatility page** readability and clarity ([Trello](https://trello.com/c/33GUdyGa))
- **Add UI improvements for Torn item pages** — sorting, filters, alerts
  ([Trello](https://trello.com/c/bC8kHKvl))
- **Use common icons and tooltips** — shared component for Torn market / Bazaar / Shop links, with
  enum-driven rendering and tooltips ([Trello](https://trello.com/c/bxICmwfU))
- **Wording and grouping** — verb-based section names ("Find Profitable Resells"), one-sentence page
  explainers, group niche features under "Advanced" ([Trello](https://trello.com/c/RnVlN93g))
- **Update site description** — candidate: "Tools for serious Torn traders: find arbitrage, track
  volatility, and squeeze more profit out of weapons, armour, and bazaar pricing."
  ([Trello](https://trello.com/c/4QTLy4dG))

---

## Bugs

### Market price chart sometimes hides Y-axis values

**File:** client (chart component) ([Trello](https://trello.com/c/fxFTT2gN))

---

## Security

### API keys stored in plaintext

**File:** `api/TornTools.Persistence/Entities/` (UserEntity)

User Torn API keys are stored unencrypted in the `users` table. If the database is compromised, all
keys are exposed — and these keys grant access to players' Torn accounts, not just this app.
Consider encrypting at rest via Azure Key Vault (already in the infra).

### Frontend exposes API key in browser

**File:** `client/src/lib/tornapi.ts`, `client/src/contexts/UserContext.tsx`

The Torn API key is stored in `localStorage` and sent directly from the browser to `api.torn.com`.
This is necessary for the sign-in preview flow, but the key is visible to browser devtools and any
JS on the page. A server-side proxy for key validation would prevent exposure.

---

## Code Quality

### `LoginInputModel` is missing validation attributes

**File:** `api/TornTools.Core/Models/InputModels/`

Input models have no `[Required]`, `[StringLength]`, or other data annotation validators. A null
`ApiKey` would reach the Torn API call and produce a confusing downstream error rather than a
clean 400.

### Catch blocks swallow errors silently in the frontend API layer

**File:** `client/src/lib/dotnetapi.ts` (multiple functions)

```ts
try {
  data = await res.json();
} catch {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
```

If the response is HTTP 200 but the body is not valid JSON (e.g. empty body, HTML error page), the
catch runs, `!res.ok` is false, and the function silently returns an empty default. Wrong
content-type responses are invisible.

### Route `[controller]/[action]` on `ApiController`

**File:** `api/TornTools.Api/Controllers/ApiController.cs:9`

Produces RPC-style URLs like `/api/GetItems`, `/api/PostToggleUserFavourite`. Method names are
coupled to routes. A conventional REST design (`GET /api/items`, `POST /api/users/{id}/favourites`)
would be more cacheable and easier to evolve.

---

## Architecture & Design

### No tests

No test project in the solution, no test files in the client. `build-code.yml` just builds —
regressions can only be caught manually.

### Single `IDatabaseService` does everything

**File:** `api/TornTools.Application/Interfaces/IDatabaseService.cs`

~30+ methods covering items, listings, queue, API keys, users, favourites, themes, change logs,
and summaries — a God Object. Natural seams for splitting:

| Service | Owns |
|---|---|
| `IItemService` | Items CRUD, listings, profitable listings, foreign stock |
| `IItemHistoryService` | Change logs, summaries, price/velocity history |
| `IQueueService` | Queue CRUD, queue population, `Build*QueueItem` helpers |
| `IUserService` | Users, API keys, themes, favourites |

Start with `IQueueService` — it has the most real logic and the private builder helpers belong
there naturally. The rest can follow in one pass. All controllers and `ApiJobScheduler` will need
re-injection.

### `QueueProcessor` is single-threaded

**File:** `api/TornTools.Cron/`

The queue is processed serially. Horizontal scaling (multiple App Service instances) would cause
duplicate processing — there's no distributed lock or claim-based ownership. Worth noting before
scaling.

### `profitable_listings` is a plain view, not a materialised view

Re-runs the full aggregation join on every request to `/api/GetProfitableListings`. For a table with
high listing churn, this could become expensive under load. A scheduled Hangfire refresh would help.

### `localStorage` cache versioning is manual with no enforcement

Cache keys use `:v1` suffixes. If the shape of cached data changes, the version must be bumped
manually. Consider a cache-busting strategy tied to the app version.

### No loading state on initial item catalogue fetch

If `ItemsContext` hasn't loaded (first visit or expired cache), pages that depend on `items` may
render empty tables with no clear loading indicator. Each page handles this inconsistently.

---

## Optimisation

### `GetAllItemsAsync` returns the full catalogue on every fetch

**File:** `client/src/lib/dotnetapi.ts:58`

No pagination, filtering, or `ETag`/`Last-Modified` support. The 1-hour frontend cache mitigates
this, but unchanged data is still fully transferred on cache miss.

### Listings replaced wholesale on each scan

The `ReplaceListings` pattern deletes and re-inserts all listings for an item on each scan. For
high-frequency items this creates significant write amplification. An upsert-by-position/price
approach would reduce I/O and preserve history better.

### `market_velocity` view aggregates all change logs with no date filter

Will become increasingly slow as `item_change_logs` grows. The Hangfire volatility job (see Data and
Analysis backlog above) is the right fix — pre-compute snapshots rather than querying raw history on
demand.

---

## Minor / Cosmetic

- The `*` catch-all route renders a bare `<h1>Not Found</h1>` with no layout or styling.
- `menuItems` config is checked inside `Resale.tsx` to determine if login is required — business
  logic in a display component. Should live in a hook or route guard.
- `SameSite=None` on the auth cookie requires `Secure=true` (which is set), but means the cookie
  won't work over plain HTTP — no local dev without HTTPS or a proxy.
- `torn-war-checker.html` in the repo root appears to be an unrelated standalone utility.
