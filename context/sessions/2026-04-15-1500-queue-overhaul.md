# Session Handoff — 2026-04-15

## What we accomplished this session

### Queue processing overhaul

The Resale page was showing stale data (30+ min old). Root cause chain: single-threaded processor,
TML/WBL queue glut, and ~3-4 s Python startup overhead per Weav3r call.

**QueueIndex interleaving** (`QueueItemRepository.CreateQueueItemsAsync`) Formula:
`withinGroupIndex * typeCount + (int)callType` — ensures profitable-first ordering within each type.
Now superseded by the processor split (see below), but still used for intra-type ordering.

**SELECT FOR UPDATE SKIP LOCKED** (`QueueItemRepository.GetNextQueueItemAsync`) Replaced
optimistic-concurrency approach with a raw Npgsql UPDATE...RETURNING that atomically claims a row.
Workers never block each other; each gets a different row.

**Persistent Python server** (`Weav3rPythonServer.cs` + `bazaar_server.py`) Instead of spawning a
new Python process per Weav3r call (~3-4 s overhead), a singleton `Weav3rPythonServer` keeps
`bazaar_server.py` alive as a subprocess and communicates via line-delimited JSON over stdin/stdout.
`curl_cffi` with `impersonate="chrome124"` is required for Weav3r anti-bot — there is no .NET
equivalent. Deploy workflow compiles `bazaar_server.py` to a self-contained binary via PyInstaller.
`Weav3rApiCaller` now delegates to this singleton instead of spawning per-call.

**TornMarketsProcessor + Weav3rBazaarsProcessor** (replaced `QueueProcessor`) Each processor handles
exactly one `ApiCallType`. Both extend `QueueProcessorBase` which holds the shared worker loop. Key
properties:

- Each processor only dequeues, checks InProgress, and removes its own call type's rows.
- Worker count read from `TornMarketsProcessorConfiguration` /
  `Weav3rBazaarsProcessorConfiguration`.
- Overridable via Azure App Service env vars **without a redeploy**:
  `TornMarketsProcessorConfiguration__WorkerCount` and
  `Weav3rBazaarsProcessorConfiguration__WorkerCount`
- Both currently default to 1 worker each.

**Bug fixes (from Codex PR review)**

- Repopulation now guarded with `HasInProgressItems(callType)` — prevents a worker from clearing
  in-flight rows belonging to sibling workers when it sees an empty pending queue.
- `RemoveQueueItemsAsync` filters on `Pending`-only (was "not Failed") as a defensive layer.
- Rate-limit delay formula multiplied by `workerCount` so aggregate throughput across N workers
  stays within the 80%-of-max budget.

**Active item selection** (`DatabaseService.PopulateQueueWithTornMarketItems/WithWeav3rItems`)
Replaced the stale-listing scan with `GetActiveMarketItemsForQueueAsync`:

- Filters items with fewer than `2 * 7 * 24 / StaleListingThresholdHours` changes in 7 days.
- Sorts: profitable items first (in `profitable_listings`), then most-stale first.
- Falls back to stale scan for TML if no active items found; skips WBL population entirely.
- `StaleListingThresholdHours` reduced from 24 → 12.

**Resale.tsx default filter** `DEFAULT_MAX_TIME_INDEX` changed from `5` (60 min) to `2` (5 min) —
done after production confirmed TML/WBL alternating in logs.

### Code quality fixes

**`dotnetapi.ts`** — replaced `try { res.json() } catch { if (!res.ok) throw }` pattern across all 9
fetch functions with `if (!res.ok) throw new Error(...)` then `return res.json()`. A 200 with a
non-JSON body (e.g. HTML error page) previously returned a silent empty default.

**Input model validation** — added `[Required]`, `[StringLength]`, `[Range]`, `[RegularExpression]`
to `LoginInputModel`, `UserDetailsInputModel`, `ThemeInputModel`, `UserProfileInputModel`,
`WeakListingsInputModel`. Bad requests now return a clean 400 before controller logic runs. Torn API
keys validated as exactly 16 characters. Theme colours validated as `^#[0-9A-Fa-f]{6}$`. Theme mode
validated as `^(light|dark)$`.

