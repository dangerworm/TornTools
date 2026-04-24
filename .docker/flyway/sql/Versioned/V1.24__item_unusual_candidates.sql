-- "Unusual activity" pivot — first slice. One row per (item_id, source)
-- with multi-horizon stats flattened across columns. The home-page
-- endpoint reads this directly, ranked by unusualness_score (= max |z|
-- across horizons that met their min-sample thresholds).
--
-- Populated by a new Hangfire job RebuildUnusualCandidates, scheduled
-- 15 minutes after the existing volatility rebuild so they don't compete
-- for the connection pool. Same source data (item_change_log_summaries)
-- now at 1h buckets after V1.22.
--
-- Why a new table rather than columns on item_volatility_stats: that
-- table is shaped around a single horizon (24h vs 30d). Adding 4 sets
-- of horizon columns would make it wide and ugly, and the legacy fields
-- (current_price, price_change_1d/_1w) still have consumers we don't
-- want to disturb yet. Cleaner to grow this table independently and
-- retire the legacy one in a later slice.

CREATE TABLE public.item_unusual_candidates (
  "item_id"               int4           NOT NULL,
  "source"                text           NOT NULL,
  "computed_at"           timestamptz    NOT NULL,

  -- 30d trimmed median (10/90 percentile bounds) over NOW-30d to NOW-1d.
  -- Shared across horizons — the question the table answers is "where
  -- is this item right now relative to its month-long normal?"
  "baseline_price"        int8           NULL,
  -- Coefficient of variation of daily medians over the same 30d window.
  -- Used to scale the move into a z-score.
  "price_dispersion"      numeric(12, 6) NULL,

  -- 1h horizon
  "window_price_1h"       int8           NULL,
  "sample_count_1h"       int4           NOT NULL DEFAULT 0,
  "move_pct_1h"           numeric(10, 4) NULL,
  "z_score_1h"            numeric(10, 4) NULL,

  -- 6h horizon
  "window_price_6h"       int8           NULL,
  "sample_count_6h"       int4           NOT NULL DEFAULT 0,
  "move_pct_6h"           numeric(10, 4) NULL,
  "z_score_6h"            numeric(10, 4) NULL,

  -- 24h horizon
  "window_price_24h"      int8           NULL,
  "sample_count_24h"      int4           NOT NULL DEFAULT 0,
  "move_pct_24h"          numeric(10, 4) NULL,
  "z_score_24h"           numeric(10, 4) NULL,

  -- 7d horizon
  "window_price_7d"       int8           NULL,
  "sample_count_7d"       int4           NOT NULL DEFAULT 0,
  "move_pct_7d"           numeric(10, 4) NULL,
  "z_score_7d"            numeric(10, 4) NULL,

  -- Derived ranking signals
  -- unusualness_score = max(|z_score_*|) across the horizons whose
  -- z-score is non-null. Null when no horizon met its sample threshold.
  "unusualness_score"     numeric(10, 4) NULL,
  -- The horizon that produced the maximum |z|. One of '1h' | '6h' |
  -- '24h' | '7d'. Used by the widget to label "why flagged".
  "dominant_horizon"      text           NULL,
  -- Sign of the move in the dominant horizon. 'up' or 'down'.
  "direction"             text           NULL,

  CONSTRAINT item_unusual_candidates_pk PRIMARY KEY (item_id, source)
);

-- Partial index for the ranking query: order by score within source,
-- skipping rows that don't qualify (no horizon met its sample floor).
CREATE INDEX IF NOT EXISTS idx_iuc_score
  ON public.item_unusual_candidates (source, unusualness_score DESC)
  WHERE unusualness_score IS NOT NULL;
