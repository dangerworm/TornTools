using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql.EntityFrameworkCore.PostgreSQL;
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

        return buckets
            .Select(b => new ItemHistoryPointDto
            {
                Timestamp = b.Timestamp,
                Price = (long)Math.Round(b.AveragePrice)
            })
            .ToList();
    }

    public async Task<IEnumerable<ItemHistoryPointDto>> GetItemVelocityHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
    {
        var buckets = await GetAggregatedHistoryAsync(itemId, window, stoppingToken);

        return buckets
            .Select(b => new ItemHistoryPointDto
            {
                Timestamp = b.Timestamp,
                Velocity = b.Count
            })
            .ToList();
    }

    private async Task<List<HistoryAggregation>> GetAggregatedHistoryAsync(int itemId, HistoryWindow window, CancellationToken stoppingToken)
    {
        var (range, bucket) = window.ToWindowConfiguration();
        var bucketSeconds = bucket.TotalSeconds;
        var cutoffDate = DateTime.UtcNow.Subtract(range);

        var groupedBuckets = await DbContext.ItemChangeLogs
            .Where(cl => cl.ItemId == itemId && cl.ChangeTime >= cutoffDate)
            .GroupBy(cl => Math.Floor((NpgsqlDbFunctionsExtensions.DatePart(EF.Functions, "epoch", cl.ChangeTime) ?? 0d) / bucketSeconds))
            .Select(g => new
            {
                Bucket = g.Key,
                AveragePrice = g.Average(cl => (double)cl.NewPrice),
                Count = g.Count()
            })
            .ToListAsync(stoppingToken);

        return groupedBuckets
            .Select(g => new HistoryAggregation
            {
                Timestamp = DateTimeOffset.FromUnixTimeSeconds((long)(g.Bucket * bucketSeconds)).UtcDateTime,
                AveragePrice = g.AveragePrice,
                Count = g.Count
            })
            .OrderBy(g => g.Timestamp)
            .ToList();
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

    private sealed class HistoryAggregation
    {
        public required DateTime Timestamp { get; init; }
        public required double AveragePrice { get; init; }
        public required int Count { get; init; }
    }
}
