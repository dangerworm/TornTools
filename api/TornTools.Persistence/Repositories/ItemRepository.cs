using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
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

  public async Task UpsertItemsAsync(IEnumerable<ItemDto> itemDtos, CancellationToken stoppingToken)
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
          entity.LastUpdated = itemDto.LastUpdated;
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

  public async Task<IEnumerable<ItemDto>> GetAllItemsAsync(CancellationToken stoppingToken)
  {
    var items = await DbContext.Items
        .AsNoTracking()
        .Where(i => i.Type != "Unused")
        .ToListAsync(stoppingToken);

    return items.Select(item => item.AsDto());
  }

  public Task<int> GetNumberOfItemsAsync(CancellationToken stoppingToken)
  {
    return DbContext.Items.CountAsync(stoppingToken);
  }

  public async Task<IEnumerable<ProfitableListingDto>> GetProfitableItemsAsync(CancellationToken stoppingToken)
  {
    var items = await DbContext.ProfitableListings
        .AsNoTracking() 
        .Where(listing => listing.TornLastUpdated > DateTimeOffset.UtcNow.AddHours(-6) ||
                          listing.Weav3rLastUpdated > DateTimeOffset.UtcNow.AddHours(-6))
        .ToListAsync(stoppingToken);

    return items.Select(item => item.AsDto());
  }

  public async Task<IEnumerable<ItemDto>> GetMarketItemsAsync(CancellationToken stoppingToken)
  {
    var items = await DbContext.Items
        .AsNoTracking()
        .Where(i => i.ValueMarketPrice != null)
        .ToListAsync(stoppingToken);

    return items.Select(item => item.AsDto());
  }

  public async Task<IEnumerable<int>> GetActiveMarketItemsForQueueAsync(int minChangesIn7Days, CancellationToken stoppingToken)
  {
    var sevenDaysAgo = DateTimeOffset.UtcNow.AddDays(-7);

    // Items with at least minChangesIn7Days change events across all sources in the last 7 days.
    // Items that barely change are left to the stale-listing job instead.
    var activeItemIds = await DbContext.ItemChangeLogSummaries
        .AsNoTracking()
        .Where(s => s.BucketStart >= sevenDaysAgo)
        .GroupBy(s => s.ItemId)
        .Where(g => g.Sum(s => s.ChangeCount) >= minChangesIn7Days)
        .Select(g => g.Key)
        .ToListAsync(stoppingToken);

    if (activeItemIds.Count == 0)
      return [];

    var activeSet = activeItemIds.ToHashSet();

    // Profitable item IDs — those appearing in the profitable_listings view recently
    var sixHoursAgo = DateTimeOffset.UtcNow.AddHours(-6);
    var profitableSet = (await DbContext.ProfitableListings
        .AsNoTracking()
        .Where(pl => pl.TornLastUpdated > sixHoursAgo || pl.Weav3rLastUpdated > sixHoursAgo)
        .Select(pl => pl.ItemId)
        .ToListAsync(stoppingToken))
        .ToHashSet();

    // Most-stale items should be scanned first (NULLS = never seen → highest priority)
    var lastSeenByItem = await DbContext.Listings
        .AsNoTracking()
        .Where(l => activeSet.Contains(l.ItemId))
        .GroupBy(l => l.ItemId)
        .Select(g => new { ItemId = g.Key, LastSeen = g.Max(l => l.TimeSeen) })
        .ToDictionaryAsync(x => x.ItemId, x => x.LastSeen, stoppingToken);

    var marketItemIds = await DbContext.Items
        .AsNoTracking()
        .Where(i => i.ValueMarketPrice != null)
        .Select(i => i.Id)
        .ToListAsync(stoppingToken);

    // Profitable items first, then by staleness ascending
    return marketItemIds
        .Where(id => activeSet.Contains(id))
        .OrderByDescending(id => profitableSet.Contains(id))
        .ThenBy(id => lastSeenByItem.TryGetValue(id, out var t) ? t : DateTimeOffset.MinValue)
        .ToList();
  }

  public async Task<IEnumerable<(int ItemId, string Source)>> GetStaleMarketItemIdsAsync(int thresholdHours, CancellationToken stoppingToken)
  {
    var threshold = DateTimeOffset.UtcNow.AddHours(-thresholdHours);
    var result = new List<(int, string)>();

    foreach (var source in new[] { Source.Torn, Source.Weav3r })
    {
      var sourceName = source.ToString();
      var staleIds = await DbContext.Items
          .AsNoTracking()
          .Where(i => i.ValueMarketPrice != null)
          .Where(i => !DbContext.Listings
              .Any(l => l.ItemId == i.Id && l.Source == sourceName && l.TimeSeen >= threshold))
          .Select(i => i.Id)
          .ToListAsync(stoppingToken);

      result.AddRange(staleIds.Select(id => (id, sourceName)));
    }

    return result;
  }

  public async Task<ItemDto> GetItemAsync(int id, CancellationToken stoppingToken)
  {
    var item = await GetItemByIdAsync(id, stoppingToken);
    return item.AsDto();
  }

  private async Task<ItemEntity> GetItemByIdAsync(int id, CancellationToken stoppingToken)
  {
    var item = await DbContext.Items
        .AsNoTracking()
        .FirstOrDefaultAsync(x => x.Id == id, stoppingToken);

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
      DetailsAmmoRateOfFireMaximum = itemDto.DetailsAmmoRateOfFireMaximum,
      LastUpdated = itemDto.LastUpdated
    };
  }
}
