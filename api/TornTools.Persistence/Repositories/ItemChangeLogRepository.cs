using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Extensions;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;

public class ItemChangeLogRepository(
    ILogger<ItemChangeLogRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<ItemChangeLogRepository>(logger, dbContext), IItemChangeLogRepository
{
  private const string ItemMarketHistoryPointQuery = """
    SELECT
      to_timestamp(
        floor(extract(epoch from "change_time") / @bucket) * @bucket
      ) AS "Bucket",
      AVG("new_price") AS "AveragePrice",
      COUNT(*) AS "Count"
    FROM "public"."item_change_logs"
    WHERE
      "item_id" = @itemId
      AND "source" = @source
      AND "change_time" >= @windowStart
      AND "change_time" <  @windowEnd
    GROUP BY "Bucket"
    ORDER BY "Bucket";
    """;

  public async Task<ItemChangeLogDto> CreateItemChangeLogAsync(ItemChangeLogDto itemChangeLogDto, CancellationToken stoppingToken)
  {
    var itemChangeLog = CreateEntityFromDto(itemChangeLogDto);
    DbContext.ItemChangeLogs.Add(itemChangeLog);
    await DbContext.SaveChangesAsync(stoppingToken);
    return itemChangeLog.AsDto();
  }

  public async Task<DateTimeOffset?> GetEarliestChangeTimeAsync(CancellationToken stoppingToken)
  {
    return await DbContext.ItemChangeLogs
        .AsNoTracking()
        .MinAsync(cl => (DateTimeOffset?)cl.ChangeTime, stoppingToken);
  }

  // Deletes rows with change_time < olderThan, working oldest-first in
  // time-window chunks. Each chunk is a single set-based ExecuteDeleteAsync
  // in its own transaction, so progress is committed incrementally and a
  // cancelled/interrupted run simply resumes from a higher earliest bound
  // next time. Bounded transactions keep WAL and lock footprint small even
  // on the first (multi-month) cleardown. Uses ix_item_change_logs_change_time.
  public async Task<int> PruneOlderThanAsync(DateTimeOffset olderThan, TimeSpan chunk, CancellationToken stoppingToken)
  {
    var earliest = await GetEarliestChangeTimeAsync(stoppingToken);
    if (earliest is null) return 0;

    // The default 30s command timeout is fine for a steady-state daily run
    // (one chunk), but the first cleardown deletes months of data one day at
    // a time and a single high-traffic day can hold enough rows that the
    // delete + index maintenance exceeds 30s. Give each chunk headroom so a
    // busy day doesn't wedge the loop (same precedent as the summariser's
    // BuildSummariesAsync). Restored in the finally.
    var previousTimeout = DbContext.Database.GetCommandTimeout();
    DbContext.Database.SetCommandTimeout(TimeSpan.FromMinutes(5));
    try
    {
      var totalDeleted = 0;
      var chunkStart = earliest.Value;
      while (chunkStart < olderThan && !stoppingToken.IsCancellationRequested)
      {
        var chunkEnd = chunkStart + chunk;
        if (chunkEnd > olderThan) chunkEnd = olderThan;

        var deleted = await DbContext.ItemChangeLogs
            .Where(cl => cl.ChangeTime >= chunkStart && cl.ChangeTime < chunkEnd)
            .ExecuteDeleteAsync(stoppingToken);

        totalDeleted += deleted;
        if (deleted > 0)
        {
          Logger.LogInformation(
              "Pruned {Deleted} item_change_logs in window [{Start:O} .. {End:O}). Running total {Total}.",
              deleted, chunkStart, chunkEnd, totalDeleted);
        }

        chunkStart = chunkEnd;
      }

      return totalDeleted;
    }
    finally
    {
      DbContext.Database.SetCommandTimeout(previousTimeout);
    }
  }

  public async Task<IEnumerable<ItemHistoryPointDto>> GetItemPriceHistoryAsync(int itemId, HistoryWindow window, Source source, CancellationToken stoppingToken)
  {
    var buckets = await GetAggregatedHistoryAsync(itemId, window, source, stoppingToken);

    return [.. buckets
            .Select(b => new ItemHistoryPointDto
            {
                Timestamp = b.Bucket,
                Price = (long)Math.Round(b.AveragePrice ?? 0)
            })];
  }

  public async Task<IEnumerable<ItemHistoryPointDto>> GetItemVelocityHistoryAsync(int itemId, HistoryWindow window, Source source, CancellationToken stoppingToken)
  {
    var buckets = await GetAggregatedHistoryAsync(itemId, window, source, stoppingToken);

    return [.. buckets
            .Select(b => new ItemHistoryPointDto
            {
                Timestamp = b.Bucket,
                Velocity = b.Count
            })];
  }

  private async Task<IEnumerable<ItemMarketHistoryPointEntity>> GetAggregatedHistoryAsync(int itemId, HistoryWindow window, Source source, CancellationToken stoppingToken)
  {
    var (range, bucket) = window.ToWindowConfiguration();
    var bucketSeconds = bucket.TotalSeconds;

    var cutoffDate = DateTimeOffset.UtcNow.Subtract(range);
    var now = DateTimeOffset.UtcNow;

    var history = await DbContext.Set<ItemMarketHistoryPointEntity>()
        .FromSqlRaw(
            ItemMarketHistoryPointQuery,
            new NpgsqlParameter("bucket", bucketSeconds),
            new NpgsqlParameter("source", source.ToString()),
            new NpgsqlParameter("windowStart", cutoffDate),
            new NpgsqlParameter("windowEnd", now),
            new NpgsqlParameter("itemId", itemId)
        )
        .AsNoTracking()
        .ToDictionaryAsync(h => h.Bucket, h => h, stoppingToken);

    // Align cutoff and now to the same bucket grid as SQL
    var earliestDataPoint = history.Count != 0 ? history.Select(h => h.Value.Bucket).Min() : cutoffDate;
    var firstBucketTime = FloorToBucketUtc(new List<DateTimeOffset> { cutoffDate, earliestDataPoint }.Max(), bucketSeconds);
    var lastBucketTime = FloorToBucketUtc(now, bucketSeconds);

    var totalBuckets = (int)((lastBucketTime - firstBucketTime).TotalSeconds / bucketSeconds) + 1;
    return Enumerable.Range(0, totalBuckets)
        .Select(i =>
        {
          var bucketTime = firstBucketTime.AddSeconds(i * bucketSeconds);

          return history.TryGetValue(bucketTime, out var point)
                  ? point
                  : new ItemMarketHistoryPointEntity
                  {
                    Bucket = bucketTime,
                    AveragePrice = 0,
                    Count = 0
                  };
        });
  }

  private static ItemChangeLogEntity CreateEntityFromDto(ItemChangeLogDto itemDto)
  {
    return new ItemChangeLogEntity
    {
      Id = itemDto.Id ?? Guid.NewGuid(),
      ItemId = itemDto.ItemId,
      Source = itemDto.Source.ToString(),
      ChangeTime = itemDto.ChangeTime,
      NewPrice = itemDto.NewPrice
    };
  }

  private static DateTimeOffset FloorToBucketUtc(DateTimeOffset utc, double bucketSeconds)
  {
    if (utc.Offset != TimeSpan.Zero)
    {
      utc = utc.ToUniversalTime();
    }

    var epoch = DateTimeOffset.UnixEpoch; // 1970-01-01T00:00:00Z
    var totalSeconds = (long)(utc - epoch).TotalSeconds;
    var bucketSize = (long)bucketSeconds;

    var flooredSeconds = (totalSeconds / bucketSize) * bucketSize;
    return epoch.AddSeconds(flooredSeconds);
  }
}
