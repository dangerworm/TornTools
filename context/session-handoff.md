# Session Handoff — 2026-04-25 00:14

Previous handoff archived as `context/sessions/2026-04-25-0014-unusual-activity-pivot.md` — read it
if you need depth on the API key security work or the Top Movers redesign reasoning. This file is a
current-state snapshot.

## Branch state

- `main` and `development` are in sync (Drew has been deploying as we go).
- Tip is `e2119e3` (TODO note about ranking-threshold tuning).
- Local working tree clean.

## What landed in the previous arc

Loose chronological order of the headline commits, all on `development` and either deployed or about
to be:

| Commit                                        | What                                                                                                                                                                                     |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `e5df589`                                     | TODO quick-wins sweep (Torn market link, sortable tables, login refactor, polish).                                                                                                       |
| `b19421c`                                     | API key security Phase 1+2 (at-rest AES-GCM, browser proxy).                                                                                                                             |
| `11cb3fd` + `90f0234`                         | Phase 3 cleanup (drop plaintext column, delete `tornapi.ts`, Codex P1 fixes).                                                                                                            |
| `7d6844c` + `75d52e8` + `629049e` + `1e2f884` | Top Movers Phase 1 (median-window latest/baseline, dispersion, z-score ranking, sign-gating, `percentile_cont` numeric cast, trimmed-median + 2-day buffer + z≥1.5 tweaks).              |
| `46440d5` + `c79dfa8`                         | Bucket resize 6h → 1h (V1.22 + V1.23 reset of `item_volatility_stats`).                                                                                                                  |
| `2c23b8b`                                     | Unusual Activity pivot — V1.24 + new `item_unusual_candidates` table + multi-horizon rebuild + Hangfire job + `/api/items/unusual` + widget rewire (Most active dropped, Unusual added). |
| `652b6ec` / `867738d`                         | Summariser chunked into 7-day windows + 10-min command timeout (post-V1.22 backfill was hitting Npgsql timeout in prod).                                                                 |
| `459124b`                                     | Hide "Today's movers" heading + subtitle when widget has no data.                                                                                                                        |
| `e2119e3`                                     | TODO note about ranking threshold tuning.                                                                                                                                                |

## Current Hangfire / data state

- 1h summary buckets in use (`SummariseChangeLogs` runs every 6h, chunks 7-day windows during the
  post-V1.22 backfill; checkpointed by `latestBucketStart` so a crash mid-backfill resumes).
- Three rebuild jobs: `SummariseChangeLogs` (00 every 6h), `RebuildVolatilityStats` (30 every 6h),
  `RebuildUnusualCandidates` (45 every 6h). Manual triggers at `/hangfire`.
- Backfill from raw `item_change_logs` (earliest row 2025-11-19) is multi-week of work split into
  7-day chunks. Some rebuilds may run before the backfill is complete and produce partial results —
  that's fine, the next run picks up more data.

## Build state

- `dotnet build` — clean (6 projects, 0 errors, 0 warnings).
- `npx tsc --noEmit` — clean.
- `npm run build` — clean (the 500kB chunk warning is pre-existing).

## Blockers / outstanding

- None on the cards work. Pending follow-ups are catalogued in `TODO.md`.
- **Bargain alerts subscription feature**: design captured in `TODO.md` under "Bargain alerts
  (subscription feature)". **Blocked on Torn staff sign-off** before any code — see ToS analysis
  below.

## Next action

No work selected. Options when Drew comes back:

- **Iterate on the cards**: the six follow-ups under "Top Movers — remaining follow-ups" in
  `TODO.md` (mode-to-bucket on item details, re-score on home-page load, volatility-of-volatility
  signal, confidence chips, drop legacy columns, threshold tuning).
- **Pick a different feature** from `TODO.md` — Resale drawer conversion, "Item is heating up"
  indicator on item details, Foreign Markets stock refill times, etc.
- **Parked items needing explicit sign-off**: read-only prod DB access for offline analysis;
  cross-item spike correlation tool.

## Threshold knobs (for reference)

If the Unusual Activity card or the risers/fallers ranking surfaces too many or too few items once
the backfill catches up, the constants are:

