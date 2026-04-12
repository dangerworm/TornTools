# TornTools — Codebase Insights

Observations made during a full codebase scan. Covers bugs, gaps, design decisions, and optimisation
opportunities.

---

## Bugs

### `GetProfitableListings` ignores request cancellation token

**File:** `api/TornTools.Api/Controllers/ApiController.cs:73` `GetProfitableListings()` takes no
`CancellationToken` parameter and passes `CancellationToken.None` to the service layer. If the
client disconnects, the DB query keeps running. The other endpoints pass the token correctly — this
is an oversight.

### `rows.sort()` mutates state in `useMemo`

**File:** `client/src/pages/Resale.tsx:61–64`

```tsx
const sortedRows = useMemo(
  () =>
    saleOutlet === "city"
      ? rows.sort((a, b) => b.cityProfit - a.cityProfit)
      : rows.sort((a, b) => b.marketProfit(taxType) - a.marketProfit(taxType)),
  [rows, saleOutlet]
);
```

`Array.prototype.sort` mutates in place. `rows` comes from a hook (`useResaleScan`), so this
silently mutates the original array on every render. Should use `[...rows].sort(...)`. Note also:
`taxType` is missing from the `useMemo` dependency array — when the user switches tax type, the sort
won't re-run.

### `ORDER BY` inside a CTE is a no-op in PostgreSQL

**File:** `.docker/flyway/sql/Repeatable/R__view_market_velocity.sql:15–20`

```sql
ORDER BY COUNT(icl.id) DESC
```

This `ORDER BY` is inside the `change_counts` CTE. PostgreSQL does not preserve CTE row order — the
outer query's own `ORDER BY` is what matters. The inner ordering is silently discarded and gives a
false sense that results are pre-sorted within the CTE.

### Hard-coded item exclusion with no explanation

**File:** `.docker/flyway/sql/Repeatable/R__view_profitable_listings_view.sql:28`

```sql
WHERE i.id <> 335
```

Item 335 is excluded from the profitable listings view with no comment. If this is a known
problematic item (e.g. one with bad data, always appearing incorrectly profitable), it should at
least have a comment, and ideally be handled via a flag on the `items` table (which already has
`is_masked`).

### `TornApiMultiKeyCaller` handles both `TornItems` and `TornMarketListings`

**File:** `api/TornTools.Application/Callers/TornApiMultiKeyCaller.cs:15–18` `TornItems` (the full
catalogue fetch) doesn't benefit from multi-key round-robin — it's a one-shot call, not per-item.
Using the multi-key caller for it means it's unnecessarily consuming from the shared pool.
`TornApiSingleKeyCaller` would be more appropriate, or at minimum this is worth documenting.

---

## Security

### API keys stored in plaintext

**File:** `api/TornTools.Persistence/Entities/` (UserEntity) User Torn API keys are stored
unencrypted in the `users` table. If the database is compromised, all keys are exposed. Given that
these keys grant access to players' Torn accounts (not just this app), this is a meaningful risk.
Consider encrypting at rest using a KV-stored key (Azure Key Vault is already in the infra).

### Hangfire dashboard has no access control

**File:** `api/TornTools.Api/Program.cs:42`

```csharp
app.UseHangfireDashboard("/hangfire");
```

No auth filter is applied to the Hangfire dashboard. In production this exposes the job queue,
execution history, and retry controls to anyone who knows the URL. Should add `DashboardOptions`
with an `IAuthorizationFilter`.

### `userId` passed from frontend is trusted without verification

**File:** `api/TornTools.Api/Controllers/ApiController.cs:100–115` `PostToggleUserFavourite` accepts
a `userId` in the request body and uses it directly. The JWT contains the authenticated user's ID —
the controller should verify `userId` matches the JWT claim (`ClaimTypes.NameIdentifier`) rather
than trusting the client-supplied value. Currently any authenticated user could manipulate another
user's favourites by sending a different `userId`.

Same issue applies to `PostUserThemeSelection` — `userId` from the body is used without
cross-checking the JWT.

---

## Code Quality

### `LoginInputModel` is missing validation attributes

**File:** `api/TornTools.Core/Models/InputModels/` Input models have no `[Required]`,
`[StringLength]`, or other data annotation validators. A null `ApiKey` would reach the Torn API call
and cause a confusing downstream error rather than a clean 400.

### Catch blocks swallow errors silently in frontend API layer

**File:** `client/src/lib/dotnetapi.ts` (multiple functions) The pattern used throughout:

```ts
try {
  data = await res.json();
} catch {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}
```

This means: if the response is HTTP 200 but the body is not valid JSON (e.g. an empty body, or HTML
error page), the catch block runs, the condition `!res.ok` is false, and the function silently
returns an empty default. Bugs like the backend returning the wrong content type would be invisible.

