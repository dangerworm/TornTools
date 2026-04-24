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
  // One-query rebuild: three CTE "snapshots" (latest, day-ago, week-ago)
  // joined against a count aggregation, then UPSERTed via ON CONFLICT.
  // Percent-change expressed as fraction (0.12 = +12%).
  private const string RebuildQuery = """
    WITH latest_prices AS (
      SELECT DISTINCT ON (item_id, source)
        item_id,
        source,
        CASE WHEN change_count > 0 THEN sum_price::numeric / change_count END AS avg_price
      FROM public.item_change_log_summaries
      ORDER BY item_id, source, bucket_start DESC
    ),
    price_1d_ago AS (
      SELECT DISTINCT ON (item_id, source)
        item_id,
        source,
        CASE WHEN change_count > 0 THEN sum_price::numeric / change_count END AS avg_price
      FROM public.item_change_log_summaries
      WHERE bucket_start <= NOW() - INTERVAL '1 day'
      ORDER BY item_id, source, bucket_start DESC
    ),
    price_1w_ago AS (
      SELECT DISTINCT ON (item_id, source)
        item_id,
        source,
        CASE WHEN change_count > 0 THEN sum_price::numeric / change_count END AS avg_price
      FROM public.item_change_log_summaries
      WHERE bucket_start <= NOW() - INTERVAL '7 days'
      ORDER BY item_id, source, bucket_start DESC
    ),
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
    INSERT INTO public.item_volatility_stats
      (item_id, source, computed_at, changes_1d, changes_1w, current_price, price_change_1d, price_change_1w)
    SELECT
      c.item_id,
      c.source,
      NOW(),
      c.changes_1d,
      c.changes_1w,
      ROUND(lp.avg_price)::int8,
      CASE WHEN d.avg_price > 0 AND lp.avg_price IS NOT NULL
           THEN ROUND((lp.avg_price - d.avg_price) / d.avg_price, 4)
      END,
      CASE WHEN w.avg_price > 0 AND lp.avg_price IS NOT NULL
           THEN ROUND((lp.avg_price - w.avg_price) / w.avg_price, 4)
      END
    FROM counts c
    LEFT JOIN latest_prices lp USING (item_id, source)
    LEFT JOIN price_1d_ago  d  USING (item_id, source)
    LEFT JOIN price_1w_ago  w  USING (item_id, source)
    ON CONFLICT (item_id, source) DO UPDATE SET
      computed_at     = EXCLUDED.computed_at,
      changes_1d      = EXCLUDED.changes_1d,
      changes_1w      = EXCLUDED.changes_1w,
      current_price   = EXCLUDED.current_price,
      price_change_1d = EXCLUDED.price_change_1d,
      price_change_1w = EXCLUDED.price_change_1w;
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
      _ => query.OrderByDescending(s => s.Changes1d),
    };

    var results = await query.Take(limit).ToListAsync(stoppingToken);
    return results.Select(r => r.AsDto());
  }
}