- `ItemVolatilityStatsRepository.GetTopAsync` — `MinAbsMovePct = 0.10m`, `MinAbsZScore = 1.5m`.
- `UnusualController` — `DefaultMinScore = 1.5m`.
- `ItemUnusualCandidatesRepository.RebuildQuery` — per-horizon min-sample thresholds inline: 1 / 3 /
  6 / 24 buckets for 1h / 6h / 24h / 7d.
- `DatabaseService.SummariseChunk = TimeSpan.FromDays(7)` — chunk size for the backfill loop. Drop
  to 3 days if a chunk times out; raise if backfill is fine and you want fewer chunks.

## Bargain-alerts feature — discussion 2026-04-25 ~01:30

Drew proposed a subscription feature: toast notification when a Torn-market item lists for <10% of
city value, gated behind a 30-day rolling Xanax-gift subscription paid in-game to him. Persistent
toast with "time since" counter and distinct sound. Click-through to the listing.

### What we verified about the API access

- Custom keys can be created via the Torn website prefs page; no API endpoint to create them, but
  there is a deep-link URL that pre-fills the form:
  `https://www.torn.com/preferences.php#tab=api?step=addNewKey&title=<TITLE>&<category>=<csv>`. Drew
  used `...&user=events` and got a key (`eJCgm4nAvaGepgAQ` — _DREW: rotate this if you don't want it
  captured here, it has Custom/events-only scope_).
- Verified scope via `GET /v2/key/info`: `access.type: "Custom"`,
  `selections.user: ["profile", "timestamp", "lookup", "events"]`, all other categories at default
  `timestamp`/`lookup`. `basic` and `bazaar` selections correctly return error code 16.
- The events feed contains the signal we need:
  `"You were sent some Xanax from <a ... XID=3790183>IcePokeDude</a>"` with unix timestamp + stable
  per-event ID. Bonus: also contains `"NAME bought N x ITEM from your bazaar for $PRICE"` events — a
  "your bazaar just sold" notification falls out of the same poll for free.

### API quirk worth remembering

Torn sometimes returns the response _schema_ literal instead of real data — e.g.
`event: string[144]` rather than the actual string, or `events: [{...}] (100)` for arrays. Looks
like an error but isn't. Adding `&comment=tornttools-<feature>` reliably flips it to real data. The
`comment` also shows up in `/key/log`. **Encode in the backend client: always send a comment.**

### ToS finding — the actual blocker

Drew brought a Claude.ai analysis to the chat:

- **RMT clause** ("exchange of currency or assets on Torn for real-world money or services") on
  Torn's rule violations page covers item-for-external-service swaps. Sellers historically
  permabanned without first-offence warning.
- **API ToS** on torn.com/api.html invites operators to contact staff for permission to charge users
  for usage. Doesn't carve out item-based payments.
- Recommended path: email webmaster@torn.com describing the feature _before any code_, ask for
  explicit permission. They've invited that conversation in writing. Sanity-check the precedent by
  looking at how TornStats / TornPDA handle paid tiers (real money vs items) before drafting.

Risk-tiered fallbacks if staff say no to item-gating: voluntary tips with no gating; real-money
subscription via Stripe; or just free for everyone.

### Where this lives now

Full design + ToS analysis + implementation sketch in `TODO.md` → **Bargain alerts** section, and
plan at `context/plans/2026-04-25-bargain-alerts.md` (now annotated with build status).

**Drew pivoted away from the subscription model**: rather than gate behind Xanax payments and need
the staff conversation, he asked for the Drew-only variant of the feature for himself. That
sidesteps the ToS issue (no item-for-service exchange) and lets the design sit on a clean
authorisation seam ready for the subscription extension if/when staff approve it later.

### Drew-only build (M1–M8) shipped this session

Backend (`dotnet build`: clean):

- Migration `V1.25__bargain_alerts.sql` — partial unique index `(item_id) WHERE status='active'`
  enforces "one active alert per item" at the DB layer.
- `BargainAlertEntity` / `BargainAlertDto` / `IBargainAlertRepository` / `BargainAlertRepository`
  with
  `Create / GetActiveByItem / GetById / GetAllActive / MarkExpired / MarkDismissed / GetActiveItemIds`.