### `console.warn` left in production paths

**File:** `client/src/contexts/UserContext.tsx:143, 176`
`console.warn('Cannot confirm API key: missing apiKey')` and similar are left in paths that could
legitimately fire in production. These should either be removed, or surfaced as proper error state.

### `(e as any)?.name === 'AbortError'` type cast

**File:** `client/src/contexts/UserContext.tsx:105` Using `as any` to check `AbortError` — this can
be done cleanly with `e instanceof DOMException && e.name === 'AbortError'`.

### Route `[controller]/[action]` on `ApiController`

**File:** `api/TornTools.Api/Controllers/ApiController.cs:9` Using
`[Route("[controller]/[action]")]` produces URLs like `/api/GetItems`,
`/api/PostToggleUserFavourite`. This is an RPC-style naming convention mixed into a REST-ish API. It
also means method names are tightly coupled to routes. A conventional REST design (`GET /api/items`,
`POST /api/users/{id}/favourites`) would be easier to evolve, more cacheable, and align better with
HTTP semantics.

---

## Architecture & Design

### No tests

There is no test project in the solution and no test files in the client. The GitHub Actions
`build-code.yml` just builds — it doesn't run tests. This means regressions can only be caught
manually.

### Single `IDatabaseService` does everything

**File:** `api/TornTools.Application/Interfaces/IDatabaseService.cs` The service interface covers
items, listings, queue, API keys, users, favourites, and themes — ~20+ methods. It's a God Object.
As the app grows, splitting by domain (e.g. `IItemService`, `IQueueService`, `IUserService`) would
make responsibilities clearer and reduce the blast radius of changes.

### `QueueProcessor` is a single-threaded hosted service

**File:** `api/TornTools.Cron/` The queue is processed serially. This is fine for now, but
horizontal scaling (multiple instances) would cause duplicate processing — there's no distributed
lock or claim-based queue ownership. Worth noting if Azure App Service scaling is ever considered.

### `profitable_listings` is a view, not a materialised view

The view re-runs the full aggregation join on every request to `/api/GetProfitableListings`. For a
table with high listing churn (regular scans), this could become expensive under load. PostgreSQL
doesn't have built-in materialised view auto-refresh, but a scheduled refresh (e.g. via Hangfire)
would help.

### Frontend calls Torn API directly, exposing user API key in browser

**File:** `client/src/lib/tornapi.ts`, `client/src/contexts/UserContext.tsx` The Torn API key is
stored in `localStorage` and sent directly from the browser to api.torn.com. This is necessary for
the sign-in preview flow, but means the key is visible to browser devtools and any JS running on the
page. A server-side proxy for key validation would prevent key exposure.

### `localStorage` cache versioning could cause stale data on deploy

Cache keys are versioned with `:v1` suffixes (e.g. `torntools:user:torn:apiKey:v1`). If the shape of
cached data changes, the version should be bumped — but this is a manual process with no
enforcement. Consider a cache-busting strategy tied to the app version.

### No loading state on initial item catalogue fetch

If `ItemsContext` hasn't loaded (first visit, expired cache), pages that depend on `items` may
render empty tables without a clear loading indicator at the page level. Each page handles this
differently.

---

## Optimisation

### `GetAllItemsAsync` returns the full catalogue on every fetch

**File:** `client/src/lib/dotnetapi.ts:58` The items endpoint returns all items (potentially
thousands) with no pagination or filtering. The frontend caches for 1 hour, which mitigates this,
but there's no `ETag`/`Last-Modified` support to avoid transferring unchanged data.

### Listings replaced wholesale on each scan

The `ReplaceListings` pattern deletes and re-inserts all listings for an item on each scan. For
high-frequency items this creates significant write amplification. An upsert-by-position/price
approach would reduce I/O and preserve history better.

### `market_velocity` view joins and re-scans all change logs

There's no date filter in the velocity view — it aggregates the entire `item_change_logs` table.
This will become increasingly slow as history accumulates. The Hangfire volatility job (backlog
card) is the right fix — pre-compute and store snapshots rather than querying raw history on demand.

---

## Minor / Cosmetic

- The `*` catch-all route renders a bare `<h1>Not Found</h1>` with no layout or styling.
- `menuItems` config is checked inside `Resale.tsx` to determine if login is required — business
  logic in a display component. This config check should live in a hook or route guard.
- `SameSite=None` on the auth cookie requires `Secure=true` (which is set), but this means the
  cookie won't work over plain HTTP at all — no local dev without HTTPS or a proxy.
- The `torn-war-checker.html` in the repo root appears to be an unrelated standalone utility.
