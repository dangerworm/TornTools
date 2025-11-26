using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;
public class ForeignStockItemRepository(
    ILogger<ForeignStockItemRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<ForeignStockItemRepository>(logger, dbContext), IForeignStockItemRepository
{
    public async Task<IEnumerable<ForeignStockItemDto>> GetItemsAsync(CancellationToken stoppingToken)
    {
        var items = await DbContext.ForeignStockItems
            .Include(fsi => fsi.Item)
            .ToListAsync(stoppingToken);

        return items.Select(item => item.AsDto());
    }

    public async Task UpsertItemsAsync(IEnumerable<ForeignStockItemDto> itemDtos, CancellationToken stoppingToken)
    {
        // Turn off auto-change detection while doing lots of work
        var wasAutoDetect = DbContext.ChangeTracker.AutoDetectChangesEnabled;
        DbContext.ChangeTracker.AutoDetectChangesEnabled = false;

        try
        {
            var items = itemDtos.ToList();

            for (int i = 0; i < items.Count; i += DatabaseConstants.BulkUpdateSize)
            {
                var batch = items
                    .OrderByDescending(i => i.ItemId)
                    .Skip(i)
                    .Take(DatabaseConstants.BulkUpdateSize)
                    .ToList();

                var keys = batch.Select(i => i.ItemId).ToList();

                // Load existing entities for these keys in one go
                var existing = await DbContext.ForeignStockItems
                    .AsTracking()
                    .Where(fsi => keys.Contains(fsi.ItemId))
                    .ToDictionaryAsync(GetCompositeKey, stoppingToken);

                foreach (var itemDto in batch)
                {
                    if (existing.TryGetValue(GetCompositeKey(itemDto), out var entity))
                    {
                        entity.ItemId = itemDto.ItemId;
                        entity.Country = itemDto.Country;
                        entity.ItemName = itemDto.ItemName;
                        entity.Quantity = itemDto.Quantity;
                        entity.Cost = itemDto.Cost;
                        entity.LastUpdated = itemDto.LastUpdated;
                    }
                    else
                    {
                        var newEntity = CreateEntityFromDto(itemDto);
                        DbContext.ForeignStockItems.Add(newEntity);
                    }
                }

                DbContext.ChangeTracker.DetectChanges();
                await DbContext.SaveChangesAsync(stoppingToken);
                DbContext.ChangeTracker.Clear();
            }
        }
        finally
        {
            DbContext.ChangeTracker.AutoDetectChangesEnabled = wasAutoDetect;
        }
    }

    private static ForeignStockItemEntity CreateEntityFromDto(ForeignStockItemDto itemDto)
    {
        return new ForeignStockItemEntity
        {
            ItemId = itemDto.ItemId,
            Country = itemDto.Country,
            ItemName = itemDto.ItemName,
            Quantity = itemDto.Quantity,
            Cost = itemDto.Cost,
            LastUpdated = itemDto.LastUpdated
        };
    }

    private static string GetCompositeKey(ForeignStockItemEntity item) => $"{item.ItemId}|{item.Country}";
    private static string GetCompositeKey(ForeignStockItemDto item) => $"{item.ItemId}|{item.Country}";
}
