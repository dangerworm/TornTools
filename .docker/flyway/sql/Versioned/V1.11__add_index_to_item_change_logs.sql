CREATE INDEX CONCURRENTLY IF NOT EXISTS
  ix_item_change_logs_item_id_change_time
ON public.item_change_logs (item_id, change_time);