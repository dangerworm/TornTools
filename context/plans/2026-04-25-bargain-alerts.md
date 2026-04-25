# Bargain Alerts — Drew-only v1 — Plan

**Date**: 2026-04-25 **Author**: Claude (with Drew) **Status**: build complete (M1–M8), pending
end-to-end verification (M9) and prod latency check (M10). **Verification helpers**: see
`2026-04-25-bargain-alerts-verification.sql`.

## Goal

Toast notification on the front end when an item appears on the **Torn market** for a price that
makes a **single-unit profit > $5,000** when sold back to the city. Persistent (no auto-dismiss),
shows time since the listing was first detected, plays a distinctive sound on appearance, links
through to the listing, transitions to a "Too late!" variant when the listing disappears.

## Scope (the "80%")

**In:**

- Markets only (Torn item market). Bazaars deferred — too slow to scan to be useful.
- Drew-only. Single hardcoded authorised player_id, with a clean seam for adding more later.
- Detection: `valueSellPrice - listing_price > 5_000`. City sell-back has no tax.
- Snipe-loop in `TornMarketsProcessor` (interleave re-polls of an active-alert item).
- Persistence: a `bargain_alerts` table the API surfaces via short-poll endpoints.
- Toast UI: persistent, time-since counter, sound, click-through, dismiss button, "Too late!" state
  on expiry.

**Out (the "20%" — deferred):**

- Subscriber ledger / events-feed poll / Xanax-gift detection / 30-day rolling window. The
  authorisation seam is the single point where these slot in later.
- Bazaars.
- SignalR / WebSockets / SSE. v1 uses short-interval browser polling.
- Multi-user notification routing.
- ToS conversation with Torn staff. Not needed for Drew-only since no item-for-service exchange
  occurs.

## Authorisation seam

Single config key `BargainAlerts__AuthorisedPlayerIds: ["3943900"]` (single-element list). Backend
gate: a small `IBargainAlertAuthService.IsAuthorisedAsync(int playerId)` that consults this list.
Future-extension: replace the list-check with a ledger query without touching call sites.

Both `GET /api/alerts/active` and `POST /api/alerts/{id}/dismiss` go through this gate. Anyone else
hitting the endpoints gets `403`. The frontend checks at app-mount whether the current user is
authorised (cheap `GET /api/alerts/authorised` returning `{authorised: bool}`); if false, the
context becomes a no-op and the toast component never mounts.

## Data model

New migration `V1.25__bargain_alerts.sql`:

```sql
CREATE TABLE bargain_alerts (
    id              BIGSERIAL PRIMARY KEY,
    item_id         INTEGER NOT NULL REFERENCES items(id),
    listing_price   BIGINT  NOT NULL,
    market_value    BIGINT  NOT NULL,         -- valueSellPrice at time of detection
    profit          BIGINT  NOT NULL,         -- market_value - listing_price (denormalised for sort)
    found_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    expired_at      TIMESTAMPTZ,              -- set when the snipe-loop notices the listing is gone
    dismissed_at    TIMESTAMPTZ,              -- set by POST /api/alerts/{id}/dismiss
    status          TEXT NOT NULL DEFAULT 'active'  -- active | expired | dismissed
                    CHECK (status IN ('active', 'expired', 'dismissed'))
);

CREATE INDEX idx_bargain_alerts_status_found ON bargain_alerts(status, found_at DESC);
CREATE INDEX idx_bargain_alerts_item_active  ON bargain_alerts(item_id) WHERE status = 'active';
```

**Why "expired" vs "dismissed" vs delete**: kept for future stats. Could roll up "alerts/day",
"average click-to-buy time", "missed-vs-claimed ratio". Cheap.

**Idempotency**: an item can have at most one `active` alert at a time. The detection write-path
checks for an existing active alert on `item_id` before inserting. If a listing relists at a deeper
discount the existing alert's `listing_price` / `profit` / `found_at` are _not_ updated — the
original alert stays until the listing is no longer below threshold, then a fresh alert opens.
(Avoids "the time-since counter just reset for no obvious reason" UX.)

## Backend

### Detection hook

Detection runs at the listings-write path, not as a scan. After `Listings` is replaced for an item
(existing `ReplaceListings` flow per `TODO.md` "Listings replaced wholesale on each scan" note),
evaluate each new listing against threshold; if any qualify, ensure an active alert exists for that
item. If no listings remain that qualify and an active alert exists, mark it `expired`.

