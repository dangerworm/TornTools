# Session Handoff — 2026-04-23 / 24

Long session in three distinct phases. All work landed on branches, `ui/new-design` and
`feat/todo-data-signals`. The first has been merged into `main` and `development`; the second is
rebased on top of the merged dev and pushed to origin, awaiting merge.

---

## Phase 1 — `ui/new-design` (merged)

Branch has been merged to `main` and `development` on origin. Started from the plan at
`context/plans/2026-04-23-ui-ux-overhaul.md`, which was a thorough UI/UX review written before the
session. **27 commits.** Headline changes:

- **Sidebar regrouped** (Markets / Utilities / You), persistent brass "Sign in" button when
  signed out, alphabetised Utilities (All Items → Time), settings promoted out of avatar menu.
- **Typography**: IBM Plex Sans body, JetBrains Mono `tabular` variant, Passero One display,
  subtle grain overlay on body.
- **Shared primitives** created: `LoginRequired` (tool + requiredLevel; folded BPL's bespoke
  access-level upgrade guard in), `SectionHeader`, `StatChip` (profit/loss/neutral/experimental/
  tradable/status variants), `EmptyState`, `PriceWithTax`, `MarketToolbar`, `FilterDrawer`,
  `LazySparkline`, `LazyLatestMarketPrice`.
- **FilterDrawer**: persistent right-hand panel on md+, FAB + temporary drawer on sm, collapsible
  with a 900ms width animation, state persisted. Active-filter count on badge. City/Foreign/All
  Items all mount through it. Search field is first control; "All" chips toggle between all-on
  and all-off for the "select everything but X" workflow.
- **Markets**: City + Foreign rewired with the drawer and MarketToolbar; profit chips migrated to
  `StatChip`; hearts are brass (primary.main) everywhere; `PriceWithTax` renders gross headline +
  "$X after N% tax" on a single line (nowrap). "Show profitable" and "Hide out of stock" default
  OFF. Foreign country flags shrunk to 2.5em so all 11 fit with the drawer open; "Order by flight
  time" moved under the flags.
- **Favourites + All Items** both grew paired (latest, trend) columns per source —
  Bazaar (latest) + Bazaar trend + Market (latest) + Market trend. Sparklines lazy-load via
  IntersectionObserver and fade in over 2s.
- **Item details**: `useItemMarketAdvice` lifted into the page (one fetch shared with info cards
  and market overview); "Market Price (latest)" promoted to the headline with "N mins ago · daily
  avg $X" beneath; profit-chip rule documented inline + with a legend.
- **History source filter**: threaded a `Source` enum through the item-history SQL (raw + summary
  query) and endpoints. The `?source=Torn|Weav3r` param defaults to Torn. Client hooks
  (`useItemPriceHistory`, `useItemVelocityHistory`) carry the source; the Prices Over Time chart
  on Item Details overlays Torn (market) + Weav3r (bazaar) lines on shared axes.
- **Chart**: refactored to take `series[]` + controlled `timeWindow`; dynamic y-axis gutter sized
  to the longest tick label (fixes `$` clipping on expensive items); bar chart padded so the
  leftmost bar no longer covers the y-axis.
- **Chip stability**: MUI filled vs outlined chips rendered 2px apart because of
  `.MuiChip-label` padding differences (8px vs 7px). Equalised via theme override — toggling no
  longer shifts wrap points.
- **Codex PR reviewer** flagged two real bugs after merge was in progress: P1 (sign-in
  in-flight state never resets after failure — confirmApiKeyAsync swallows errors) and P2 (Settings
  redirecting before `getMe()` resolves, bouncing users with a valid session cookie but cleared
  localStorage). Both fixed by adding a `sessionChecking` flag to `UserContext` and driving the
  sign-in disabled state from `loadingDotNetUserDetails` with an intent-tracking ref rather than
  local in-flight state.

Plan and handoff notes from within the session are preserved at:

- `context/plans/2026-04-23-ui-ux-overhaul.md` (original plan)
- `context/plans/2026-04-23-ui-ux-overhaul-handoff.md` (mid-session handoff)

---

## Phase 2 — `feat/todo-data-signals` (merged into development)

Branched from `development` when `ui/new-design` was still outstanding. After the UI branch landed,
rebased onto the updated `development`, then merged. Tip of `origin/development` is `fd41075`.
**5 commits** on top of dev:

