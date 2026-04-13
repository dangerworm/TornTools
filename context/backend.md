# Backend Navigation

## Controllers (`api/TornTools.Api/Controllers/`)

### ApiController

Route: `[controller]/[action]` → `/api/*`

| Method | Endpoint                       | Auth | Notes                                 |
| ------ | ------------------------------ | ---- | ------------------------------------- |
| GET    | `/api/GetItems`                | None | Returns all items from DB             |
| GET    | `/api/GetForeignStockItems`    | None | Returns Yata-sourced foreign stock    |
| GET    | `/api/GetProfitableListings`   | None | Queries `profitable_listings` DB view |
| POST   | `/api/PostToggleUserFavourite` | JWT  | Body: `{ userId, itemId, add }`       |
| GET    | `/api/GetThemes`               | None | Optional `?userId=` query param       |
| POST   | `/api/PostTheme`               | JWT  | Upsert custom theme                   |
| POST   | `/api/PostUserThemeSelection`  | JWT  | Set preferred theme                   |

Note: `GetProfitableListings` passes `CancellationToken.None` instead of the request token - a minor
bug.

### AuthController

Route: `/auth`

| Method | Endpoint       | Notes                                                            |
| ------ | -------------- | ---------------------------------------------------------------- |
| POST   | `/auth/login`  | Validates API key twice vs Torn, upserts user, issues JWT cookie |
| GET    | `/auth/me`     | Requires JWT; returns current user from DB                       |
| POST   | `/auth/logout` | Clears auth cookie                                               |

JWT cookie: `httpOnly`, `Secure`, `SameSite=None`, 30-day expiry.

### ItemHistoryController

Route: `/api/items/{itemId}/history/`

| Method | Endpoint                           | Query params                    |
| ------ | ---------------------------------- | ------------------------------- |
| GET    | `/api/items/{id}/history/price`    | `?window=` (HistoryWindow enum) |
| GET    | `/api/items/{id}/history/velocity` | `?window=`                      |

---

## Application Layer (`api/TornTools.Application/`)

### API Callers

All extend `ApiCaller<T>` (`Callers/ApiCaller.cs`). The base class handles HTTP execution, auth
header injection, body serialisation, and error logging (with key hints like `key ABCD****`).

| Caller                   | Handles                       | Auth mechanism                                  |
| ------------------------ | ----------------------------- | ----------------------------------------------- |
| `TornApiMultiKeyCaller`  | TornItems, TornMarketListings | Round-robin from DB key pool                    |
| `TornApiSingleKeyCaller` | TornKeyInfo                   | Uses specific user key                          |
| `WeaveApiCaller`         | Weav3rBazaarListings          | Python sidecar (curl_cffi, bypasses CloudFlare) |
| `YataApiCaller`          | YataForeignStock              | No auth required                                |

`ApiCallerResolver` maps `ApiCallType → IApiCaller`.

### API Call Handlers

Extend `ApiCallHandler` or `ListingApiCallHandler`. Called after a successful HTTP response.

| Handler                              | Processes                         |
| ------------------------------------ | --------------------------------- |
| `TornItemsApiCallHandler`            | Upserts items catalogue           |
| `TornKeyApiCallHandler`              | Validates API key health          |
| `TornMarketListingsApiCallHandler`   | Replaces listings for item        |
| `Weav3rBazaarListingsApiCallHandler` | Replaces Weav3r listings for item |
| `YataStocksApiCallHandler`           | Upserts foreign stock rows        |

`ApiCallHandlerResolver` maps `ApiCallType → IApiCallHandler`.

### IDatabaseService (`Application/Interfaces/`)

Single service interface. Key method groups:

- Items: `GetAllItemsAsync`, `UpsertItemsAsync`, `GetItemPriceHistoryAsync`,
  `GetItemVelocityHistoryAsync`
- Listings: `CreateListingsAsync`, `GetListingsBySourceAndItemIdAsync`, `ReplaceListingsAsync`
- Queue: `PopulateQueueAsync`, `GetNextQueueItemAsync`, `IncrementAttemptsAsync`,
  `RemoveQueueItemAsync`
