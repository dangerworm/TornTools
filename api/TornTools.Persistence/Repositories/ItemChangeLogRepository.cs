using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Core.DataTransferObjects;
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