### Architecture decision (documented, not implemented)

Discussed microservices / multiple App Service instances for the Torn 1,000 calls/min IP cap.
Decision: not hitting cap today (£10/month single App Service). When needed, scale the existing
service horizontally — `SELECT FOR UPDATE SKIP LOCKED` already supports this with no code changes.
Each additional App Service Plan instance gets its own outbound IP.

---

## Current state of queue processing

```
TornMarketsProcessor  (1 worker)  →  claims Pending/TornMarketListings rows
Weav3rBazaarsProcessor (1 worker) →  claims Pending/Weav3rBazaarListings rows
Both running in the same process (TornTools.Api)
```

Repopulation: each processor independently detects exhaustion and repopulates its own half. Hangfire
`CheckStaleMarketItems` job still populates both TML + WBL stale items as a backstop.

---

## Key file locations

| Area                          | File                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Base processor loop           | `api/TornTools.Cron/Processors/QueueProcessorBase.cs`                                                               |
| TML processor                 | `api/TornTools.Cron/Processors/TornMarketsProcessor.cs`                                                             |
| WBL processor                 | `api/TornTools.Cron/Processors/Weav3rBazaarsProcessor.cs`                                                           |
| Processor configs             | `api/TornTools.Core/Configurations/TornMarketsProcessorConfiguration.cs` / `Weav3rBazaarsProcessorConfiguration.cs` |
| Persistent Python server (C#) | `api/TornTools.Application/Services/Weav3rPythonServer.cs`                                                          |
| Persistent Python server (py) | `api/TornTools.Api/Weav3rPython/bazaar_server.py`                                                                   |
| Queue dequeue SQL             | `api/TornTools.Persistence/Repositories/QueueItemRepository.cs:68`                                                  |
| Active item selection         | `api/TornTools.Application/Services/DatabaseService.cs` (`PopulateQueueWithTornMarketItems`)                        |
| Azure env vars                | `infra/app_service.tf` (worker count overrides)                                                                     |
| Resale page                   | `client/src/pages/Resale.tsx`                                                                                       |
| API client                    | `client/src/lib/dotnetapi.ts`                                                                                       |
| Input models                  | `api/TornTools.Core/Models/InputModels/`                                                                            |

---

## Outstanding from previous sessions (not done)

- **Persist slider values** — Resale min profit, max buy price, max updated time sliders not in
  localStorage. Pattern: see outlet/checkbox toggles already done in `Resale.tsx`.
- **Add stale-data warning** — surface a warning when backend hasn't updated recently.
- **Profit source indicator** — show profit from City, Bazaar, Item Market as a chip set.
- **Column sorting** — `ResaleItemsTable`, `FavouriteMarketsTable`, `Weav3rListingTable` have no
  sortable headers. Reference impl: `ForeignMarketItemsTable.tsx` + `TableSortCell.tsx`.
- **Item Details: Add link to market and shop** — `ItemDetailsHeader.tsx` has no market/shop links.
- **Item Details: Rename "City Buy Price"** — still labeled in `ItemDetailsInfoCards.tsx:24`.
- **Hangfire price/volatility job** — pre-compute snapshots; unblocks home page interesting items.
- **Live "last updated" counter** — done (Nov 29 Peter email, implemented in a prior session).
- **Profit per click efficiency metric** — not implemented (Jan 25 Peter email).
- **Bazaar sell calculator modal** — not implemented.
- All Item Quality features.
- All Selective Scanning items.
- `profitable_listings` plain view → materialised view (performance, under load).
- `market_velocity` view aggregates all change logs with no date filter (will slow over time).
- Route `[controller]/[action]` on ApiController — RPC-style URLs, not REST.
- No test project.
- API keys stored in plaintext in users table.
- `torn-war-checker.html` in repo root — appears to be an unrelated standalone utility.