- API keys: `GetApiKeyCountAsync`, `GetNextApiKeyAsync`, `MarkKeyUnavailableAsync`
- Users: `GetUserByIdAsync`, `UpsertUserDetailsAsync`, `ToggleUserFavouriteAsync`
- Themes: `GetThemesAsync`, `UpsertThemeAsync`, `UpdateUserPreferredThemeAsync`

---

## Persistence Layer (`api/TornTools.Persistence/`)

### Entities → Tables

| Entity                         | Table                 | Key                           |
| ------------------------------ | --------------------- | ----------------------------- |
| `ItemEntity`                   | `items`               | `id` (int)                    |
| `ListingEntity`                | `listings`            | `id` (UUID)                   |
| `ItemChangeLogEntity`          | `item_change_logs`    | `id`                          |
| `ItemMarketHistoryPointEntity` | (view)                | no PK - query-only            |
| `ForeignStockItemEntity`       | `foreign_stock_items` | `(itemId, country)` composite |
| `UserEntity`                   | `users`               | `id` (long) - Torn user ID    |
| `UserFavouriteItemEntity`      | `user_favourites`     | `(userId, itemId)` composite  |
| `ThemeEntity`                  | `themes`              | `id`                          |
| `QueueItemEntity`              | `queue_items`         | `id`                          |

### DB Views

- `profitable_listings` - joins `items` + `listings` where
  `price < sell_price OR price < market_price`, groups by item. Hard-coded exclusion:
  `item_id <> 335`.
- `market_velocity` - joins `item_change_logs` + `items`, orders by change frequency.

### Repositories

All extend `RepositoryBase`. Pattern: inject `TornToolsDbContext`, call `SaveChangesAsync`.

- Bulk inserts use `DatabaseConstants.BulkUpdateSize` batching.

---

## Background Processing (`api/TornTools.Cron/`)

### QueueProcessor (IHostedService)

Continuous polling loop:

1. Dequeue next item (`GetNextQueueItemAsync`)
2. Resolve caller + handler via resolvers
3. Execute API call
4. On success: remove from queue; on failure: increment attempts, set `NextAttemptAt`
5. Queue repopulates automatically when exhausted (`PopulateQueueAsync`)

### Rate Limiting

Torn market calls: `delay = 60000 / (maxCallsPerMin × 0.8 × keyCount)` ms Weav3r: fixed delay based
on API limit constant Uses 80% of limit as a conservative buffer.

### ApiJobScheduler

Registers recurring Hangfire jobs (queue population on a schedule).

---

## Auth & Security

- JWT signing via `JwtService` (`api/TornTools.Api/Authentication/JwtService.cs`)
- Claims: `NameIdentifier` = Torn user ID (long), `Name` = username
- Config: `appsettings.json` → JWT issuer/audience both "TornTools", expiry in `JwtConfiguration`
- CORS configured in `ServiceCollectionExtensions.cs` - credentials allowed, origin from config
- Hangfire dashboard exposed at `/hangfire` with no access control in dev

---

## Configuration Constants (`api/TornTools.Core/Constants/`)

| File                    | Key values                                                                        |
| ----------------------- | --------------------------------------------------------------------------------- |
| `ApiConstants.cs`       | CORS policy name                                                                  |
| `TornApiConstants.cs`   | Torn API base URL, client name, rate limits, endpoint paths                       |
| `Weav3rApiConstants.cs` | Weav3r endpoint URLs                                                              |
| `YataApiConstants.cs`   | Yata endpoint URL                                                                 |
| `DatabaseConstants.cs`  | Bulk update batch size                                                            |
| `QueryConstants.cs`     | `MinSellPrice=100`, `MaxSellPrice=100000000`, `NumberOfListingsToStorePerItem=50` |
| `CountryConstants.cs`   | Country code ↔ name mapping                                                       |
| `TimeConstants.cs`      | Time-related constants                                                            |

---

## Migrations (`/.docker/flyway/sql/`)

Versioned (`Versioned/V1.x__`):
`audit → items → call_queue → listings → item_change_logs → users → user_favourites → foreign_stock_items → themes → add_last_updated_to_items → add_key_status_to_users`

Repeatable (`Repeatable/R__`):

- `R__func_updated_markets.sql` - stored procedure
- `R__view_market_velocity.sql` - velocity view
- `R__view_profitable_listings_view.sql` - profitable listings view
