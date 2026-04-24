-- Pre-computed per-item volatility and price-change stats, refreshed by a
-- scheduled Hangfire job. Keeps the home page / "interesting items" /
-- volatility slider queries off the raw change-log history.

CREATE TABLE public.item_volatility_stats (
  "item_id"         int4        NOT NULL,
  "source"          text        NOT NULL,
  "computed_at"     timestamptz NOT NULL,
  "changes_1d"      int4        NOT NULL DEFAULT 0,
  "changes_1w"      int4        NOT NULL DEFAULT 0,
  "current_price"   int8,
  "price_change_1d" numeric(10, 4),
  "price_change_1w" numeric(10, 4),

  CONSTRAINT item_volatility_stats_pk PRIMARY KEY (item_id, source)
);

-- Sort indexes for the top-movers endpoint: most-active, biggest risers,
-- biggest fallers. Partial indexes skip the huge number of rows with zero
-- activity / null deltas.
CREATE INDEX IF NOT EXISTS idx_ivs_changes_1d
  ON public.item_volatility_stats (source, changes_1d DESC)
  WHERE changes_1d > 0;

CREATE INDEX IF NOT EXISTS idx_ivs_price_change_1d
  ON public.item_volatility_stats (source, price_change_1d DESC)
  WHERE price_change_1d IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ivs_price_change_1w
  ON public.item_volatility_stats (source, price_change_1w DESC)
  WHERE price_change_1w IS NOT NULL;
