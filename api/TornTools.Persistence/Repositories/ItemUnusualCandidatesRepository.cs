using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;

public class ItemUnusualCandidatesRepository(
    ILogger<ItemUnusualCandidatesRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<ItemUnusualCandidatesRepository>(logger, dbContext), IItemUnusualCandidatesRepository
{
  // Multi-horizon "unusual activity" rebuild. For each (item_id, source):
  //
  //   shared baseline:  trimmed median (10/90 bounds) over NOW-30d to
  //                     NOW-1d. Min 10 kept buckets.
  //   shared dispersion: CV of daily medians over 30d. Min 14 days.
  //
  //   per horizon (1h / 6h / 24h / 7d):
  //     window_price = median of bucket avgs in the horizon's window
  //     sample_count = N buckets in the window
  //     move_pct     = (window_price - baseline_price) / baseline_price
  //     z_score      = move_pct / dispersion
  //
  //   derived:
  //     unusualness_score = max(|z|) across horizons whose z is non-null
  //     dominant_horizon  = which horizon won
  //     direction         = sign of z in dominant horizon
  //
  // Min-sample thresholds per horizon (1h-bucket source data):
  //   1h: 1 bucket. 6h: 3 buckets. 24h: 6 buckets. 7d: 24 buckets.
  // Items failing a threshold get NULL for that horizon's quartet.
  //
  // percentile_cont returns double precision; we cast to numeric up-
  // front so downstream ROUND(x, n) calls hit the numeric overload
  // (same lesson learned in V1.21's volatility rebuild).
  private const string RebuildQuery = """
    WITH bucket_avgs AS (
      SELECT
        item_id,
        source,
        bucket_start,
        sum_price::numeric / change_count AS avg_price
      FROM public.item_change_log_summaries
      WHERE change_count > 0
        AND bucket_start >= NOW() - INTERVAL '30 days'
    ),
    -- Recent windows (one CTE per horizon)
    recent_1h AS (
      SELECT item_id, source,
        (percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price))::numeric AS median_price,
        COUNT(*)::int4 AS n
      FROM bucket_avgs
      WHERE bucket_start >= NOW() - INTERVAL '1 hour'
      GROUP BY item_id, source
    ),
    recent_6h AS (
      SELECT item_id, source,
        (percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price))::numeric AS median_price,
        COUNT(*)::int4 AS n
      FROM bucket_avgs
      WHERE bucket_start >= NOW() - INTERVAL '6 hours'
      GROUP BY item_id, source
    ),
    recent_24h AS (
      SELECT item_id, source,
        (percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price))::numeric AS median_price,
        COUNT(*)::int4 AS n
      FROM bucket_avgs
      WHERE bucket_start >= NOW() - INTERVAL '1 day'
      GROUP BY item_id, source
    ),
    recent_7d AS (
      SELECT item_id, source,
        (percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price))::numeric AS median_price,
        COUNT(*)::int4 AS n
      FROM bucket_avgs
      WHERE bucket_start >= NOW() - INTERVAL '7 days'
      GROUP BY item_id, source
    ),
    -- Trimmed-median baseline (10/90 bounds first, then median over what's between)
    baseline_bounds AS (
      SELECT item_id, source,
        (percentile_cont(0.10) WITHIN GROUP (ORDER BY avg_price))::numeric AS p10,
        (percentile_cont(0.90) WITHIN GROUP (ORDER BY avg_price))::numeric AS p90
      FROM bucket_avgs
      WHERE bucket_start <  NOW() - INTERVAL '1 day'
        AND bucket_start >= NOW() - INTERVAL '30 days'
      GROUP BY item_id, source
    ),
    baseline_window AS (
      SELECT b.item_id, b.source,
        (percentile_cont(0.5) WITHIN GROUP (ORDER BY b.avg_price))::numeric AS median_price,
        COUNT(*)::int4 AS n
      FROM bucket_avgs b
      JOIN baseline_bounds bb USING (item_id, source)
      WHERE b.bucket_start <  NOW() - INTERVAL '1 day'
        AND b.bucket_start >= NOW() - INTERVAL '30 days'
        AND b.avg_price BETWEEN bb.p10 AND bb.p90
      GROUP BY b.item_id, b.source
    ),
    -- Dispersion = CV of daily medians over 30d
    daily_medians AS (
      SELECT item_id, source,
        date_trunc('day', bucket_start) AS day,
        (percentile_cont(0.5) WITHIN GROUP (ORDER BY avg_price))::numeric AS daily_median
      FROM bucket_avgs
      GROUP BY item_id, source, date_trunc('day', bucket_start)
    ),
    dispersion AS (
      SELECT item_id, source,
        CASE
          WHEN COUNT(*) >= 14 AND AVG(daily_median) > 0
          THEN stddev_samp(daily_median) / AVG(daily_median)
        END AS price_dispersion
      FROM daily_medians
      GROUP BY item_id, source
    ),
    -- Combine baseline + dispersion + per-horizon stats and derive z-scores
    combined AS (
      SELECT
        bw.item_id,
        bw.source,
        ROUND(bw.median_price)::int8 AS baseline_price,
        bw.n AS baseline_n,
        ROUND(disp.price_dispersion, 6) AS price_dispersion,

        CASE WHEN r1.n >= 1 THEN ROUND(r1.median_price)::int8 END AS window_price_1h,
        COALESCE(r1.n, 0) AS sample_count_1h,
        CASE WHEN r1.n >= 1 AND bw.median_price > 0
             THEN ROUND((r1.median_price - bw.median_price) / bw.median_price, 4) END AS move_pct_1h,
        CASE WHEN r1.n >= 1 AND bw.median_price > 0 AND disp.price_dispersion > 0
             THEN ROUND(((r1.median_price - bw.median_price) / bw.median_price) / disp.price_dispersion, 4) END AS z_score_1h,

        CASE WHEN r6.n >= 3 THEN ROUND(r6.median_price)::int8 END AS window_price_6h,
        COALESCE(r6.n, 0) AS sample_count_6h,
        CASE WHEN r6.n >= 3 AND bw.median_price > 0
             THEN ROUND((r6.median_price - bw.median_price) / bw.median_price, 4) END AS move_pct_6h,
        CASE WHEN r6.n >= 3 AND bw.median_price > 0 AND disp.price_dispersion > 0
             THEN ROUND(((r6.median_price - bw.median_price) / bw.median_price) / disp.price_dispersion, 4) END AS z_score_6h,

        CASE WHEN r24.n >= 6 THEN ROUND(r24.median_price)::int8 END AS window_price_24h,
        COALESCE(r24.n, 0) AS sample_count_24h,
        CASE WHEN r24.n >= 6 AND bw.median_price > 0
             THEN ROUND((r24.median_price - bw.median_price) / bw.median_price, 4) END AS move_pct_24h,
        CASE WHEN r24.n >= 6 AND bw.median_price > 0 AND disp.price_dispersion > 0
             THEN ROUND(((r24.median_price - bw.median_price) / bw.median_price) / disp.price_dispersion, 4) END AS z_score_24h,

        CASE WHEN r7d.n >= 24 THEN ROUND(r7d.median_price)::int8 END AS window_price_7d,
        COALESCE(r7d.n, 0) AS sample_count_7d,
        CASE WHEN r7d.n >= 24 AND bw.median_price > 0
             THEN ROUND((r7d.median_price - bw.median_price) / bw.median_price, 4) END AS move_pct_7d,
        CASE WHEN r7d.n >= 24 AND bw.median_price > 0 AND disp.price_dispersion > 0
             THEN ROUND(((r7d.median_price - bw.median_price) / bw.median_price) / disp.price_dispersion, 4) END AS z_score_7d
      FROM baseline_window bw
      LEFT JOIN dispersion disp USING (item_id, source)
      LEFT JOIN recent_1h r1   USING (item_id, source)
      LEFT JOIN recent_6h r6   USING (item_id, source)
      LEFT JOIN recent_24h r24 USING (item_id, source)
      LEFT JOIN recent_7d r7d  USING (item_id, source)
      WHERE bw.n >= 10
    ),
    -- Add the derived ranking columns
    scored AS (
      SELECT c.*,
        NULLIF(GREATEST(
          ABS(COALESCE(c.z_score_1h, 0)),
          ABS(COALESCE(c.z_score_6h, 0)),
          ABS(COALESCE(c.z_score_24h, 0)),
          ABS(COALESCE(c.z_score_7d, 0))
        ), 0) AS unusualness_score
      FROM combined c
    )
    INSERT INTO public.item_unusual_candidates (
      item_id, source, computed_at,
      baseline_price, price_dispersion,
      window_price_1h, sample_count_1h, move_pct_1h, z_score_1h,
      window_price_6h, sample_count_6h, move_pct_6h, z_score_6h,
      window_price_24h, sample_count_24h, move_pct_24h, z_score_24h,
      window_price_7d, sample_count_7d, move_pct_7d, z_score_7d,
      unusualness_score, dominant_horizon, direction
    )
    SELECT
      s.item_id,
      s.source,
      NOW(),
      s.baseline_price,
      s.price_dispersion,
      s.window_price_1h, s.sample_count_1h, s.move_pct_1h, s.z_score_1h,
      s.window_price_6h, s.sample_count_6h, s.move_pct_6h, s.z_score_6h,
      s.window_price_24h, s.sample_count_24h, s.move_pct_24h, s.z_score_24h,
      s.window_price_7d, s.sample_count_7d, s.move_pct_7d, s.z_score_7d,
      s.unusualness_score,
      -- Pick the horizon whose |z| matches the unusualness_score. Order
      -- of CASE arms is the tie-break (1h beats 6h beats 24h beats 7d
      -- if multiple horizons happen to have identical |z|).
      CASE
        WHEN s.z_score_1h  IS NOT NULL AND ABS(s.z_score_1h)  = s.unusualness_score THEN '1h'
        WHEN s.z_score_6h  IS NOT NULL AND ABS(s.z_score_6h)  = s.unusualness_score THEN '6h'
        WHEN s.z_score_24h IS NOT NULL AND ABS(s.z_score_24h) = s.unusualness_score THEN '24h'
        WHEN s.z_score_7d  IS NOT NULL AND ABS(s.z_score_7d)  = s.unusualness_score THEN '7d'
      END AS dominant_horizon,
      CASE
        WHEN s.z_score_1h  IS NOT NULL AND ABS(s.z_score_1h)  = s.unusualness_score THEN
          CASE WHEN s.z_score_1h  > 0 THEN 'up' WHEN s.z_score_1h  < 0 THEN 'down' END
        WHEN s.z_score_6h  IS NOT NULL AND ABS(s.z_score_6h)  = s.unusualness_score THEN
          CASE WHEN s.z_score_6h  > 0 THEN 'up' WHEN s.z_score_6h  < 0 THEN 'down' END
        WHEN s.z_score_24h IS NOT NULL AND ABS(s.z_score_24h) = s.unusualness_score THEN
          CASE WHEN s.z_score_24h > 0 THEN 'up' WHEN s.z_score_24h < 0 THEN 'down' END
        WHEN s.z_score_7d  IS NOT NULL AND ABS(s.z_score_7d)  = s.unusualness_score THEN
          CASE WHEN s.z_score_7d  > 0 THEN 'up' WHEN s.z_score_7d  < 0 THEN 'down' END
      END AS direction
    FROM scored s
    ON CONFLICT (item_id, source) DO UPDATE SET
      computed_at           = EXCLUDED.computed_at,
      baseline_price        = EXCLUDED.baseline_price,
      price_dispersion      = EXCLUDED.price_dispersion,
      window_price_1h       = EXCLUDED.window_price_1h,
      sample_count_1h       = EXCLUDED.sample_count_1h,
      move_pct_1h           = EXCLUDED.move_pct_1h,
      z_score_1h            = EXCLUDED.z_score_1h,
      window_price_6h       = EXCLUDED.window_price_6h,
      sample_count_6h       = EXCLUDED.sample_count_6h,
      move_pct_6h           = EXCLUDED.move_pct_6h,
      z_score_6h            = EXCLUDED.z_score_6h,
      window_price_24h      = EXCLUDED.window_price_24h,
      sample_count_24h      = EXCLUDED.sample_count_24h,
      move_pct_24h          = EXCLUDED.move_pct_24h,
      z_score_24h           = EXCLUDED.z_score_24h,
      window_price_7d       = EXCLUDED.window_price_7d,
      sample_count_7d       = EXCLUDED.sample_count_7d,
      move_pct_7d           = EXCLUDED.move_pct_7d,
      z_score_7d            = EXCLUDED.z_score_7d,
      unusualness_score     = EXCLUDED.unusualness_score,
      dominant_horizon      = EXCLUDED.dominant_horizon,
      direction             = EXCLUDED.direction;
    """;

  public async Task RebuildAsync(CancellationToken stoppingToken)
  {
    await DbContext.Database.ExecuteSqlRawAsync(RebuildQuery, stoppingToken);
  }

  public async Task<IEnumerable<ItemUnusualCandidateDto>> GetTopAsync(
      Source source,
      int limit,
      decimal minScore,
      CancellationToken stoppingToken)
  {
    var sourceName = source.ToString();
    var results = await DbContext.Set<ItemUnusualCandidatesEntity>()
        .AsNoTracking()
        .Where(s => s.Source == sourceName
                 && s.UnusualnessScore != null
                 && s.UnusualnessScore >= minScore)
        .OrderByDescending(s => s.UnusualnessScore)
        .Take(limit)
        .ToListAsync(stoppingToken);
    return results.Select(r => r.AsDto());
  }
}