- `e01f8a5` — TODO cleanup: removed 8 items explicitly marked "done".
- `91262ad` — Stale-data banner + non-bulk Resale filter + Buy Price (country) rename.
- `3f45d19` — Hangfire volatility job. Adds:
  - Flyway `V1.18__item_volatility_stats.sql` (table + partial indexes for each sort key).
  - `ItemVolatilityStatsEntity` + DTO + `IItemVolatilityStatsRepository` with a single-query
    UPSERT rebuild (three `DISTINCT ON` price snapshots: latest, 1d-ago, 1w-ago, joined to a
    windowed count aggregation) plus a typed `GetTopAsync`.
  - Recurring Hangfire job at 30m past every 6h (offset from SummariseChangeLogs so it runs
    against fresh buckets).
  - `GET /api/items/volatility?source=&sort=&limit=&ascending=` endpoint.
  - Frontend: `useItemVolatility` hook, `TopMovers` home-page widget (Most active, Top risers,
    Top fallers over 24h).
- `9a8d97c` — TODO sweep for the three shipped items; noted what the volatility job unblocks.
- `fd41075` — Resale non-bulk checkbox onto its own row with a more descriptive label (was
  awkwardly floating mid-row before).

Rebase conflicts resolved during Phase 3 — mostly discarding the pre-drawer filter blocks in
CityMarkets/ForeignMarkets that the feat commit had been editing against old dev, keeping the
drawer layout and dropping the `StaleDataBanner` at the top of `mainContent`. Orthogonal things
(DatabaseService backend signatures, dotnetapi.ts) merged cleanly.

---

## Phase 3 — merge + rebase + reviewer fixes

Drew did the `ui/new-design → main → development` merge himself. I rebased `feat/todo-data-signals`
onto the updated dev and resolved conflicts.

**Backend restart needed** to pick up Flyway V1.18 and register the new Hangfire job. First
`RebuildVolatilityStats` run populates the table; after that the Home page's Top Movers widget
has something to render. Manual trigger available at `/hangfire` if Drew doesn't want to wait.

---

## Current state

| Branch                        | Where it sits                                                         |
| ----------------------------- | --------------------------------------------------------------------- |
| `main`                        | `ui/new-design` merged. Up to date with origin.                       |
| `development`                 | `ui/new-design` + `feat/todo-data-signals` both merged; tip `fd41075`.|
| `feat/todo-data-signals`      | Merged; safe to delete locally when you're done with it.              |

