using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;
public class ItemRepository(
    ILogger<ItemRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<ItemRepository>(logger, dbContext), IItemRepository
{
    public async Task<ItemDto> CreateItemAsync(ItemDto itemDto, CancellationToken stoppingToken)
    {
        var item = CreateEntityFromDto(itemDto);
        DbContext.Items.Add(item);
        await DbContext.SaveChangesAsync(stoppingToken);
        return item.AsDto();
    }

    public async Task<ItemDto> UpsertItemAsync(ItemDto itemDto, CancellationToken stoppingToken)
    {
        var item = await DbContext.Items.FindAsync([itemDto.Id, stoppingToken], stoppingToken);
        if (item is null)
        {
            return await CreateItemAsync(itemDto, stoppingToken);
        }

        item = CreateEntityFromDto(itemDto);
        DbContext.Items.Update(item);
        await DbContext.SaveChangesAsync(stoppingToken);
        return item.AsDto();
    }

    public async Task UpsertItemsAsync(IEnumerable<ItemDto> itemDtos, CancellationToken stoppingToken)
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
                    .OrderByDescending(i => i.ValueSellPrice)
                    .Skip(i)
                    .Take(DatabaseConstants.BulkUpdateSize)
                    .ToList();

                var keys = batch.Select(b => b.Id).ToList();

                // Load existing entities for these keys in one go
                var existing = await DbContext.Items
                    .Where(x => keys.Contains(x.Id))
                    .ToDictionaryAsync(x => x.Id, stoppingToken);

                foreach (var itemDto in batch)
                {
                    if (existing.TryGetValue(itemDto.Id, out var entity))
                    {
                        entity.Name = itemDto.Name;
                        entity.Description = itemDto.Description;
                        entity.Effect = itemDto.Effect;
                        entity.Requirement = itemDto.Requirement;
                        entity.Image = itemDto.Image;
                        entity.Type = itemDto.Type;
                        entity.SubType = itemDto.SubType;
                        entity.IsMasked = itemDto.IsMasked;
                        entity.IsTradable = itemDto.IsTradable;
                        entity.IsFoundInCity = itemDto.IsFoundInCity;
                        entity.ValueVendorCountry = itemDto.ValueVendorCountry;
                        entity.ValueVendorName = itemDto.ValueVendorName;
                        entity.ValueBuyPrice = itemDto.ValueBuyPrice;
                        entity.ValueSellPrice = itemDto.ValueSellPrice;
                        entity.ValueMarketPrice = itemDto.ValueMarketPrice;
                        entity.Circulation = itemDto.Circulation;
                        entity.DetailsCategory = itemDto.DetailsCategory;
                        entity.DetailsStealthLevel = itemDto.DetailsStealthLevel;
                        entity.DetailsBaseStatsDamage = itemDto.DetailsBaseStatsDamage;
                        entity.DetailsBaseStatsAccuracy = itemDto.DetailsBaseStatsAccuracy;
                        entity.DetailsBaseStatsArmor = itemDto.DetailsBaseStatsArmor;
                        entity.DetailsAmmoId = itemDto.DetailsAmmoId;
                        entity.DetailsAmmoName = itemDto.DetailsAmmoName;
                        entity.DetailsAmmoMagazineRounds = itemDto.DetailsAmmoMagazineRounds;
                        entity.DetailsAmmoRateOfFireMinimum = itemDto.DetailsAmmoRateOfFireMinimum;
                        entity.DetailsAmmoRateOfFireMaximum = itemDto.DetailsAmmoRateOfFireMaximum;
                    }
                    else
                    {
                        var newEntity = CreateEntityFromDto(itemDto);
                        DbContext.Items.Add(newEntity);
                    }
                }

                await DbContext.SaveChangesAsync(stoppingToken);
                DbContext.ChangeTracker.Clear();
            }
        }
        finally
        {
            DbContext.ChangeTracker.AutoDetectChangesEnabled = wasAutoDetect;
        }
    }

    public async Task<IEnumerable<ItemDto>> GetAllItemsAsync(CancellationToken stoppingToken)
    {
        var items = await DbContext.Items.ToListAsync(stoppingToken);

        return items.Select(item => item.AsDto());
    }

    public Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken)
    {
        return DbContext.Items.CountAsync(stoppingToken);
    }

    public async Task<IEnumerable<ProfitableListingDto>> GetProfitableItemsAsync(CancellationToken stoppingToken)
    {
        var items = await DbContext.ProfitableListings
            .OrderByDescending(x => x.Profit)
            .ToListAsync(stoppingToken);

        return items.Select(item => item.AsDto());
    }

    public async Task<IEnumerable<ItemDto>> GetResaleItemsAsync(CancellationToken stoppingToken)
    {
        var items = await DbContext.Items
            .Where(i => i.ValueSellPrice != null && 
                        i.ValueSellPrice > QueryConstants.MinSellPrice)
            .ToListAsync(stoppingToken);

        return items.Select(item => item.AsDto());
    }

    public async Task<ItemDto> GetItemAsync(int id, CancellationToken stoppingToken)
    {
        var item = await GetItemByIdAsync(id, stoppingToken);
        return item.AsDto();
    }

    private async Task<ItemEntity> GetItemByIdAsync(int id, CancellationToken stoppingToken)
    {
        var item = await DbContext.Items.FindAsync([id, stoppingToken], stoppingToken);
        return item is null
            ? throw new Exception($"{nameof(ItemEntity)} with ID {id} not found.")
            : item;
    }

    private static ItemEntity CreateEntityFromDto(ItemDto itemDto)
    {
        return new ItemEntity
        {
            Id = itemDto.Id,
            Name = itemDto.Name,
            Description = itemDto.Description,
            Effect = itemDto.Effect,
            Requirement = itemDto.Requirement,
            Image = itemDto.Image,
            Type = itemDto.Type,
            SubType = itemDto.SubType,
            IsMasked = itemDto.IsMasked,
            IsTradable = itemDto.IsTradable,
            IsFoundInCity = itemDto.IsFoundInCity,
            ValueVendorCountry = itemDto.ValueVendorCountry,
            ValueVendorName = itemDto.ValueVendorName,
            ValueBuyPrice = itemDto.ValueBuyPrice,
            ValueSellPrice = itemDto.ValueSellPrice,
            ValueMarketPrice = itemDto.ValueMarketPrice,
            Circulation = itemDto.Circulation,
            DetailsCategory = itemDto.DetailsCategory,
            DetailsStealthLevel = itemDto.DetailsStealthLevel,
            DetailsBaseStatsDamage = itemDto.DetailsBaseStatsDamage,
            DetailsBaseStatsAccuracy = itemDto.DetailsBaseStatsAccuracy,
            DetailsBaseStatsArmor = itemDto.DetailsBaseStatsArmor,
            DetailsAmmoId = itemDto.DetailsAmmoId,
            DetailsAmmoName = itemDto.DetailsAmmoName,
            DetailsAmmoMagazineRounds = itemDto.DetailsAmmoMagazineRounds,
            DetailsAmmoRateOfFireMinimum = itemDto.DetailsAmmoRateOfFireMinimum,
            DetailsAmmoRateOfFireMaximum = itemDto.DetailsAmmoRateOfFireMaximum
        };
    }
}
