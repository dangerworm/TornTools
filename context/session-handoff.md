# Session Handoff — 2026-04-23 / 24

Long session in three distinct phases. All work landed on branches, `ui/new-design` and
`feat/todo-data-signals`. The first has been merged into `main` and `development`; the second is
rebased on top of the merged dev and pushed to origin, awaiting merge.

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

| Branch                          | Where it sits                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`                          | All work from this session shipped: UI overhaul, feat/todo-data-signals, TODO quick-wins, API key security Phase 1+2+3. Up to date with origin. |
| `development`                   | Same as main. Tip is `90f0234` (Codex P1 fix on phase 3 cleanup).                                                                              |
| `feat/todo-data-signals`        | Merged; safe to delete locally.                                                                                                                |
| `chore/drop-plaintext-api-key`  | Merged; safe to delete locally.                                                                                                                |

Local uncommitted state: none (this handoff update is the only thing in flight).

Build state:

- `npx tsc --noEmit` — clean.
- `npm run build` — clean (7.11s, 500kB chunk warning is pre-existing).
- `dotnet build` — clean (6 projects, 0 errors, 0 warnings).

---

## Blockers / outstanding

- **Top Movers widget shows unreliable data** — see the "Top Movers review" section below for the
  diagnosis and proposed redesign. The job runs and the widget populates, but many of the listed
  movers are outliers or reversions rather than durable moves. This is the next priority work.
- Project-local `.venv` pattern for `curl_cffi` — workaround (system `pip install`) is in place
  for Drew's machine; proper fix deferred.
- Some UI items deliberately deferred:
  - Vendor icons / item-type glyphs (section 10 of the UI plan).
  - Resale page drawer conversion.

---

## Next action

- **Top Movers redesign** — see the section below. Likely first-session scope: **(1) + (2)** from
  the proposal together, i.e. median-window latest/baseline with a minimum sample count, plus a
  stored per-item volatility measure used to z-score the ranked move. That alone fixes the Ski
  Mask / Scalpel / Edomondo / Rope artifacts and lays the table structure for the rest. Touches
  Flyway schema + the rebuild query + the API + the widget — plan before editing.
- Parked for later (Drew has context; don't action without asking):
  - Read-only prod DB access for offline data analysis. Options discussed: read-only Postgres role
    on a replica, or nightly logical dump into DuckDB. Hosting shape drives the choice.
  - Cross-item spike correlation analysis (is-this-a-Torn-event-day?). Separate analytics tool,
    not a page on the site.
- Follow-ups already noted in `TODO.md`:
  - "Item is heating up" UI badge (data now available — but will become more honest after the
    redesign above, so probably worth waiting).
  - Dedicated `/volatility` page with sliders (endpoint now available; same caveat).

---

## Top Movers review (2026-04-24)

Drew reviewed the widget after it had run a few times and flagged that the data isn't reliable
enough to be honest to users. I read the job and confirmed every artifact is explainable from the
current rebuild logic.

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

Shipped end-to-end in this session. Plaintext Torn API keys no longer appear at rest in the DB,
no longer appear in the browser after sign-in, and the transitional plaintext column + scaffolding
are gone. Plan document lived in this chat; no separate plan file was written.

**Deploy order that actually happened**: Phase 1+2 committed as `b19421c` → Drew deployed → prod
verified (every user row had `api_key_encrypted` populated via the startup backfill) →
`chore/drop-plaintext-api-key` branch with Phase 3 → Codex PR review flagged two P1s (unreadable-
ciphertext throwing on sign-in; V1.20 missing a runtime guard) → both fixed in `90f0234` →
Drew deployed again → prod clean.

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

- **Flyway V1.20** `ALTER TABLE users DROP COLUMN api_key`. Self-gating: a plpgsql `DO` block at
  the top counts rows with `api_key_encrypted IS NULL AND api_key IS NOT NULL AND api_key <> ''`
  and `RAISE EXCEPTION` if non-zero. CI can't accidentally drop the column on a half-backfilled
  table.
- `UserEntity.ApiKey` property + EF mapping removed.
- `UserRepository.UpsertUserDetailsAsync` change-detection now decrypts the existing ciphertext
  to compare, but wraps `Unprotect` in a try/catch on `CryptographicException` — a decrypt
  failure logs a warning and falls through to the key-change branch, letting the user re-sign
  in with a fresh key to overwrite the unreadable row. (This was the first Codex P1; the naive
  version I shipped in `11cb3fd` would have thrown a 500 on `/auth/login` for any row with
  corrupted/retired ciphertext.)
- `UserRepository.BackfillEncryptedApiKeysAsync` + its `IDatabaseService` / `DatabaseService`
  shims + the `Program.cs` startup call — all removed. Nothing left to backfill.
- `client/src/lib/tornapi.ts` deleted; types moved to `client/src/types/torn.ts`. Three import
  sites updated.

**Left for a quieter future session** (deferred, not blockers):

- `UserContext.tsx` has a legacy-localStorage cleanup that removes pre-Phase-2 keys on mount.
  Safe to remove once real time has passed and no returning user could still have the stale
  cache. No urgency.
- `UserDto.ApiKey` is a write-only-by-convention field (write paths populate it; read paths
  leave it empty). A proper read/write DTO split would remove the asymmetry.

### Build state at end of session

- `dotnet build` clean (6 projects, 0 errors, 0 warnings).
- `npx tsc --noEmit` clean.
- `npm run build` clean (7.11s, pre-existing 500kB chunk warning only).
- Prod smoke: Drew confirmed sign-in still works, `api_key_encrypted` populated for every row,
  Phase 3 drop + cleanup deployed with no issues.

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
