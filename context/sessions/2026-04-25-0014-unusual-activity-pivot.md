# Session Handoff — 2026-04-23 / 24

Long session in three distinct phases. All work landed on branches, `ui/new-design` and
`feat/todo-data-signals`. The first has been merged into `main` and `development`; the second is
rebased on top of the merged dev and pushed to origin, awaiting merge.

---

## 2026-04-24 end-of-session summary (read first)

**All of the following is on `development` (= `main` once Drew releases the final tweaks).**

Shipped in chronological order:

- `e5df589` — TODO quick-wins sweep (Torn market link, sortable tables, login refactor, polish).
- `b19421c` — API key security Phase 1+2 (at-rest AES-GCM + browser proxy).
- `11cb3fd` + `90f0234` — Phase 3 cleanup: drop plaintext `api_key` column, delete `tornapi.ts`;
  Codex P1 fixes (unreadable-ciphertext graceful fall-through, V1.20 self-gating guard).
- `fefe466` — handoff refresh.
- `7d6844c` — **Top Movers Phase 1**: median-window latest/baseline, per-item dispersion (CV of
  daily medians), z-scored ranking, new columns in V1.21, widget rewired.
- `75d52e8` — Codex P2 fix: sign-gated the z-score sort so risers are strictly positive and fallers
  strictly negative.
- `629049e` — SQL fix: `percentile_cont` returns `double precision`, so cast to numeric before
  `ROUND(x, n)` (the first deploy failed with
  `function round(double precision, integer) does not exist`).