Local uncommitted state: context/* handoff files (this file and its siblings).

Build state:

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (6.78s, 500kB chunk warning is pre-existing).
- `dotnet build` — clean when the dev API isn't running (file-locks aside).
- Dev Vite server and .NET API still running on `localhost:5173` / `https://localhost:7012`.

---

## Blockers / outstanding

- Backend needs a restart to apply V1.18 and register the volatility job (if it hasn't already
  been restarted since the merge). The run-time log-spam bug from the missing `curl_cffi` is
  fixed for Drew's machine (system `pip install`) but the project-local `.venv` pattern to fix
  that properly remains a follow-up.
- **Top Movers widget shows unreliable data** — see the "Top Movers review" section below for
  the diagnosis and proposed redesign. The job runs and the widget populates, but many of the
  listed movers are outliers or reversions rather than durable moves.
- Some UI items deliberately deferred:
  - Vendor icons / item-type glyphs (section 10 of the UI plan).
  - Resale page drawer conversion.
  - A few `StatChip` migrations in market table rows (hearts are brass; the OOS/N-A chips in
    ResaleItemsTableRow and ForeignMarketItemsTableRow still use raw `Chip`).
  - Favourites seed + observe / screenshots — actually DONE mid-session.

---

## Next action

- Top Movers redesign — see the section below. Likely first-session scope: **(1) + (2)** from
  the proposal together, i.e. median-window latest/baseline with a minimum sample count, plus a
  stored per-item volatility measure used to z-score the ranked move. That alone fixes the
  Ski Mask / Scalpel / Edomondo / Rope artifacts and lays the table structure for the rest.
- Small parallel win: add a "View on Torn market" link on the item details page — Drew flagged
  this as missing while reviewing the widget. Not dependent on the redesign.
- Parked for later (Drew has context; don't action without asking):
  - Read-only prod DB access for offline data analysis. Options discussed: read-only Postgres
    role on a replica, or nightly logical dump into DuckDB. Hosting shape drives the choice.
  - Cross-item spike correlation analysis (is-this-a-Torn-event-day?). Separate analytics
    tool, not a page on the site.
- Follow-ups already noted in `TODO.md`:
  - "Item is heating up" UI badge (data now available — but will become more honest after the
    redesign above, so probably worth waiting).
  - Dedicated `/volatility` page with sliders (endpoint now available; same caveat).

---

## Top Movers review (2026-04-24)

Drew reviewed the widget after it had run a few times and flagged that the data isn't reliable
enough to be honest to users. I read the job and confirmed every artifact is explainable from
the current rebuild logic.

### What the job actually does today

`ItemVolatilityStatsRepository.RebuildStatsAsync` runs a single `DISTINCT ON` query across
`item_change_log_summaries`:

- **`current_price`** = average price of the *single most-recent* bucket per (item, source).
- **"1d-ago price"** = average of the *single most-recent bucket* with `bucket_start <= NOW() - 1d`.
- **`price_change_1d`** = `(current − 1d_ago) / 1d_ago`, fractional.
- **`changes_1d` / `changes_1w`** = raw count of change rows in the respective window.
- **No dispersion / stability measure is stored.** The table name is aspirational; nothing it
  stores measures volatility.

### Observed artifacts (prod, Apr 24)

- **Ski Mask shown as "−92% fall, latest $800M"**: one $10B listing pulled the latest bucket's
  average up, then the next bucket reverts. The "−92%" compares two adjacent bucket means, one
  still inflated by the outlier. `current_price` is the inflated mean.
- **Scalpel "+211.7% riser, $450"** and **Rope "+105%"**: genuine intraday spikes that have
  already reverted by the time the widget renders. Ranking compares mid-spike vs pre-spike.
- **Edomondo Localé "−65.5% fall"**: reversion *from* its own recent spike — the 1d-ago bucket
  sits on the peak, the latest bucket is post-crash.
- **Pillow / Slingshot / Plastic Sword / Fine Chisel appear repeatedly**: naturally
  high-variance low-priced items. They swing 2–3× daily without any news; the ranking treats
  that intrinsic noise as signal.
- **"Most active: 353 chg" on all 5 items**: the polling ceiling. With 29 active API keys the
  job can observe at most ~113 changes/6h for a single item, so any item whose true change
  rate exceeds that saturates and the ranking past the ceiling is arbitrary.

### Proposed changes, priority order

1. **Robust window estimators.** Replace single-bucket `latest` and `baseline` with median
   (or trimmed mean) over explicit windows (e.g. latest = last 6–24h, baseline = last 30d
   excluding the last day). Require a minimum sample count in each window; exclude items
   that don't meet it. Kills all three outlier-driven artifacts in one go.
2. **Z-scored movement.** Store a per-item dispersion measure (MAD of log returns, or CV of
   daily medians, over ~30d). Rank Top Risers/Fallers on `(current − baseline) / dispersion`,
   not raw %. Fine Chisel moving 50% scores ~1σ; S&W M29 moving 170% scores ~5σ. This is the
   "Pillow is always moving" filter.
3. **Volatility bucket + separate surfacing.** Classify items stable/medium/high. Either
   exclude high-volatility items from the main Top cards and give them their own "Usually
   volatile, moving outside their range" card (preferred), or add a chip next to volatile
   rows so users know to discount.
4. **Fix the "Most active" ceiling.** Short term: show a saturation chip ("≥ ceiling/24h —
   under-sampled") instead of the raw number when `changes_1d` hits the ceiling, and rank
   saturated items by a secondary key (circulation or volatility). Medium term: measure
   activity differently (distinct prices observed per hour, or distinct 5-minute buckets
   with any change) so saturation is less likely.
5. **Confidence surfacing on the widget.** Sample count, range chip, or a "why this is
   listed" tooltip per row.
6. **Item details page**: add a "View on Torn market" link. Drew noticed this is missing.

### Recommended first session

**(1) + (2) together.** Change the `item_volatility_stats` rebuild to compute median-based
latest/baseline over explicit windows with min-sample filtering, and add a dispersion column
computed over ~30d. Rank the widget on z-scored move. Around 80% of the user-visible
weirdness goes away, and the schema is set up to support (3) without another migration.
Ideally the rebuild also records the sample counts used for latest/baseline so (5) can be
added cheaply later.

### Notes

- "Volatile" is the correct term of art — dispersion of returns — not a misuse. Use it.
- Don't pre-optimise (3)/(4)/(5) before we can see how (1)+(2) behaves in isolation.
- The stored `current_price` today isn't safe as a display value either. After (1), the
  widget's displayed price should be the window median, not the single most recent bucket mean.
- Part of the motivation for (1) specifically is *honesty*: a "Top riser" that's already back
  to baseline by the time it's shown is worse than nothing. A window-median approach only
  flags moves that have persisted long enough to matter.
