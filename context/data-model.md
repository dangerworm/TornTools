# Data Model

## Database Tables

### `items`

Master catalogue populated from Torn API (`/torn/items`). ~35 columns.

Key columns:

- `id` int PK - Torn item ID
- `name`, `type`, `sub_type`, `image`, `description`, `effect`, `requirement`
- `value_buy_price`, `value_sell_price`, `value_market_price` - city buy/sell + item market price
- `value_vendor_country`, `value_vendor_name` - which NPC sells it and where
- `damage_base_stat`, `accuracy_base_stat`, `armor_base_stat` - weapon/armor stats
- `ammo_id`, `ammo_name`, `magazine_rounds`, `rate_of_fire`
- `is_masked`, `is_tradable`, `is_found_in_city`, `circulation`
- `last_updated`

### `listings`

Individual market listings scraped from Torn item market and Weav3r bazaar.

Key columns:

- `id` UUID PK
- `correlation_id` UUID - groups listings from the same scan batch
- `item_id` FK → items
- `listing_position` - position in the market list
- `time_seen` - when scanned
- `price`, `quantity`
- `source` - enum: Torn | Weav3r

Max listings stored per item: `QueryConstants.NumberOfListingsToStorePerItem = 50`

### `item_change_logs`

Price change history - appended whenever a new price is observed.

Columns: `id`, `item_id` FK, `source`, `change_time`, `new_price`

### `foreign_stock_items`

Current foreign country stock (sourced from Yata).

Composite PK: `(item_id, country)` Columns: `item_name`, `quantity`, `cost`, `last_updated`

### `users`

Authenticated TornTools users.

Columns: `id` (long - Torn user ID), `api_key`, `name`, `level`, `gender`, `key_available`,
`api_key_last_used`, `access_level`

### `user_favourites`

Composite PK: `(user_id, item_id)` - simple many-to-many join table.

### `queue_items`

Background job queue.

Columns: `id`, `queue_index`, `item_status` (Pending/InProgress/Completed/Failed),
`next_attempt_at`, `created_at`, `attempts`, `call_type` (ApiCallType enum), `endpoint_url`

---

## Database Views

### `profitable_listings`

Located: `.docker/flyway/sql/Repeatable/R__view_profitable_listings_view.sql`

Joins `items` + `listings`, filters where `price < value_sell_price OR price < value_market_price`.
Aggregates per item: `min_price`, `max_price`, `sum(quantity)`, `sum(price × quantity)` as
`total_cost`, `max(time_seen)` as `last_updated`.

**Hard-coded exclusion:** `item_id <> 335` - item 335 is excluded without explanation in the SQL.

### `market_velocity`

Located: `.docker/flyway/sql/Repeatable/R__view_market_velocity.sql`

CTE counts `item_change_logs` per item, then joins back to get individual change rows. **Issue:**
`ORDER BY` inside the CTE (`change_counts`) is non-standard and has no effect in PostgreSQL - it's
silently ignored.

---

## External API Models (`api/TornTools.Core/Models/`)

### Torn Items (`TornItems/`)

`ItemsPayload` → dict of item ID → `Item` → `ItemDetails`, `ItemValue` `ItemDetails` contains:
`Ammo` (rate of fire, magazine), `BaseStats` (damage/accuracy/armor), `Coverage`

### Torn Key (`TornKey/`)

`KeyPayload` → `Info` (access level, user), `Error`, `Log`, `Selections`

### Torn Market Listings (`TornMarketListings/`)

`Item` → `ItemMarket` → list of `Listing` (player ID, price, quantity)

### Weav3r Bazaar (`Weav3rBazaarListings/`)

`BazaarItemPayload` → list of `Listing`

### Yata Stocks (`YataStocks/`)

`ForeignStockItem` (item ID, name, country, quantity, cost)

---

## ApiCallType Enum

```txt
IGNORE
TornItems         - fetches full item catalogue
TornKeyInfo       - validates a user API key
TornMarketListings - fetches market listings for one item
Weav3rBazaarListings - fetches bazaar listings for one item
YataForeignStock  - fetches foreign country stock
```

## HistoryWindow Enum

Used as query param for history endpoints. Values defined in `TornTools.Core/Enums/HistoryWindow.cs`
with extension methods for SQL date range calculation.
