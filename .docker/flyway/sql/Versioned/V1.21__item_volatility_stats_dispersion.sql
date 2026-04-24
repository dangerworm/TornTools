-- Top Movers redesign (first slice). Replaces the single-bucket
-- latest/baseline semantics with:
--   window_price           median of bucket averages over the last 24h
--   baseline_price         median of bucket averages over NOW-30d to NOW-1d
--   sample_count_recent    number of buckets in the recent window
--   sample_count_baseline  number of buckets in the baseline window
--   price_dispersion       CV (stddev/mean) of daily medians over 30 days
--   move_pct_window        (window_price - baseline_price) / baseline_price,
--                          stored rather than derived so the ranking query
--                          can filter on it without re-computing.
--
-- The widget's z-scored ranking is derived at read time as
-- move_pct_window / price_dispersion; no need to store it.
--
-- Legacy columns (current_price, price_change_1d/_1w) stay populated
-- during the overlap window. A follow-up migration can drop them once
-- nothing reads them.

ALTER TABLE public.item_volatility_stats
  ADD COLUMN window_price          int8         NULL,
  ADD COLUMN baseline_price        int8         NULL,
  ADD COLUMN sample_count_recent   int4         NOT NULL DEFAULT 0,
  ADD COLUMN sample_count_baseline int4         NOT NULL DEFAULT 0,
  ADD COLUMN price_dispersion      numeric(12, 6) NULL,
  ADD COLUMN move_pct_window       numeric(10, 4) NULL;