Pseudocode:

```csharp
async Task EvaluateBargainsAsync(int itemId, IReadOnlyList<Listing> newListings) {
    var item = await _items.GetByIdAsync(itemId);
    if (item.ValueSellPrice is null) return;

    var threshold = item.ValueSellPrice.Value - 5_000;
    var qualifying = newListings
        .Where(l => l.Price < threshold)
        .OrderBy(l => l.Price)
        .ToList();

    var existing = await _alerts.GetActiveByItemAsync(itemId);

    if (qualifying.Count > 0 && existing is null) {
        var cheapest = qualifying[0];
        await _alerts.CreateAsync(new BargainAlert {
            ItemId = itemId,
            ListingPrice = cheapest.Price,
            MarketValue = item.ValueSellPrice.Value,
            Profit = item.ValueSellPrice.Value - cheapest.Price,
        });
    } else if (qualifying.Count == 0 && existing is not null) {
        await _alerts.MarkExpiredAsync(existing.Id);
    }
    // qualifying > 0 && existing != null → leave alone (idempotency)
}
```

### Snipe-loop in `TornMarketsProcessor`

Need GitNexus impact analysis on `TornMarketsProcessor` first — it's hot-path queue code.

Sketch: maintain an in-memory `HashSet<int>` of active-alert item IDs (rebuilt from DB on processor
startup, kept in sync via a bus or a poll on each tick). On each queue tick, if the hot-set is
non-empty _and_ we haven't yet hit the per-item interleave bound, alternate: hot-item poll → queue
tick → hot-item poll → queue tick. Track per-item interleave counts; once a hot item has been polled
`MaxInterleaves` times consecutively without disappearing, drop it from the fast-path back to normal
queue cadence (alert stays active, just no longer interleaved).

Constants (config-driven):

- `BargainAlerts__MaxInterleaves`: 50 (~5–10 min at current cadence; tune in prod).
- `BargainAlerts__InterleavePolicy`: `RoundRobin | LIFO` — start with `RoundRobin` if multiple
  alerts are simultaneously active.

### Endpoints

- `GET  /api/alerts/authorised` → `{authorised: bool}` (cheap, no DB hit beyond the config check).
- `GET  /api/alerts/active` → list of active alerts for the authed user (gated). Includes item
  name + image so the toast doesn't need a second lookup.
- `POST /api/alerts/{id}/dismiss` → marks `dismissed_at` + status. Idempotent.

All three sit on the existing `ApiController` pattern (`[controller]/[action]` routing) until the
broader REST refactor noted in TODO.md happens.

## Frontend

### Context + polling

`BargainAlertsContext` — short-poll `/api/alerts/active` every 12s while the tab is visible (suspend
on `document.visibilityState === 'hidden'` to avoid burning the API rate limit on backgrounded tabs;
resume + immediate fetch on visibility return).

State shape:

```ts
type BargainAlert = {
  id: number;
  itemId: number;
  itemName: string;
  itemImage?: string;
  listingPrice: number;
  marketValue: number;
  profit: number;
  foundAt: string; // ISO
  status: "active" | "expired" | "dismissed";
};
```

Track which alert IDs we've already shown so the sound only plays on **first** appearance, not on
every poll cycle the alert remains active.

### `<BargainAlertToast />`

Mounted at app root, renders one stack of toasts (top of viewport, descending newest-first).
Per-toast:

- Item image + name + listing price + city sell price + profit.
- "Time since listed" counter (live, updates every second).
- Click-through link to `https://www.torn.com/imarket.php#/p=shop&type={itemId}` (Drew to confirm
  the canonical URL — there are a couple of valid forms).
- Dismiss button → POST `/api/alerts/{id}/dismiss`, optimistic local removal.
- "Too late!" variant: if poll returns the alert with `status === 'expired'` and we're still showing
  it, swap to a muted styling + the elapsed time the listing was up + a non-clickable body.
  Auto-dismiss after 30s in the expired state (the only auto-dismiss in the design).

### Sound

Distinctive, short (~0.5–1.0s), non-musical. Avoid system-default-sounding tones so a backgrounded
tab is identifiable. Asset placement: `client/public/sounds/bargain-alert.mp3` (or `.ogg`). Open
question — Drew's call. Placeholder: a generated short chirp.

