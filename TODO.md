# TornTools - TODO

---

## Feature Backlog

### Core Product Improvements

- **Add page for users' items** - sortable table of inventory; show profit on bazaar/market; link to
  item details and add-items pages ([Trello](https://trello.com/c/6e2Jfkmu))
- **Home page: interesting items table** - the "Top Movers" widget shipped (Most active, Top risers,
  Top fallers over 24h, powered by `item_volatility_stats`). Still open: a richer "interesting
  items" page that cross-references volatility with profitability and bazaar gaps. **Note**: the
  widget's current ranking is unreliable — see the Top Movers redesign below before building
  anything on top of it. ([Trello](https://trello.com/c/hYOe6Kej))
- **Document and display price source** - City vs Item Market vs Weav3r
  ([Trello](https://trello.com/c/GU1LDPMz))
- **Alerts and notifications** - e.g. for rare high-value bargains
  ([Trello](https://trello.com/c/02MvgY6i)). Concrete spec for the bargain-alert variant is below
  under **Bargain alerts (subscription feature)** — has design notes and a ToS blocker.
- **Improve Markets page UI** - clearer than YATA competitors
  ([Trello](https://trello.com/c/VkQsEZOC))
- **Remove deleted keys** - if the API returns an error saying the key no longer exists
  ([Trello](https://trello.com/c/QGYI5sPx))
- **Show all navigation links** - let's have the Bazaar link and the Resale link appear in the
  navigation bar at all times. We can hopefully drive more people to add their keys by letting them
  click on them but them then seeing the warnings about it being locked until the add a key. I think
  we should also lock down any page that uses the Torn market data (City markets, Foreign Markets,
  Resale) for people who haven't added at least a public key.

### Resale Page

- **Drawer conversion** - CityMarkets and ForeignMarkets adopted the shared `FilterDrawer` pattern
  in the UI overhaul; Resale was deferred because its sliders / outlet pair need a tighter layout
  than the drawer currently assumes. Follow-up from the UI overhaul handoff.
- **`PriceWithTax` in `ResaleItemsTableRow`** - City + Foreign tables now render gross + "after tax"
  via the shared primitive; Resale still uses `getSellRevenue()` which returns net, and there's no
  gross counterpart in `ProfitableListing`. Pattern for later: add a `marketPrice` passthrough and
  adapt the revenue cell.
- **Profit per click efficiency metric** - derive a "profit per click" score: baseline 3 clicks per
  listing (+2 per additional line, +2 per unit for non-stacking items). Show as a sortable column
  with a user-configurable minimum profit/click threshold (like the min profit slider). Lets users
  deprioritise high-click-cost deals even when total profit looks attractive. (Jan 25 email, Peter
  Sheppard)
- **Bazaar sell chip** - "Sell at bazaar" profit is not shown because the user sets their own price;
  implement as a calculator modal (see UI/UX: Bazaar sell calculator modal).
- **Price alerts** - alert when an item drops below a given price, even before a profit exists
  (anticipating future profit) ([Trello](https://trello.com/c/wLJqUtW1))
- **Profit source indicator** - show profit from City, Bazaar, and Item Market (with 5%/15% tax +
  risk) as a chip set ([Trello](https://trello.com/c/EfWTmczO))
- **Min/max filters** - change most filters from single value to min/max range
  ([Trello](https://trello.com/c/mhlT5P45))
- **Filter by quantity** ([Trello](https://trello.com/c/hCwp8Kkr))

### Data and Analysis

- **"Item is heating up" volatility trend indicator** - data is now available on
  `item_volatility_stats` (changes_1d, price_change_1d). Needs a UI treatment on item details —
  badge or banner when the item's changes_1d is top-N across the catalogue.
  ([Trello](https://trello.com/c/mtc0N6ab))
- **Global high-volatility items list** - cross-item comparison. The `/api/items/volatility`
  endpoint returns the ranked data; needs a dedicated page (e.g. `/volatility`) with a sortable
  table + slider filters rather than just the Top Movers widget on Home. Worth waiting on the Top
  Movers redesign below so the ranking is honest before we give it a whole page.
  ([Trello](https://trello.com/c/qELgIPtT))
- **Top Movers redesign — Phase 1 + Unusual Activity pivot shipped.** Median-window
  latest/baseline + per-item dispersion + z-scored ranking (V1.21). Trimmed-median baseline + 2-day
  buffer + `|z|>=1.5` threshold. 1h summary buckets (V1.22 + V1.23 reset). Multi-horizon
  unusual-activity card (V1.24 + new `item_unusual_candidates` table; max |z| across 1h/6h/24h/7d vs
  30d trimmed baseline; "why flagged" chips). Most-active card removed (saturation made it
  meaningless).
- **Top Movers — remaining follow-ups** (deferred, all small):
  - **Mode-to-nearest-1%-of-range** as a display metric on item detail pages. Useful for "where
    sellers cluster". Add to `item_unusual_candidates` (or to item details directly via a per-item
    query) when the item-details page next gets attention.
  - **Re-score on home-page load.** Currently the unusual-activity card uses stored values (~6h
    stale at worst). Could grow a "freshen the 1h horizon" join in the controller against the latest
    bucket data. Cheap to add later; not a problem at 1h-bucket cadence.
  - **Volatility-of-volatility signal.** Item whose dispersion has spiked vs its own normal CV is a
    different "unusual" axis than price departure. Could become a fourth dimension in the rebuild
    query and a chip variant ("Volatility ↑ 4σ").
  - **Confidence chips** using stored sample counts so "n=3" rows visually differ from "n=24".
  - **Drop legacy columns** (`current_price`, `price_change_1d`, `price_change_1w`) once nothing
    consumes them as fallbacks. Currently the widget falls through to them; item details may too.
    Audit before dropping.
  - **Ranking threshold tuning.** The risers/fallers card uses `MinAbsMovePct = 0.10m` and
    `MinAbsZScore = 1.5m` in `ItemVolatilityStatsRepository.GetTopAsync`; the unusual card uses
    `DefaultMinScore = 1.5m` in `UnusualController`. If too few items surface in prod, drop toward
    1.0σ; if too noisy, push toward 2.0σ. Each is a one-line constant. Same goes for the per-horizon
    min-sample thresholds (1/3/6/24 buckets) in `RebuildAsync` if any horizon is pruning more than
    expected.
- **Cross-item spike correlation / Torn event-calendar analysis** - Scalpel and Chain Whip
  occasionally spike for reasons that aren't obvious. Hypothesis: some spikes correlate with Torn
  in-game events (e.g. Cannabis on 4/20). Would want cross-item price-movement correlation over time
  windows plus a seeded event calendar. Best as a separate analysis tool (not a page on the site) to
  avoid hammering the production DB. Dependent on "Read-only prod DB access" below.
- **Read-only prod DB access for offline analysis** - needed to do data science without running
  heavy queries against the live site. Options discussed with Drew (hosting choice drives the call):
  read-only Postgres role on the primary (cheapest, but queries hit live DB), read-only role on a
  read replica (better, isolates load), or nightly logical dump into a DuckDB file (cheapest if
  day-stale data is fine, and ideal for ad-hoc exploration).
- **Market Overview follow-ups** - once the "Experimental" chip has earned its removal through
  usage, drop it. Separately, consider adding bazaar scan count as a proxy for supply depth so the
  advice can factor inventory as well as velocity.

### Item Quality

- **Graph: market price vs quality** - scatter chart to identify underpriced outliers; click to go
  to selling page ([Trello](https://trello.com/c/iAIV4uaY))
- **Highlight underpriced high-quality items** on the price/quality graph
  ([Trello](https://trello.com/c/G1CrR8Jq))
- **Estimate reasonable sale price** based on quality curve
  ([Trello](https://trello.com/c/8sAzhtJw))
- **Model typical quality distribution** (Poisson-like) for given items
  ([Trello](https://trello.com/c/4vt8kLTn))

### City Markets Page

- **Use live listing price for market/anon outlets** - City Markets bazaar sell price now uses live
  data via `BazaarSummariesContext`. The market and anonymous market outlets still use
  `value_market_price` (Torn's daily average). Joining the `profitable_listings` view (or a new
  endpoint) would let those outlets also show the real current lowest listing price.

### Item Details Page

- **Add link to a shop** where applicable — still open for items available from a city shop (a
  Storefront chip could link to the correct shop page alongside the existing "Torn market" chip in
  the header). ([Trello](https://trello.com/c/32izh7of))
- **`PriceWithTax` in `InfoCard`** - the info cards still render their own inline after-tax line.
  Could migrate to the shared primitive for consistency; InfoCard's centred layout is different
  enough that the primitive may need a small tweak.

### Foreign Markets

- **Add stock refill times** ([Trello](https://trello.com/c/6RIEi31r))
- **Different flight times by transport mode** - is that overkill?
  ([Trello](https://trello.com/c/4vSsfOrH))
- **Add a city resale filter** (not from Trello) - allow users to filter items they can sell back to
  the city directly (no risk of buy-mugging, no risk of lower prices when they return)

### Selective Scanning and Performance

- **Implement selective Weav3r scanning** - focus on high-profit items only
  ([Trello](https://trello.com/c/4BWpAtBk))
- **Reduce API load** - focus queue on top profitable items only
  ([Trello](https://trello.com/c/N9Pgoh8h))
- **Allow user to restrict scans** to favourite items or categories
  ([Trello](https://trello.com/c/RJMcKi2B))
- **Add configuration options** for scan frequency tuning ([Trello](https://trello.com/c/iK063bgt))

### UI / UX Enhancements

- **Column sorting on `ResaleItemsTable`** - `CityMarketItemsTable`, `ForeignMarketItemsTable`,
  `FavouriteMarketsTable`, and `Weav3rListingTable` are all sortable now. `ResaleItemsTable` is the
  remaining holdout; sort currently lives in `Resale.tsx` so the refactor is trickier than the
  others were.
- **Bazaar sell calculator modal** - on any item row, open a small modal where the user enters their
  intended bazaar price and sees: estimated profit, how it compares to the current cheapest bazaar
  listing, and a likelihood-of-sale indicator based on historical velocity. Deferred from Resale /
  City Markets / Foreign Markets profit chip work.
- **Persist user settings locally** - Resale sliders (min profit, max buy price, max updated time)
  and the purchase/sale outlet toggles now persist to `localStorage` with `:v1` keys. Still open:
  item-type chip selections (CM / FM / AllItems filter drawers), sort preferences on sortable
  tables, favourites default view. ([Trello](https://trello.com/c/FIGyufMq))
- **Add expected time-to-sell estimate** using historical data
  ([Trello](https://trello.com/c/YVhtTymK))
- **Add indicators on Resale page** - slow-moving, volatile, big price change
  ([Trello](https://trello.com/c/w8SFJGGg))
- **Improve Volatility page** readability and clarity ([Trello](https://trello.com/c/33GUdyGa))
- **Add UI improvements for Torn item pages** - sorting, filters, alerts
  ([Trello](https://trello.com/c/bC8kHKvl))
- **Use common icons and tooltips** - shared component for Torn market / Bazaar / Shop links, with
  enum-driven rendering and tooltips ([Trello](https://trello.com/c/bxICmwfU))
- **Wording and grouping** - verb-based section names ("Find Profitable Resells"), one-sentence page
  explainers, group niche features under "Advanced" ([Trello](https://trello.com/c/RnVlN93g))
- **`EmptyState` adoption in `FavouriteMarkets`** - the shared primitive is used on AllItems when
  filters match nothing; FavouriteMarkets still renders an info-alert empty state. Migrate when
  section 6 of the UI overhaul (favourites review) is actioned.
- **Vendor icons + item-type glyphs** (UI overhaul §10) - every Torn vendor has a recognisable
  sprite in-game; adding a small vendor avatar on `CityMarketItemsTableRow` would echo the
  country-flag pattern. Similarly, item-type chip filters would scan faster with a 16px glyph before
  the label. Requires an icon set / asset sourcing decision first.
- **Sparkline width on wider screens** - the 80×28px default in `PriceSparkline` reads well on the
  Bazaar Price Lookup page but may be tight on 1440p+. Bump if it's hard to read.

---

## Bargain alerts

**Drew-only v1 — build complete (M1–M8); verification + prod latency check pending**.

Plan + status at `context/plans/2026-04-25-bargain-alerts.md`; synthetic-test SQL at
`context/plans/2026-04-25-bargain-alerts-verification.sql`. Threshold is single-unit profit > $5,000
(`valueSellPrice - listing_price > 5_000`), markets only, authorised via single-element config list
of player IDs (`appsettings.json` → `BargainAlertsConfiguration.AuthorisedPlayerIds`, seeded with
3943900). Detection hooks `DatabaseService.ProcessListingsAsync`; snipe-loop is a priority-hook in
`QueueProcessorBase` that `TornMarketsProcessor` overrides to interleave hot items with the normal
queue (bounded by `MaxInterleaves`, default 50). Endpoints at
`/api/alerts/{authorised,active,{id}/dismiss}`, gated to authorised player IDs. Frontend toast at
top-right via `<BargainAlertToast/>` mounted in `Layout`; provider is `BargainAlertsProvider` in
`main.tsx`; visibility-aware 12s polling; Web Audio synthesised two-tone chirp on first sighting of
each alert (Drew can swap for an MP3 in `client/public/sounds/`). Side-steps the ToS issue below by
not exchanging anything for anything.

Next: apply V1.25 migration (auto on next backend boot), run synthetic verification per the SQL
file, then a real-world latency check.

### Subscription extension (deferred — needs ToS sign-off)

**BLOCKED on Torn staff sign-off — do not extend to subscribers without it.**

### The feature

Toast notification when an item appears on the Torn market (and possibly bazaars later) for <10% of
the city sell value. Persistent until dismissed or tab-closed; shows a "time since listed" counter;
plays a distinctive sound so a backgrounded tab is still useful. Click-through deep-links to the
listing.

Subscriber model: free for Drew, free for anyone who's sent Drew Xanax in-game in the last 30 days
(rolling window). Tracked automatically by polling Drew's events feed for "You were sent some Xanax
from X" lines.

### ToS blocker — must resolve first

A separate analysis (Claude.ai, 2026-04-25) flagged two Torn rules that this feature touches:

1. **RMT clause** on Torn's rule violations page: "exchange of currency or assets on Torn for
   real-world money or services". Gating an external-tool feature behind in-game item payment is a
   strict-reading violation. Sellers historically permabanned without first-offence warning; buyers
   banned + items removed. Staff actively investigate externally hosted services.
2. **API ToS** on torn.com/api.html: explicitly invites operators to **contact staff** if they want
   to advertise, accept donations, or charge for usage. Doesn't carve out item-based payments, so
   safest assumption is item-gated subscriptions fall under "charging for usage" and need the same
   approval.

**Required action before any implementation work**: email webmaster@torn.com (or the staff contact
linked from the API page) describing the feature, the Xanax-gated subscription model, and asking
explicitly if it's permitted. The API ToS invites this conversation in writing — staff are generally
reasonable with established tool authors who ask first, and brutal with people who ship and hope.
Get the "yes" in your inbox before writing any code.

Sanity-check first: see whether TornStats / TornPDA paid tiers accept in-game items or are
real-money only. That tells us what staff have actually waved through in practice and informs the
email.

Risk-tiered design fallbacks if staff say no to item-gating:

- **Voluntary tips, no gating**: feature free for all users; an "If you found this useful, you can
  send Xanax to dangerworm" footer. Strictly the RMT clause's "or services" wording is still
  ambient, but loads of tools accept tips informally. Lowest-temperature variant.
- **Real-money subscription** via Stripe/etc., with staff approval. Higher friction but
  unambiguously inside the ToS framework once approved.
- **Free for everyone** — the feature is the reward, supports the rest of the tool.

### Design notes (for when/if it's unblocked)

API access verified 2026-04-25:

- Custom key created via deep-link
  `https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=...&user=events`. Key info
  confirms `access.type: "Custom"`, `selections.user: ["profile", "timestamp", "lookup", "events"]`,
  all other categories at default. `basic` and `bazaar` selections correctly return error code 16 —
  properly scoped.
- The events feed includes the gift signal:
  `"You were sent some Xanax from <a ... XID=NNN>NAME</a>"` with unix timestamp + stable per-event
  ID like `yGtGSLLG0qOzXsO3eN4v`.
- Bonus: same feed contains `"NAME bought N x ITEM from your bazaar for $PRICE"` events — a future
  "your bazaar just sold" toast comes for free from the same poll.

API quirk to encode in our client: Torn sometimes returns the _response schema_ literal (e.g.
`event: string[144]`) instead of populated data. Adding `&comment=tornttools-<feature>` to the query
reliably switches it to real data. The `comment` also surfaces in `/key/log` so we can grep
TornTools traffic. **Backend client should always send a `comment`.**

Implementation sketch:

- **Server config**: store the custom Drew-events key alongside the existing
  `TORN_KEY_ENCRYPTION_KEY_V1` pattern — encrypted at rest, KV-vault-backed, rotatable. New env var
  (name TBD).
- **Hangfire job**: poll
  `https://api.torn.com/user/?selections=events&comment=tornttools-events&key=<key>` every N
  minutes. Parse for `^You were sent some Xanax from <a [^>]+XID=(\d+)>([^<]+)</a>$`. Snapshot the
  regex in a unit test so it screams when Torn rewords.
- **Subscriber ledger table**:
  `(event_id PK, sender_xid, sender_name, gift_timestamp, recorded_at)`. Append-only.
  Active-subscriber set = `SELECT DISTINCT sender_xid WHERE gift_timestamp > now() - 30 days`.
  Persist locally because Torn's events feed is finite (~recent N entries) — a lapsed subscriber
  whose gift falls off the feed should still count for the 30-day window.
- **Bargain detection**: a separate Hangfire job or hook on the existing `TornMarketsProcessor` that
  flags listings where `listing_price < 0.1 * value_market_price`. Drop into a `bargain_alerts`
  table with `(item_id, listing_id, listing_price, market_value, found_at, expires_at, status)`.
- **Snipe-loop poll** (Drew's idea): when a bargain is active, `TornMarketsProcessor` interleaves
  re-polls of that item with normal queue progression — `[item, next, item, next, …]` — until the
  listing disappears, then transitions the alert to "expired/sold" and updates the toast. **Bound
  the loop**: max N consecutive interleaved polls per item before forced fallback to normal order
  (avoids starving the queue if someone keeps relisting cheap, or if a market glitch persists).
  Constants TBD; suggest N=30 (~5 min at current cadence) as a starting point.
- **Push transport (v1)**: short-interval browser polling on `/api/alerts/pending` returning the
  authenticated user's currently-active bargains. SignalR/WebSockets/SSE deferred until usage proves
  the feature is worth new infra.
- **Toast UI**: persistent (no auto-dismiss), live "time since listed" counter, distinct sound
  (asset choice TBD), click-through to the Torn listing URL, transitions to "Too late!" variant when
  the backend marks the alert expired.
- **Latency budget to validate**: item listed → next scan picks it up → backend evaluates threshold
  → next browser poll picks it up → toast renders → human reacts → click. Worth measuring end-to-end
  before committing — if best-case is 30s+, the feature ships disappointment because <10%-of-value
  listings get sniped in seconds. Snipe-loop only helps after detection; initial detection latency
  is still bounded by current `TornMarketsProcessor` cadence.

Bazaars deferred from v1: we can't poll them directly (they're scraped via Weav3r at lower cadence),
so detection latency would be hopeless. Markets-only for v1.

### Bonus: deep-link key creation pattern

`https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=<TITLE>&<category>=<csv>` is a
pre-fill deep-link into the Torn API prefs page. Useful UX for any future feature where TornTools
asks subscribers to grant a narrow permission — render an "Authorise TornTools" button instead of
"go to prefs → tick these boxes". File under nav/sign-in UX for later.

---

## Security

### API key encryption — shipped

Phase 1 (at-rest AES-GCM encryption), Phase 2 (server-side Torn proxy, key purged from browser), and
Phase 3 (drop plaintext column + dead code) are all in. Only the encrypted column exists; the
browser never holds a Torn API key after sign-in.

Remaining items that aren't blockers:

- `UserContext.tsx` has a legacy-localStorage cleanup that removes pre-Phase-2 keys on mount. Safe
  to remove once enough real time has passed that no returning user still has the stale cache. No
  rush.
- `UserDto.ApiKey` is a write-only-by-convention field (write paths populate it; read paths leave it
  empty). A cleaner split into read/write DTOs would remove the asymmetry.

### Key management (reference)

- Source of truth: GitHub secret `TORN_KEY_ENCRYPTION_KEY_V1`. Also mirrored in
  `infra/terraform.dev.tfvars` as `torn_key_encryption_key_v1` for local runs, and in the KV vault
  as `torn-key-encryption-v1` (backup / rotation tooling).
- The KV vault has `purge_protection_enabled = true` — this cannot be turned off.
- Rotation workflow: add `TORN_KEY_ENCRYPTION_KEY_V2` GitHub secret + `torn_key_encryption_key_v2`
  variable + `azurerm_key_vault_secret "torn_key_encryption_v2"` resource +
  `TornKeyEncryption__Keys__2` app_setting. Bump `torn_key_encryption_current_version` to `"2"`. Old
  rows stay decryptable via v1 until a re-encryption pass promotes them. Retire v1 once every row is
  v2-encrypted.

---

## Code Quality

### Route `[controller]/[action]` on `ApiController`

**File:** `api/TornTools.Api/Controllers/ApiController.cs:9`

Produces RPC-style URLs like `/api/GetItems`, `/api/PostToggleUserFavourite`. Method names are
coupled to routes. A conventional REST design (`GET /api/items`, `POST /api/users/{id}/favourites`)
would be more cacheable and easier to evolve.

### Project-local `.venv` for Python dependencies

**File:** `api/TornTools.Api/Weav3rPython/`

`bazaar_server.py` requires `curl_cffi` (`impersonate="chrome124"` is necessary for Weav3r anti-bot;
no .NET equivalent exists). Missing-dep log-spam was worked around on Drew's machine by
`pip install --user`, which violates the global Python-env-hygiene rule. Fix properly by giving the
Weav3r Python component its own `.venv` with a committed `requirements.txt`, following the pattern
in `~/.claude/rules/python-env.md`. The deployed artefact already uses PyInstaller so only local dev
needs this.

---

## Architecture & Design

### No tests

No test project in the solution, no test files in the client. `build-code.yml` just builds -
regressions can only be caught manually.

### Single `IDatabaseService` does everything

**File:** `api/TornTools.Application/Interfaces/IDatabaseService.cs`

~30+ methods covering items, listings, queue, API keys, users, favourites, themes, change logs, and
summaries - a God Object. Natural seams for splitting:

| Service               | Owns                                                     |
| --------------------- | -------------------------------------------------------- |
| `IItemService`        | Items CRUD, listings, profitable listings, foreign stock |
| `IItemHistoryService` | Change logs, summaries, price/velocity history           |
| `IQueueService`       | Queue CRUD, queue population, `Build*QueueItem` helpers  |
| `IUserService`        | Users, API keys, themes, favourites                      |

Start with `IQueueService` - it has the most real logic and the private builder helpers belong there
naturally. The rest can follow in one pass. All controllers and `ApiJobScheduler` will need
re-injection.

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
Analysis backlog above) is the right fix - pre-compute snapshots rather than querying raw history on
demand.

---

## Minor / Cosmetic

- `SameSite=None` on the auth cookie requires `Secure=true` (which is set), but means the cookie
  won't work over plain HTTP - no local dev without HTTPS or a proxy.
- `torn-war-checker.html` in the repo root appears to be an unrelated standalone utility.
