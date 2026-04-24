using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;

public class ItemVolatilityStatsRepository(
    ILogger<ItemVolatilityStatsRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<ItemVolatilityStatsRepository>(logger, dbContext), IItemVolatilityStatsRepository
{
  // Rebuild both the legacy single-bucket stats and the new median-window
  // stats in one query. Scope to the last 30 days up front (the baseline
  // window depth); items that haven't traded for longer get NULL latest
  // values, which is honest rather than stale.
  //
  // Thresholds (see Top Movers review 2026-04-24):
  //   recent window: last 24h, median of bucket averages, min 3 buckets
  //   baseline:      NOW-30d to NOW-1d, min 10 buckets
  //   dispersion:    CV of daily medians over 30d, min 14 days, mean > 0
  // Items failing a threshold get NULL in the new columns, which excludes
  // them from the z-score ranking automatically.
  private const string RebuildQuery = """
    WITH bucket_avgs AS (
      SELECT
        item_id,
        source,
        bucket_start,
        change_count,
        sum_price::numeric / change_count AS avg_price
      FROM public.item_change_log_summaries
      WHERE change_count > 0
        AND bucket_start >= NOW() - INTERVAL '30 days'
    ),
    -- Legacy snapshots
    latest_prices AS (
      SELECT DISTINCT ON (item_id, source)
        item_id, source, avg_price
      FROM bucket_avgs
      ORDER BY item_id, source, bucket_start DESC
    ),
    price_1d_ago AS (
      SELECT DISTINCT ON (item_id, source)
        item_id, source, avg_price
      FROM bucket_avgs
      WHERE bucket_start <= NOW() - INTERVAL '1 day'
      ORDER BY item_id, source, bucket_start DESC
    ),
    price_1w_ago AS (
      SELECT DISTINCT ON (item_id, source)
        item_id, source, avg_price
      FROM bucket_avgs
      WHERE bucket_start <= NOW() - INTERVAL '7 days'
      ORDER BY item_id, source, bucket_start DESC
    ),
    -- Window/baseline medians for the new ranking
    recent_window AS (
      SELECT
        item_id,
        source,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price) AS median_price,
        COUNT(*)::int4 AS n
      FROM bucket_avgs
      WHERE bucket_start >= NOW() - INTERVAL '1 day'
      GROUP BY item_id, source
    ),
    baseline_window AS (
      SELECT
        item_id,
        source,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price) AS median_price,
        COUNT(*)::int4 AS n
      FROM bucket_avgs
      WHERE bucket_start <  NOW() - INTERVAL '1 day'
        AND bucket_start >= NOW() - INTERVAL '30 days'
      GROUP BY item_id, source
    ),
    -- Daily medians feed the dispersion (CV) calculation
    daily_medians AS (
      SELECT
        item_id,
        source,
        date_trunc('day', bucket_start) AS day,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price) AS daily_median
      FROM bucket_avgs
      GROUP BY item_id, source, date_trunc('day', bucket_start)
    ),
    dispersion AS (
      SELECT
        item_id,
        source,
        COUNT(*)::int4 AS day_count,
        CASE
          WHEN COUNT(*) >= 14 AND AVG(daily_median) > 0
          THEN stddev_samp(daily_median) / AVG(daily_median)
        END AS price_dispersion
      FROM daily_medians
      GROUP BY item_id, source
    ),
    -- Change counts (24h / 7d)
    counts AS (
      SELECT
        item_id,
        source,
        SUM(CASE WHEN bucket_start >= NOW() - INTERVAL '1 day'  THEN change_count ELSE 0 END)::int4 AS changes_1d,
        SUM(CASE WHEN bucket_start >= NOW() - INTERVAL '7 days' THEN change_count ELSE 0 END)::int4 AS changes_1w
      FROM public.item_change_log_summaries
      WHERE bucket_start >= NOW() - INTERVAL '7 days'
      GROUP BY item_id, source
    )
    INSERT INTO public.item_volatility_stats (
      item_id, source, computed_at,
      changes_1d, changes_1w,
      current_price, price_change_1d, price_change_1w,
      window_price, baseline_price,
      sample_count_recent, sample_count_baseline,
      price_dispersion, move_pct_window
    )
    SELECT
      c.item_id,
      c.source,
      NOW(),
      c.changes_1d,
      c.changes_1w,
      -- Legacy current_price = latest bucket average
      ROUND(lp.avg_price)::int8,
      CASE WHEN d1.avg_price > 0 AND lp.avg_price IS NOT NULL
           THEN ROUND((lp.avg_price - d1.avg_price) / d1.avg_price, 4)
      END,
      CASE WHEN w1.avg_price > 0 AND lp.avg_price IS NOT NULL
           THEN ROUND((lp.avg_price - w1.avg_price) / w1.avg_price, 4)
      END,
      -- New window_price: only when the recent window has enough buckets
      CASE WHEN rw.n >= 3 THEN ROUND(rw.median_price)::int8 END,
      CASE WHEN bw.n >= 10 THEN ROUND(bw.median_price)::int8 END,
      COALESCE(rw.n, 0),
      COALESCE(bw.n, 0),
      ROUND(disp.price_dispersion, 6),
      -- Fractional move of the window median against the baseline median
      CASE
        WHEN rw.n >= 3 AND bw.n >= 10 AND bw.median_price > 0
        THEN ROUND((rw.median_price - bw.median_price) / bw.median_price, 4)
      END
    FROM counts c
    LEFT JOIN latest_prices    lp   USING (item_id, source)
    LEFT JOIN price_1d_ago     d1   USING (item_id, source)
    LEFT JOIN price_1w_ago     w1   USING (item_id, source)
    LEFT JOIN recent_window    rw   USING (item_id, source)
    LEFT JOIN baseline_window  bw   USING (item_id, source)
    LEFT JOIN dispersion       disp USING (item_id, source)
    ON CONFLICT (item_id, source) DO UPDATE SET
      computed_at           = EXCLUDED.computed_at,
      changes_1d            = EXCLUDED.changes_1d,
      changes_1w            = EXCLUDED.changes_1w,
      current_price         = EXCLUDED.current_price,
      price_change_1d       = EXCLUDED.price_change_1d,
      price_change_1w       = EXCLUDED.price_change_1w,
      window_price          = EXCLUDED.window_price,
      baseline_price        = EXCLUDED.baseline_price,
      sample_count_recent   = EXCLUDED.sample_count_recent,
      sample_count_baseline = EXCLUDED.sample_count_baseline,
      price_dispersion      = EXCLUDED.price_dispersion,
      move_pct_window       = EXCLUDED.move_pct_window;
    """;

  public async Task RebuildStatsAsync(CancellationToken stoppingToken)
  {
    await DbContext.Database.ExecuteSqlRawAsync(RebuildQuery, stoppingToken);
  }

  public async Task<IEnumerable<ItemVolatilityStatsDto>> GetTopAsync(
      Source source,
      VolatilitySortKey sortKey,
      int limit,
      bool ascending,
      CancellationToken stoppingToken)
  {
    var query = DbContext.Set<ItemVolatilityStatsEntity>()
        .AsNoTracking()
        .Where(s => s.Source == source.ToString());

    // Ranking thresholds for the new z-score sort — keep in sync with
    // the values documented in the Top Movers review and exercised in
    // the analysis/ exploration scripts.
    const decimal MinAbsMovePct = 0.10m;   // item must have moved at least 10%
    const decimal MinAbsZScore = 1.0m;     // ... and at least 1 dispersion-σ

    query = (sortKey, ascending) switch
    {
      (VolatilitySortKey.Changes1d, false) => query.OrderByDescending(s => s.Changes1d),
      (VolatilitySortKey.Changes1d, true) => query.OrderBy(s => s.Changes1d),
      (VolatilitySortKey.Changes1w, false) => query.OrderByDescending(s => s.Changes1w),
      (VolatilitySortKey.Changes1w, true) => query.OrderBy(s => s.Changes1w),
      (VolatilitySortKey.PriceChange1d, false) => query
          .Where(s => s.PriceChange1d != null)
          .OrderByDescending(s => s.PriceChange1d),
      (VolatilitySortKey.PriceChange1d, true) => query
          .Where(s => s.PriceChange1d != null)
          .OrderBy(s => s.PriceChange1d),
      (VolatilitySortKey.PriceChange1w, false) => query
          .Where(s => s.PriceChange1w != null)
          .OrderByDescending(s => s.PriceChange1w),
      (VolatilitySortKey.PriceChange1w, true) => query
          .Where(s => s.PriceChange1w != null)
          .OrderBy(s => s.PriceChange1w),
      (VolatilitySortKey.MoveZScore1d, false) => query
          .Where(s => s.MovePctWindow != null
                   && s.PriceDispersion != null
                   && s.PriceDispersion > 0
                   && (s.MovePctWindow >= MinAbsMovePct || s.MovePctWindow <= -MinAbsMovePct)
                   && (s.MovePctWindow / s.PriceDispersion >= MinAbsZScore
                    || s.MovePctWindow / s.PriceDispersion <= -MinAbsZScore))
          .OrderByDescending(s => s.MovePctWindow / s.PriceDispersion),
      (VolatilitySortKey.MoveZScore1d, true) => query
          .Where(s => s.MovePctWindow != null
                   && s.PriceDispersion != null
                   && s.PriceDispersion > 0
                   && (s.MovePctWindow >= MinAbsMovePct || s.MovePctWindow <= -MinAbsMovePct)
                   && (s.MovePctWindow / s.PriceDispersion >= MinAbsZScore
                    || s.MovePctWindow / s.PriceDispersion <= -MinAbsZScore))
          .OrderBy(s => s.MovePctWindow / s.PriceDispersion),
      _ => query.OrderByDescending(s => s.Changes1d),
    };

    var results = await query.Take(limit).ToListAsync(stoppingToken);
    return results.Select(r => r.AsDto());
  }
}
