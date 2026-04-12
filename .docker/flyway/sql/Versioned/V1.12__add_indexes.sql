-- listings: no indexes existed beyond PK
-- Covers: GetListingsByItemIdAsync, GetListingsBySourceAndItemIdAsync,
--         DeleteListingsBySourceAndItemIdAsync, ReplaceListingsAsync,
--         and the item_id join in the profitable_listings view.
CREATE INDEX ix_listings_item_id_source
  ON public.listings (item_id, source);

-- item_change_logs: no indexes existed beyond PK
-- Covers: GetItemPriceHistoryAsync / GetItemVelocityHistoryAsync (per-item time-range query),
--         and the item_id join in market_velocity / updated_markets.
CREATE INDEX ix_item_change_logs_item_id_change_time
  ON public.item_change_logs (item_id, change_time);

-- Covers: GetRecentItemChangeLogsAsync and the time-window filter in updated_markets.
CREATE INDEX ix_item_change_logs_change_time
  ON public.item_change_logs (change_time);

-- users: no indexes existed beyond PK
-- Covers: GetNextApiKeyAsync (filter + ORDER BY api_key_last_used for round-robin key rotation)
--         and GetApiKeyCountAsync (same filter, no sort).
CREATE INDEX ix_users_key_available_api_key_last_used
  ON public.users (key_available, api_key_last_used);

-- queue_items: existing index included created_at but GetNextQueueItemAsync orders by queue_index.
-- Drop and recreate so the index can satisfy both the WHERE and the ORDER BY without a sort step.
DROP INDEX IF EXISTS public.ix_queue_items_item_status_next_attempt_at_created_at;

CREATE INDEX ix_queue_items_item_status_next_attempt_at_queue_index
  ON public.queue_items (item_status, next_attempt_at, queue_index);
