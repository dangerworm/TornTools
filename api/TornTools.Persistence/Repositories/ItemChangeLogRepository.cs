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
    private const string ItemMarketHistoryPointQuery = @"SELECT
    to_timestamp(
        floor(extract(epoch from ""change_time"") / @bucket) * @bucket
    ) AS ""Bucket"",
    AVG(""new_price"") AS ""AveragePrice"",
    COUNT(*) AS ""Count""
FROM ""public"".""item_change_logs""
WHERE ""change_time"" > @cutoffDate AND ""item_id"" = @itemId
GROUP BY ""Bucket""
ORDER BY ""Bucket""";

    public async Task<ItemChangeLogDto> CreateItemChangeLogAsync(ItemChangeLogDto itemChangeLogDto, CancellationToken stoppingToken)
    {
        var itemChangeLog = CreateEntityFromDto(itemChangeLogDto);
        DbContext.ItemChangeLogs.Add(itemChangeLog);
        await DbContext.SaveChangesAsync(stoppingToken);
        return itemChangeLog.AsDto();
    }

    public async Task<IEnumerable<ItemChangeLogDto>> GetRecentItemChangeLogsAsync(int timeWindowHours, CancellationToken stoppingToken)
    {
        var cutoffDate = DateTime.UtcNow.AddHours(-timeWindowHours);
        var changeLogs = await DbContext.ItemChangeLogs
            .Where(cl => cl.ChangeTime >= cutoffDate)
            .ToListAsync(stoppingToken);

        return changeLogs.Select(cl => cl.AsDto());
    }

    public async Task<IEnumerable<ItemHistoryPointDto>> GetItemPriceHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
    {
        var buckets = await GetAggregatedHistoryAsync(itemId, window, stoppingToken);

        return [.. buckets
            .Select(b => new ItemHistoryPointDto
            {
                Timestamp = b.Bucket,
                Price = (long)Math.Round(b.AveragePrice ?? 0)
            })];
    }

    public async Task<IEnumerable<ItemHistoryPointDto>> GetItemVelocityHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
    {
        var buckets = await GetAggregatedHistoryAsync(itemId, window, stoppingToken);

        return [.. buckets
            .Select(b => new ItemHistoryPointDto
            {
                Timestamp = b.Bucket,
                Velocity = b.Count
            })];
    }

    private async Task<IEnumerable<ItemMarketHistoryPointEntity>> GetAggregatedHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
    {
        var (range, bucket) = window.ToWindowConfiguration();
        var bucketSeconds = bucket.TotalSeconds;
        var cutoffDate = DateTime.UtcNow.Subtract(range);

        return await DbContext.Set<ItemMarketHistoryPointEntity>()
            .FromSqlRaw(
                ItemMarketHistoryPointQuery,
                new NpgsqlParameter("bucket", bucketSeconds),
                new NpgsqlParameter("cutoffDate", cutoffDate),
                new NpgsqlParameter("itemId", itemId)
            )
            .ToListAsync(stoppingToken);
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
}