Top Movers Phase 1 then went to prod. Drew eyeballed it against real item charts. Conclusions: 5/5
risers looked genuinely unusual (Horse's Head, Raw Ivory, Insulin, Lubricant, Samurai Sword). 2/5
fallers were borderline (Cocktail Ring, Psycho Clown Mask — both under the 10% move floor anyway).
1/5 fallers (DSLR Camera) showed the post-spike reversion failure mode: the spike from 3-4 days ago
was still inside the 30d baseline, pulling it up, so the current reverted price reads as a "fall".
Same shape as the original Edomondo Localé problem.

### Uncommitted tweaks from end-of-session

One local commit pending, currently just files in the working tree — Drew to commit + deploy:

1. **Trimmed-median baseline** — drop the top 10% and bottom 10% of bucket averages from the
   baseline window before taking the median (via `percentile_cont(0.10/0.90)` as bounds). Makes a
   single multi-day spike inside the baseline window less influential.
2. **2-day baseline buffer** — baseline is now `NOW-30d` to `NOW-3d` (was `NOW-1d`). Fresh spikes
   take 2 extra days to rotate into the baseline.
3. **z-threshold raise** — `MinAbsZScore` bumped from `1.0` to `1.5`. Tightens the filter on
   borderline "statistical noise" ranks.

All three are in `ItemVolatilityStatsRepository.cs` only. Files to commit: that file + the TODO.md
edits. Build clean.

**Honest caveat**: validating against Drew's data export (see `data-exports/`), these tweaks don't
fully fix the DSLR-Camera-style reversion — the spike lasted multiple days, so a 10% trim + 2-day
buffer aren't aggressive enough. Going further (longer baseline, heavier trim) would start excluding
items with less history. Accepting this limitation is the right move because the intended next piece
of work (see below) reframes the whole card around "unusual activity" rather than "who rose/fell",
which makes the reversion signal legitimate rather than misleading.

### Unusual Activity pivot — shipped

Pivoted the Top Movers widget from "who went up / down" to "markets departing from their normal
trends". With ~29 keys and 6-hour polling we can't reliably identify "the top N movers" — we
*can* identify items whose recent behaviour is statistically unusual, because the departures are
large relative to dispersion even with sparse data. Honest framing about what the data supports.

What landed:

- **Flyway V1.22** — summary buckets resized 6h → 1h (clean truncate + repopulate from raw
  change logs). Unlocks intraday resolution for multi-horizon analysis.
- **Flyway V1.23** — Codex P1 follow-up; truncates `item_volatility_stats` so V1.22 + V1.23
  do an atomic cutover (both source and derived tables empty, both rebuild from scratch).
- **Flyway V1.24** — new `item_unusual_candidates` table. One row per `(item_id, source)`
  with the multi-horizon stats flattened across columns. Partial index on
  `(source, unusualness_score DESC)` for the ranking query.
- **`ItemUnusualCandidatesRepository.RebuildAsync`** — single SQL pass. Trimmed-median
  baseline (10/90 percentile bounds, NOW-30d to NOW-1d, min 10 buckets); CV of daily medians
  for dispersion (min 14 days). Per-horizon (1h / 6h / 24h / 7d) median + sample count + move
  + z-score with min-sample thresholds 1/3/6/24 buckets. Derived `unusualness_score = max(|z|)`,
  `dominant_horizon`, `direction`. UPSERT.
- **Hangfire `RebuildUnusualCandidates`** — runs at minute 45 past every 6h, after the
  summariser (minute 0) and the volatility rebuild (minute 30) so they don't compete.
- **`GET /api/items/unusual?source=&limit=&minScore=`** — returns DTOs ordered by
  `unusualness_score DESC`. Default minScore 1.5σ, limit 15.
- **Widget rewrite** — three cards now: Top risers, Top fallers, Unusual activity. Most-active
  card removed (saturation made it useless per Drew's call). Unusual rows show name + a
  server-formatted "↑ 3.4σ in last 24h vs month" string + the dominant-horizon's window price.

Deferred to follow-ups (see TODO.md): re-score on home-page load, mode-to-bucket display on item
detail pages, volatility-of-volatility signal, confidence chips, dropping legacy
`current_price` / `price_change_1d` / `price_change_1w` columns.

### Two open design questions from the end of this session

1. **SQL-in-C# vs stored procedures.** My recommendation: keep in C#. One committer, app deploy is
   cheap, versioned SQL with the app is easier to review. Only pivot to SPs if non-app consumers
   need the logic or the SQL starts needing its own test harness. If individual queries (like the
   volatility rebuild) grow much larger, worth moving to embedded `.sql` resources for syntax
   highlighting / pgAdmin testing — but not SPs.
2. **Shrink `item_change_log_summaries` bucket from 6h to 1h (or 3h)?** Strongly yes, 1h is the
   right target for the pivot. The multi-horizon z-score needs genuine intraday resolution — at 6h
   buckets the "1h" and "6h" windows both collapse to "last bucket". Cost: ~6× the row count (~10M
   rows/year instead of ~1.6M, still fine), and the summariser job runs proportionally. Migration
   gotcha: either rebuild from raw `item_change_logs` (requires that data going back 30d+), run both
   bucket sizes in parallel during a cutover, or accept some coarser historical data. Worth planning
   carefully. 3h buckets are a compromise that doesn't fully unlock intraday detection.

### Deferred (still open, see TODO.md)

- Top Movers review slices (3) volatility-bucket separation, (4) Most active saturation chip, (5)
  confidence chips — the pivot above subsumes most of (3) and (5); (4) stands alone.
- Drop legacy `current_price` / `price_change_1d` / `price_change_1w` columns after the pivot.
- Data analysis tools / read-only prod DB access — still parked.

---

## Historical — original session narrative preserved below

---

## Phase 1 — `ui/new-design` (merged)

Branch has been merged to `main` and `development` on origin. Started from the plan at
`context/plans/2026-04-23-ui-ux-overhaul.md`, which was a thorough UI/UX review written before the
session. **27 commits.** Headline changes:

- **Sidebar regrouped** (Markets / Utilities / You), persistent brass "Sign in" button when signed
  out, alphabetised Utilities (All Items → Time), settings promoted out of avatar menu.
- **Typography**: IBM Plex Sans body, JetBrains Mono `tabular` variant, Passero One display, subtle
  grain overlay on body.
- **Shared primitives** created: `LoginRequired` (tool + requiredLevel; folded BPL's bespoke
  access-level upgrade guard in), `SectionHeader`, `StatChip` (profit/loss/neutral/experimental/
  tradable/status variants), `EmptyState`, `PriceWithTax`, `MarketToolbar`, `FilterDrawer`,
  `LazySparkline`, `LazyLatestMarketPrice`.
- **FilterDrawer**: persistent right-hand panel on md+, FAB + temporary drawer on sm, collapsible
  with a 900ms width animation, state persisted. Active-filter count on badge. City/Foreign/All
  Items all mount through it. Search field is first control; "All" chips toggle between all-on and
  all-off for the "select everything but X" workflow.
- **Markets**: City + Foreign rewired with the drawer and MarketToolbar; profit chips migrated to
  `StatChip`; hearts are brass (primary.main) everywhere; `PriceWithTax` renders gross headline +
  "$X after N% tax" on a single line (nowrap). "Show profitable" and "Hide out of stock" default
  OFF. Foreign country flags shrunk to 2.5em so all 11 fit with the drawer open; "Order by flight
  time" moved under the flags.
- **Favourites + All Items** both grew paired (latest, trend) columns per source — Bazaar (latest) +
  Bazaar trend + Market (latest) + Market trend. Sparklines lazy-load via IntersectionObserver and
  fade in over 2s.
- **Item details**: `useItemMarketAdvice` lifted into the page (one fetch shared with info cards and
  market overview); "Market Price (latest)" promoted to the headline with "N mins ago · daily avg
  $X" beneath; profit-chip rule documented inline + with a legend.
- **History source filter**: threaded a `Source` enum through the item-history SQL (raw + summary
  query) and endpoints. The `?source=Torn|Weav3r` param defaults to Torn. Client hooks
  (`useItemPriceHistory`, `useItemVelocityHistory`) carry the source; the Prices Over Time chart on
  Item Details overlays Torn (market) + Weav3r (bazaar) lines on shared axes.
- **Chart**: refactored to take `series[]` + controlled `timeWindow`; dynamic y-axis gutter sized to
  the longest tick label (fixes `$` clipping on expensive items); bar chart padded so the leftmost
  bar no longer covers the y-axis.
- **Chip stability**: MUI filled vs outlined chips rendered 2px apart because of `.MuiChip-label`
  padding differences (8px vs 7px). Equalised via theme override — toggling no longer shifts wrap
  points.
- **Codex PR reviewer** flagged two real bugs after merge was in progress: P1 (sign-in in-flight
  state never resets after failure — confirmApiKeyAsync swallows errors) and P2 (Settings
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
rebased onto the updated `development`, then merged. Tip of `origin/development` is `fd41075`. **5
commits** on top of dev:

- `e01f8a5` — TODO cleanup: removed 8 items explicitly marked "done".
- `91262ad` — Stale-data banner + non-bulk Resale filter + Buy Price (country) rename.
- `3f45d19` — Hangfire volatility job. Adds:
  - Flyway `V1.18__item_volatility_stats.sql` (table + partial indexes for each sort key).
  - `ItemVolatilityStatsEntity` + DTO + `IItemVolatilityStatsRepository` with a single-query UPSERT
    rebuild (three `DISTINCT ON` price snapshots: latest, 1d-ago, 1w-ago, joined to a windowed count
    aggregation) plus a typed `GetTopAsync`.
  - Recurring Hangfire job at 30m past every 6h (offset from SummariseChangeLogs so it runs against
    fresh buckets).
  - `GET /api/items/volatility?source=&sort=&limit=&ascending=` endpoint.
  - Frontend: `useItemVolatility` hook, `TopMovers` home-page widget (Most active, Top risers, Top
    fallers over 24h).
- `9a8d97c` — TODO sweep for the three shipped items; noted what the volatility job unblocks.
- `fd41075` — Resale non-bulk checkbox onto its own row with a more descriptive label (was awkwardly
  floating mid-row before).

Rebase conflicts resolved during Phase 3 — mostly discarding the pre-drawer filter blocks in
CityMarkets/ForeignMarkets that the feat commit had been editing against old dev, keeping the drawer
layout and dropping the `StaleDataBanner` at the top of `mainContent`. Orthogonal things
(DatabaseService backend signatures, dotnetapi.ts) merged cleanly.

---

## Phase 3 — merge + rebase + reviewer fixes

Drew did the `ui/new-design → main → development` merge himself. I rebased `feat/todo-data-signals`
onto the updated dev and resolved conflicts.

**Backend restart needed** to pick up Flyway V1.18 and register the new Hangfire job. First
`RebuildVolatilityStats` run populates the table; after that the Home page's Top Movers widget has
something to render. Manual trigger available at `/hangfire` if Drew doesn't want to wait.

---

## Current state

| Branch                         | Where it sits                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`                         | All work from this session shipped: UI overhaul, feat/todo-data-signals, TODO quick-wins, API key security Phase 1+2+3. Up to date with origin. |
| `development`                  | Same as main. Tip is `90f0234` (Codex P1 fix on phase 3 cleanup).                                                                               |
| `feat/todo-data-signals`       | Merged; safe to delete locally.                                                                                                                 |
| `chore/drop-plaintext-api-key` | Merged; safe to delete locally.                                                                                                                 |

Local uncommitted state: none (this handoff update is the only thing in flight).

Build state:

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (7.11s, 500kB chunk warning is pre-existing).
- `dotnet build` — clean (6 projects, 0 errors, 0 warnings).

---

## Blockers / outstanding

- **Top Movers Phase 1 shipped but not yet verified in prod** — once the next Hangfire rebuild runs,
  spot-check the Top Risers/Fallers cards for honesty. The infamous items should no longer appear:
  Ski Mask filtered by min-sample (2 buckets in 24h < 3), Scalpel z≈0, Edomondo z≈0.4, Slingshot /
  Plastic Sword / Fine Chisel mid-rank, Pillow absorbed by its own 52% dispersion. Rope and Chain
  Whip may still appear as movers — that's correct per the data at hand.
- Project-local `.venv` pattern for `curl_cffi` — workaround (system `pip install`) is in place for
  Drew's machine; proper fix deferred.
- Some UI items deliberately deferred:
  - Vendor icons / item-type glyphs (section 10 of the UI plan).
  - Resale page drawer conversion.

---

## Next action

- Smoke the Top Movers redesign post-deploy. Data exports + analysis in `data-exports/` (gitignored)
  validated the expected rankings before ship; still worth eyeballing the live widget.
- **Top Movers remaining slices** (noted in TODO.md): (3) volatility-bucket separation for
  naturally-noisy items, (4) "Most active" ceiling chip, (5) confidence chips using the stored
  `sample_count_recent` / `sample_count_baseline` columns. All non-urgent.
- Parked for later (Drew has context; don't action without asking):
  - Read-only prod DB access for offline data analysis. Options discussed: read-only Postgres role
    on a replica, or nightly logical dump into DuckDB. Hosting shape drives the choice.
  - Cross-item spike correlation analysis (is-this-a-Torn-event-day?). Separate analytics tool, not
    a page on the site.
- Follow-ups noted in `TODO.md`:
  - "Item is heating up" UI badge (data available; now honest via z-score).
  - Dedicated `/volatility` page with sliders (endpoint now returns ranked + filtered data).

---

## Top Movers review (2026-04-24)

Drew reviewed the widget after it had run a few times and flagged that the data isn't reliable
enough to be honest to users. I read the job and confirmed every artifact is explainable from the
current rebuild logic.

**Status: Phase 1 of the redesign (steps 1+2 below) shipped the same day.** New columns in
`item_volatility_stats`: `window_price`, `baseline_price`, `sample_count_recent`,
`sample_count_baseline`, `price_dispersion`, `move_pct_window`. Ranking switched to z-scored move,
filtered by `|move_pct_window| >= 0.10` AND `|z-score| >= 1.0`. Validated against a 550k-row summary
export before shipping: Ski Mask filtered out (2 buckets), Scalpel z≈0, Edomondo z≈0.4, low-range
items absorbed by their own dispersion. Rope and Chain Whip still flagged as movers where
appropriate. Remaining slices (3)-(5) of the priority list below are tracked in TODO.md. The
narrative below preserves the original diagnosis; skip it if you just need the state of the work.

### What the job actually does today

`ItemVolatilityStatsRepository.RebuildStatsAsync` runs a single `DISTINCT ON` query across
`item_change_log_summaries`:

- **`current_price`** = average price of the _single most-recent_ bucket per (item, source).
- **"1d-ago price"** = average of the _single most-recent bucket_ with `bucket_start <= NOW() - 1d`.
- **`price_change_1d`** = `(current − 1d_ago) / 1d_ago`, fractional.
- **`changes_1d` / `changes_1w`** = raw count of change rows in the respective window.
- **No dispersion / stability measure is stored.** The table name is aspirational; nothing it stores
  measures volatility.

### Observed artifacts (prod, Apr 24)

- **Ski Mask shown as "−92% fall, latest $800M"**: one $10B listing pulled the latest bucket's
  average up, then the next bucket reverts. The "−92%" compares two adjacent bucket means, one still
  inflated by the outlier. `current_price` is the inflated mean.
- **Scalpel "+211.7% riser, $450"** and **Rope "+105%"**: genuine intraday spikes that have already
  reverted by the time the widget renders. Ranking compares mid-spike vs pre-spike.
- **Edomondo Localé "−65.5% fall"**: reversion _from_ its own recent spike — the 1d-ago bucket sits
  on the peak, the latest bucket is post-crash.
- **Pillow / Slingshot / Plastic Sword / Fine Chisel appear repeatedly**: naturally high-variance
  low-priced items. They swing 2–3× daily without any news; the ranking treats that intrinsic noise
  as signal.
- **"Most active: 353 chg" on all 5 items**: the polling ceiling. With 29 active API keys the job
  can observe at most ~113 changes/6h for a single item, so any item whose true change rate exceeds
  that saturates and the ranking past the ceiling is arbitrary.

### Proposed changes, priority order

1. **Robust window estimators.** Replace single-bucket `latest` and `baseline` with median (or
   trimmed mean) over explicit windows (e.g. latest = last 6–24h, baseline = last 30d excluding the
   last day). Require a minimum sample count in each window; exclude items that don't meet it. Kills
   all three outlier-driven artifacts in one go.
2. **Z-scored movement.** Store a per-item dispersion measure (MAD of log returns, or CV of daily
   medians, over ~30d). Rank Top Risers/Fallers on `(current − baseline) / dispersion`, not raw %.
   Fine Chisel moving 50% scores ~1σ; S&W M29 moving 170% scores ~5σ. This is the "Pillow is always
   moving" filter.
3. **Volatility bucket + separate surfacing.** Classify items stable/medium/high. Either exclude
   high-volatility items from the main Top cards and give them their own "Usually volatile, moving
   outside their range" card (preferred), or add a chip next to volatile rows so users know to
   discount.
4. **Fix the "Most active" ceiling.** Short term: show a saturation chip ("≥ ceiling/24h —
   under-sampled") instead of the raw number when `changes_1d` hits the ceiling, and rank saturated
   items by a secondary key (circulation or volatility). Medium term: measure activity differently
   (distinct prices observed per hour, or distinct 5-minute buckets with any change) so saturation
   is less likely.
5. **Confidence surfacing on the widget.** Sample count, range chip, or a "why this is listed"
   tooltip per row.
6. **Item details page**: add a "View on Torn market" link. Drew noticed this is missing.

### Recommended first session

**(1) + (2) together.** Change the `item_volatility_stats` rebuild to compute median-based
latest/baseline over explicit windows with min-sample filtering, and add a dispersion column
computed over ~30d. Rank the widget on z-scored move. Around 80% of the user-visible weirdness goes
away, and the schema is set up to support (3) without another migration. Ideally the rebuild also
records the sample counts used for latest/baseline so (5) can be added cheaply later.

### Notes

- "Volatile" is the correct term of art — dispersion of returns — not a misuse. Use it.
- Don't pre-optimise (3)/(4)/(5) before we can see how (1)+(2) behaves in isolation.
- The stored `current_price` today isn't safe as a display value either. After (1), the widget's
  displayed price should be the window median, not the single most recent bucket mean.
- Part of the motivation for (1) specifically is _honesty_: a "Top riser" that's already back to
  baseline by the time it's shown is worse than nothing. A window-median approach only flags moves
  that have persisted long enough to matter.

---

## API key security — Phase 1 + 2 + 3 (2026-04-24, all shipped)

Shipped end-to-end in this session. Plaintext Torn API keys no longer appear at rest in the DB, no
longer appear in the browser after sign-in, and the transitional plaintext column + scaffolding are
gone. Plan document lived in this chat; no separate plan file was written.

**Deploy order that actually happened**: Phase 1+2 committed as `b19421c` → Drew deployed → prod
verified (every user row had `api_key_encrypted` populated via the startup backfill) →
`chore/drop-plaintext-api-key` branch with Phase 3 → Codex PR review flagged two P1s (unreadable-
ciphertext throwing on sign-in; V1.20 missing a runtime guard) → both fixed in `90f0234` → Drew
deployed again → prod clean.

### What landed

**Infrastructure (Terraform)**

- `torn_key_encryption_key_v1` (sensitive var) + `torn_key_encryption_current_version` (default
  `"1"`) added to `infra/variables.tf`.
- `azurerm_key_vault_secret "torn_key_encryption_v1"` in `infra/key_vault.tf` holds the live
  encryption key. Matches the existing jwt_secret / db_password pattern.
- `azurerm_key_vault.torntools_keyvault.purge_protection_enabled = true` (was `false`). One-way
  switch — can't be turned off after apply. Deliberate: protects against future-Drew accidentally
  purging encryption keys.
- `TornKeyEncryption__CurrentVersion` and `TornKeyEncryption__Keys__1` added to `app_settings` in
  `infra/app_service.tf`.
- `.github/workflows/deploy-all.yml` passes `TF_VAR_torn_key_encryption_key_v1` from the GitHub
  secret `TORN_KEY_ENCRYPTION_KEY_V1`.
- `infra/terraform.env.tfvars-template` gains a placeholder line.

**Schema (Flyway)**

- `V1.19__users_api_key_encrypted.sql`: `ALTER TABLE users ADD COLUMN api_key_encrypted BYTEA NULL`.
  No data change — the backfill runs on API startup.

**Backend**

- `TornTools.Core.Configurations.TornKeyEncryptionConfiguration` — `CurrentVersion` +
  `Dictionary<string, string> Keys`, bound from the `TornKeyEncryption` section via
  `AddTornKeyEncryptionConfiguration`. Uses `GetSection` (not `GetRequiredSection`) so dev without
  the secret still boots; `ApiKeyProtector` throws on first use if `Keys` is empty.
- `TornTools.Core.Interfaces.IApiKeyProtector` + `TornTools.Application.Services.ApiKeyProtector` —
  AES-GCM with payload layout `[1 byte version][12 byte nonce][16 byte tag][ciphertext]`. Parses
  `CurrentVersion` + `Keys` at construction. Registered as singleton.
- `ApiKeyLeaseDto(long UserId, string ApiKey)` — returned from `IUserRepository.GetNextApiKeyAsync`
  so failures in `ApiCaller` can attribute back to the owner via `MarkKeyUnavailableAsync(userId)`
  instead of plaintext-equality lookup.
- `ApiCaller.AddAuthorizationHeader` now returns `Task<ApiKeyLeaseDto?>`. `CallAsync` captures the
  lease and passes `userId` on `TornKeyUnavailableException`. Removed the regex-y plaintext-recovery
  from auth headers in the failure path. `TornApiMultiKeyCaller` updated; `Weav3rApiCaller` /
  `YataApiCaller` inherit the no-op default (return `null`).
- `MarkKeyUnavailableByApiKeyAsync` removed from `IDatabaseService`, `DatabaseService`,
  `IUserRepository`, `UserRepository` — no callers left.
- `UserRepository.UpsertUserDetailsAsync` dual-writes both `ApiKey` (plaintext) and
  `ApiKeyEncrypted`. Opportunistic backfill if plaintext is already correct but encrypted is null.
  `GetNextApiKeyAsync` prefers `ApiKeyEncrypted`; falls back to plaintext.
  `GetApiKeyForUserAsync(userId)` added for the proxy endpoints.
- `UserEntity.AsDto()` returns `ApiKey = string.Empty` — plaintext never leaks past persistence on
  reads. `UserDto.ApiKey` is now write-only-by-convention (write paths set it, read paths leave it
  empty).
- Startup backfill in `Program.cs`: after migrations + scheduler registration, calls
  `IDatabaseService.BackfillEncryptedApiKeysAsync`. Idempotent.
- New `TornController` at `/api/torn`:
  - `GET /api/torn/user/basic` (auth) — proxies Torn `/v2/user/basic` using the current user's
    decrypted key.
  - `GET /api/torn/user/inventory?cat=X` (auth) — walks Torn's `_metadata.links.next` pagination
    server-side, returns the aggregated `{ inventory, _metadata }` payload.
  - `POST /api/torn/key/validate` (anonymous) — accepts `{ apiKey }` in the body; fetches
    `/v2/key/info` + `/v2/user/basic` in parallel; returns `{ info, profile, error? }`.

**Frontend**

- `client/src/lib/dotnetapi.ts` — `proxyTornUserBasic`, `proxyTornUserInventory(cat)`,
  `proxyTornKeyValidate(apiKey)` (returns `ValidatedKey = { info, profile }`).
- `UserContext.tsx` — `apiKey`, `setApiKey`, `confirmApiKeyAsync`, `fetchTornProfileAsync` all
  removed. `LOCAL_STORAGE_KEY_TORN_API_KEY`, `LOCAL_STORAGE_KEY_TORN_USER_DETAILS`,
  `LOCAL_STORAGE_KEY_USER_CACHE_TS` all removed. Legacy keys cleaned from `localStorage` on mount.
  New `signInAsync(apiKey)` — the only path that carries a plaintext key from browser to backend.
  `tornUserProfile` auto-loads via `proxyTornUserBasic()` when `dotNetUserDetails` is set.
- `SignIn.tsx` / `UserSettings.tsx` — local-only `apiKey` state (never context, never localStorage).
  Debounced `proxyTornKeyValidate` during typing shows the preview; clicking "Sign in" / "Save"
  calls `signInAsync(key)`. Key wipes from local state on dialog close.
- `BazaarPriceLookup.tsx` — `fetchTornInventory(apiKey, cat)` → `proxyTornUserInventory(cat)`.
  `apiKey` dependency dropped.
- `ForeignMarkets.tsx` — `apiKey` / `fetchTornProfileAsync(apiKey)` removed. Uses `tornUserProfile`
  which UserContext now loads automatically.
- `useUser` hook shape updated (no `apiKey`, no `setApiKey`, no `fetchTornProfileAsync`, no
  `confirmApiKeyAsync`; adds `signInAsync`).

**Phase 3 follow-ups (shipped as `11cb3fd` + Codex-P1 fix `90f0234`)**

- **Flyway V1.20** `ALTER TABLE users DROP COLUMN api_key`. Self-gating: a plpgsql `DO` block at the
  top counts rows with `api_key_encrypted IS NULL AND api_key IS NOT NULL AND api_key <> ''` and
  `RAISE EXCEPTION` if non-zero. CI can't accidentally drop the column on a half-backfilled table.
- `UserEntity.ApiKey` property + EF mapping removed.
- `UserRepository.UpsertUserDetailsAsync` change-detection now decrypts the existing ciphertext to
  compare, but wraps `Unprotect` in a try/catch on `CryptographicException` — a decrypt failure logs
  a warning and falls through to the key-change branch, letting the user re-sign in with a fresh key
  to overwrite the unreadable row. (This was the first Codex P1; the naive version I shipped in
  `11cb3fd` would have thrown a 500 on `/auth/login` for any row with corrupted/retired ciphertext.)
- `UserRepository.BackfillEncryptedApiKeysAsync` + its `IDatabaseService` / `DatabaseService`
  shims + the `Program.cs` startup call — all removed. Nothing left to backfill.
- `client/src/lib/tornapi.ts` deleted; types moved to `client/src/types/torn.ts`. Three import sites
  updated.

**Left for a quieter future session** (deferred, not blockers):

- `UserContext.tsx` has a legacy-localStorage cleanup that removes pre-Phase-2 keys on mount. Safe
  to remove once real time has passed and no returning user could still have the stale cache. No
  urgency.
- `UserDto.ApiKey` is a write-only-by-convention field (write paths populate it; read paths leave it
  empty). A proper read/write DTO split would remove the asymmetry.

### Build state at end of session

- `dotnet build` clean (6 projects, 0 errors, 0 warnings).
- `npx tsc --noEmit` clean.
- `npm run build` clean (7.11s, pre-existing 500kB chunk warning only).
- Prod smoke: Drew confirmed sign-in still works, `api_key_encrypted` populated for every row, Phase
  3 drop + cleanup deployed with no issues.

### Notes for the next session

- **Key rotation (the hypothetical future-Drew "wild security quest")**: add
  `TORN_KEY_ENCRYPTION_KEY_V2` GitHub secret + `torn_key_encryption_key_v2` variable +
  `azurerm_key_vault_secret "torn_key_encryption_v2"` + `TornKeyEncryption__Keys__2` app_setting;
  bump `torn_key_encryption_current_version` to `"2"`; deploy. New writes encrypt with v2; v1 rows
  stay decryptable. Optional re-encryption pass (Hangfire job or manual SQL) promotes v1 rows to v2
  over time. When the last v1 row is gone, retire v1.
- **If the backend crashes at startup complaining about `TornKeyEncryption:Keys`**: the GitHub
  secret isn't set, or Terraform hasn't applied since it was added. Secret must exist before the
  backend starts.
- **Local dev without the secret**: the app boots but sign-in will throw the "Keys is empty" error
  on first use. Set `TornKeyEncryption__Keys__1` via `dotnet user-secrets` or add to
  `appsettings.Development.json` (don't commit) with a throwaway key.