Audio constraints to respect:

- Browsers gate autoplay on first-tab-load. The `<BargainAlertToast>` parent should attach an audio
  element on first user-interaction (any click anywhere in the app suffices) — the sound won't play
  until the page has been interacted with at least once. This is a browser policy, not something we
  can override.
- One audio play per **new** alert ID (deduped against the seen-set).

## Verification

1. **Build & typecheck clean** (`dotnet build`, `npx tsc --noEmit`, `npm run build`).
2. **Schema migration applies cleanly** locally.
3. **Synthetic alert test**: insert a fake listing into dev DB at `valueSellPrice - 6_000` for an
   item with a known `valueSellPrice`. Trigger the listings-write hook (or call detection directly).
   Verify an alert row appears, the `/api/alerts/active` endpoint returns it under Drew's session,
   `403` for any other player.
4. **Toast renders**: with the synthetic alert in place, load the home page, confirm the toast
   appears, the counter ticks, the sound plays once.
5. **Snipe-loop**: with the synthetic alert active, log `TornMarketsProcessor` queue order and
   confirm the hot item appears every other tick up to the bound, then drops out.
6. **Expiry**: mark the synthetic alert `expired` server-side; confirm the toast transitions to "Too
   late!" and auto-dismisses 30s later.
7. **Dismiss**: confirm `POST /api/alerts/{id}/dismiss` updates the row and the toast disappears
   from the next poll's response.
8. **Latency reality-check**: the bit Drew and I are both nervous about. With a real (not synthetic)
   sub-threshold listing posted, measure end-to-end: market scan picks it up → detection fires →
   alert row exists → next /api/alerts poll → toast renders. If best-case is 30s+, document it and
   let Drew decide whether snipe-loop alone is worth shipping or whether we need to look at scan
   cadence too.

## Open questions

1. **Sound asset**: Drew picks. Placeholder until then.
2. **Click-through URL**: confirm canonical form for "open this item on the Torn market".
3. **Where in `TornMarketsProcessor` to splice the snipe-loop**: pending GitNexus impact run.
4. **Polling cadence on the events-poll for future subscriber expansion**: not relevant for v1.
   Defer.

## Risks

- **Latency**: items at >$5k profit get sniped fast. If end-to-end best-case is >30s the toast will
  routinely fire after the listing's gone. Mitigate via snipe-loop + measurement; accept as partial
  outcome if scan cadence can't shrink without ToS issues.
- **`TornMarketsProcessor` change**: high-impact; gitnexus impact analysis required before edit.
- **`valueSellPrice` quality**: some items have null or stale sell prices. Detection must skip these
  (no false alerts on missing baselines).
- **Browser audio autoplay policy**: first sound after page load won't play until a user
  interaction. Document this; not a blocker for Drew (he uses the app, he interacts with it).
- **Cache and hot-set drift**: if the in-memory hot-set in `TornMarketsProcessor` diverges from the
  DB (e.g. an alert is dismissed but the processor still interleaves), worst case is a few extra
  polls before the next hot-set sync. Acceptable.

## Milestones

| #   | Milestone                        | Notes                                                                            |
| --- | -------------------------------- | -------------------------------------------------------------------------------- |
| 1   | GitNexus impact + recon          | `TornMarketsProcessor`, listings-write path, current ApiController auth pattern. |
| 2   | Schema migration + entity + repo | `V1.25__bargain_alerts.sql`, entity, repository methods.                         |
| 3   | Detection on listings-write hook | `EvaluateBargainsAsync`, idempotency check.                                      |
| 4   | Auth seam + 3 endpoints          | `IBargainAlertAuthService`, `GET /authorised`, `GET /active`, `POST /dismiss`.   |
| 5   | Snipe-loop in processor          | Bounded interleave, hot-set sync.                                                |
| 6   | Frontend context + polling       | Visibility-aware short-poll, seen-set.                                           |
| 7   | Toast component + styling        | Persistent, counter, dismiss, "Too late!" variant.                               |
| 8   | Sound integration                | Placeholder asset; Drew swaps.                                                   |
| 9   | End-to-end synthetic test        | Verification steps 3–7 above.                                                    |
| 10  | Latency reality-check            | Verification step 8 — defer-or-ship judgement call.                              |

Stop after each milestone for `dotnet build` + `npx tsc --noEmit` + a quick gut-check.
