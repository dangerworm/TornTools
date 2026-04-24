using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;

public class ItemChangeLogSummaryRepository(
    ILogger<ItemChangeLogSummaryRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<ItemChangeLogSummaryRepository>(logger, dbContext), IItemChangeLogSummaryRepository
{
  private const string BuildSummariesQuery = """
    INSERT INTO public.item_change_log_summaries
      (item_id, source, bucket_start, change_count, sum_price, min_price, max_price)
    SELECT
      item_id,
      source,
      to_timestamp(floor(extract(epoch from change_time) / @bucket) * @bucket) AS bucket_start,
      COUNT(*)::int4                                   AS change_count,
      SUM(new_price)                                   AS sum_price,
      MIN(new_price)                                   AS min_price,
      MAX(new_price)                                   AS max_price
    FROM public.item_change_logs
    WHERE change_time >= @windowStart
      AND change_time <  @windowEnd
    GROUP BY
      item_id,
      source,
      to_timestamp(floor(extract(epoch from change_time) / @bucket) * @bucket)
    ON CONFLICT (item_id, source, bucket_start) DO UPDATE SET
      change_count = EXCLUDED.change_count,
      sum_price    = EXCLUDED.sum_price,
      min_price    = EXCLUDED.min_price,
      max_price    = EXCLUDED.max_price;
    """;

  private const string SummaryHistoryQuery = """
    SELECT
      to_timestamp(floor(extract(epoch from bucket_start) / @bucket) * @bucket) AS "Bucket",
      CASE WHEN SUM(change_count) > 0
        THEN CAST(SUM(sum_price) AS numeric) / SUM(change_count)
        ELSE 0
      END AS "AveragePrice",
      SUM(change_count)::int AS "Count"
    FROM public.item_change_log_summaries
    WHERE item_id     = @itemId
      AND source      = @source
      AND bucket_start >= @windowStart
      AND bucket_start <  @windowEnd
    GROUP BY
      to_timestamp(floor(extract(epoch from bucket_start) / @bucket) * @bucket)
    ORDER BY "Bucket";
    """;

  public async Task BuildSummariesAsync(DateTimeOffset fromBucket, DateTimeOffset toBucket, double bucketSeconds, CancellationToken stoppingToken)
  {
    // Default Npgsql command timeout is 30s, which is too tight for the
    // group-by-aggregating UPSERT on a meaningful window (especially the
    // post-V1.22 backfill of ~5 months of 1h-bucketed history). The
    // orchestration layer chunks into ~weekly windows; even so, give
    // each chunk plenty of headroom.
    var previousTimeout = DbContext.Database.GetCommandTimeout();
    DbContext.Database.SetCommandTimeout(TimeSpan.FromMinutes(10));
    try
    {
      await DbContext.Database.ExecuteSqlRawAsync(
          BuildSummariesQuery,
          new NpgsqlParameter("bucket", bucketSeconds),
          new NpgsqlParameter("windowStart", fromBucket),
          new NpgsqlParameter("windowEnd", toBucket)
      );
    }
    finally
    {
      DbContext.Database.SetCommandTimeout(previousTimeout);
    }
  }

  public async Task<DateTimeOffset?> GetLatestBucketStartAsync(CancellationToken stoppingToken)
  {
    return await DbContext.ItemChangeLogSummaries
        .AsNoTracking()
        .MaxAsync(s => (DateTimeOffset?)s.BucketStart, stoppingToken);
  }

  public async Task<IEnumerable<ItemHistoryPointDto>> GetPriceHistoryAsync(int itemId, Source source, DateTimeOffset from, DateTimeOffset to, double aggregateBucketSeconds, CancellationToken stoppingToken)
  {
    var buckets = await GetSummaryHistoryAsync(itemId, source, from, to, aggregateBucketSeconds, stoppingToken);

    return [.. buckets.Select(b => new ItemHistoryPointDto
    {
      Timestamp = b.Bucket,
      Price = (long)Math.Round(b.AveragePrice ?? 0)
    })];
  }

  public async Task<IEnumerable<ItemHistoryPointDto>> GetVelocityHistoryAsync(int itemId, Source source, DateTimeOffset from, DateTimeOffset to, double aggregateBucketSeconds, CancellationToken stoppingToken)
  {
    var buckets = await GetSummaryHistoryAsync(itemId, source, from, to, aggregateBucketSeconds, stoppingToken);

    return [.. buckets.Select(b => new ItemHistoryPointDto
    {
      Timestamp = b.Bucket,
      Velocity = b.Count
    })];
  }

  private async Task<IEnumerable<ItemMarketHistoryPointEntity>> GetSummaryHistoryAsync(int itemId, Source source, DateTimeOffset from, DateTimeOffset to, double aggregateBucketSeconds, CancellationToken stoppingToken)
  {
    var history = await DbContext.Set<ItemMarketHistoryPointEntity>()
        .FromSqlRaw(
            SummaryHistoryQuery,
            new NpgsqlParameter("bucket", aggregateBucketSeconds),
            new NpgsqlParameter("itemId", itemId),
            new NpgsqlParameter("source", source.ToString()),
            new NpgsqlParameter("windowStart", from),
            new NpgsqlParameter("windowEnd", to)
        )
        .AsNoTracking()
        .ToDictionaryAsync(h => h.Bucket, h => h, stoppingToken);

    var firstBucketTime = FloorToBucketUtc(from, aggregateBucketSeconds);
    var lastBucketTime = FloorToBucketUtc(to, aggregateBucketSeconds);

    var totalBuckets = (int)((lastBucketTime - firstBucketTime).TotalSeconds / aggregateBucketSeconds) + 1;
    return Enumerable.Range(0, totalBuckets)
        .Select(i =>
        {
          var bucketTime = firstBucketTime.AddSeconds(i * aggregateBucketSeconds);
          return history.TryGetValue(bucketTime, out var point)
              ? point
              : new ItemMarketHistoryPointEntity { Bucket = bucketTime, AveragePrice = 0, Count = 0 };
        });
  }

  private static DateTimeOffset FloorToBucketUtc(DateTimeOffset utc, double bucketSeconds)
  {
    if (utc.Offset != TimeSpan.Zero)
      utc = utc.ToUniversalTime();

    var epoch = DateTimeOffset.UnixEpoch;
    var totalSeconds = (long)(utc - epoch).TotalSeconds;
    var bucketSize = (long)bucketSeconds;
    return epoch.AddSeconds((totalSeconds / bucketSize) * bucketSize);
  }
}