- `IBargainAlertService.EvaluateAsync(source, itemId, newListings, ct)` hooked into
  `DatabaseService.ProcessListingsAsync` after `ReplaceListingsAsync`. Source-scoped (Torn market
  only), idempotent open/expire decisions. Threshold =
  `BargainAlertService.ProfitThreshold = 5_000`.
- `BargainAlertsConfiguration` (`AuthorisedPlayerIds: [3943900]`, `MaxInterleaves: 50`) bound from
  appsettings. `IBargainAlertAuthService` is a hashset-backed config check, ready to be replaced by
  a ledger query later.
- `AlertsController` at `/api/alerts/{authorised,active,{id}/dismiss}`. `[Authorize]` + the
  authorisation gate. `authorised` returns `{authorised: bool}` so the frontend can branch cleanly
  without 403s.
- Snipe-loop: new virtual `TryGetPriorityQueueItemAsync` hook on `QueueProcessorBase`.
  `TornMarketsProcessor` overrides it — every alternate tick returns a synthetic queue item for the
  least-polled hot item, bounded by `MaxInterleaves`. Synthetic items have no DB queue id;
  `RunWorkerAsync` skips `IncrementQueueItemAttempts`/`RemoveQueueItemAsync` for them. Hot-set
  refreshes from the DB every 30s.

Frontend (`npx tsc --noEmit`, `npm run build`: clean):

- `BargainAlertsProvider` in `main.tsx`, between `BazaarSummariesProvider` and
  `LocalizationProvider`. Mount-time `/api/alerts/authorised` probe; if false, the provider becomes
  a no-op.
- Visibility-aware 12s polling (suspends on hidden tab, immediate fetch on return-to-visible).
- "Seen IDs" set primed on first poll so the sound only fires on _new_ alerts after that.
- `<BargainAlertToast />` mounted at the top of `Layout`. Renders nothing for unauthorised users
  (safe to mount globally).
- Web Audio synthesised two-tone chirp (880 → 1320 Hz square waves) — distinctive, no asset needed.
  Drew can swap to a file-based asset by replacing `playAlertSound` and dropping a sound into
  `client/public/sounds/`.
- Toast UI: persistent (no auto-dismiss), live "time since" counter, click-through to
  `https://www.torn.com/imarket.php#/p=shop&type={id}`, dismiss button with optimistic local
  removal + `POST /api/alerts/{id}/dismiss`.

### What's left for Drew (M9 + M10)

1. Boot the backend so Flyway applies V1.25 against the dev DB.
2. Run the synthetic test in `context/plans/2026-04-25-bargain-alerts-verification.sql`. Step 2
   inserts an alert directly (tests the toast path); step 3 inserts a sub-threshold listing (tests
   the full detection hook end-to-end).
3. Real-world latency check: post a real cheap listing on the Torn market (or wait for one) and
   measure detection → endpoint → toast latency. If best-case is >30s the snipe-loop alone won't
   make this useful and we'll need to reconsider scan cadence.

### Known caveats / things to watch

- Detection only fires when listings _change_. A pre-existing sub-threshold listing won't open an
  alert until the next time the listing composition or minimum price changes. Acceptable in practice
  — bargains rarely sit untouched.
- The synthesised audio chirp won't play before the user has interacted with the page (browser
  autoplay policy). Drew uses the app, so this almost never bites in practice.
- Snipe-loop spends half the per-worker tick budget on hot items. With 1 worker and 1 hot item,
  that's ~30 polls/min on the hot item before the bound trips at `MaxInterleaves=50`. Tune in prod
  if needed.

## Data analysis assets

`data-exports/` (gitignored) holds the CSVs Drew shared mid-session for ranking validation. Five
files dated 2026-04-24: `item_change_log_summaries`, `item_volatility_stats`, `items`, `listings`,
`foreign_stock_items`. Useful when iterating on ranking thresholds — Python + pandas works fine on
the 33MB summaries CSV. They predate V1.22 (so they're 6h-bucket data), but the ranking logic
doesn't care about bucket size for the sanity checks we did.
