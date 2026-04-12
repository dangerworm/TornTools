using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Persistence.Entities;
using TornTools.Persistence.Interfaces;

namespace TornTools.Persistence.Repositories;

public class ListingRepository(
    ILogger<ListingRepository> logger,
    TornToolsDbContext dbContext
) : RepositoryBase<ListingRepository>(logger, dbContext), IListingRepository
{
  public async Task<ListingDto> CreateListingAsync(ListingDto listingDto, CancellationToken stoppingToken)
  {
    var listing = CreateEntityFromDto(listingDto);
    DbContext.Listings.Add(listing);
    await DbContext.SaveChangesAsync(stoppingToken);
    return listing.AsDto();
  }

  public async Task CreateListingsAsync(IEnumerable<ListingDto> listingDtos, CancellationToken stoppingToken)
  {
    var listings = listingDtos.ToList();

    for (int i = 0; i < listings.Count; i += DatabaseConstants.BulkUpdateSize)
    {
      var batch = listings
          .OrderBy(l => l.ListingPosition)
          .Skip(i)
          .Take(DatabaseConstants.BulkUpdateSize)
          .ToList();

      var keys = batch.Select(b => b.Id).ToList();

      foreach (var itemDto in batch)
      {
        var newEntity = CreateEntityFromDto(itemDto);
        DbContext.Listings.Add(newEntity);
      }

      await DbContext.SaveChangesAsync(stoppingToken);
      DbContext.ChangeTracker.Clear();
    }
  }

  public async Task<IEnumerable<ListingDto>> GetAllListingsAsync(CancellationToken stoppingToken)
  {
    var items = await DbContext.Listings
        .AsNoTracking()
        .ToListAsync(stoppingToken);

    return items.Select(item => item.AsDto());
  }

  public async Task<IEnumerable<ListingDto>> GetListingsByItemIdAsync(int itemId, CancellationToken stoppingToken)
  {
    var listings = await DbContext.Listings
        .AsNoTracking()
        .Where(l => l.ItemId == itemId)
        .ToListAsync(stoppingToken);

    return listings.Select(l => l.AsDto());
  }

  public async Task<IEnumerable<ListingDto>> GetListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken)
  {
    var listings = await DbContext.Listings
        .AsNoTracking()
        .Where(l => l.Source == source.ToString() && l.ItemId == itemId)
        .ToListAsync(stoppingToken);

    return listings.Select(l => l.AsDto());
  }

  public async Task DeleteListingsBySourceAndItemIdAsync(Source source, int itemId, CancellationToken stoppingToken)
  {
    await DbContext.Listings
        .Where(l => l.Source == source.ToString() && l.ItemId == itemId)
        .ExecuteDeleteAsync(stoppingToken);
  }

  public async Task ReplaceListingsAsync(Source source, int itemId, IEnumerable<ListingDto> newListings, CancellationToken stoppingToken)
  {
    await using var transaction = await DbContext.Database.BeginTransactionAsync(stoppingToken);

    await DbContext.Listings
        .Where(l => l.Source == source.ToString() && l.ItemId == itemId)
        .ExecuteDeleteAsync(stoppingToken);

    foreach (var listingDto in newListings)
    {
      DbContext.Listings.Add(CreateEntityFromDto(listingDto));
    }

    await DbContext.SaveChangesAsync(stoppingToken);
    await transaction.CommitAsync(stoppingToken);
    DbContext.ChangeTracker.Clear();
  }

  public async Task<IEnumerable<BazaarSummaryDto>> GetBazaarSummariesAsync(CancellationToken stoppingToken)
  {
    const string sql = """
      WITH weav3r_items AS (
        SELECT
          l.item_id,
          l.price                                    AS weav3r_min_price,
          l.quantity,
          l.time_seen                                AS last_updated,
          MIN(l.price) OVER (PARTITION BY l.item_id) AS min_price
        FROM public.listings l
        WHERE l.source = 'Weav3r'
      )
      SELECT
        item_id,
        weav3r_min_price,
        SUM(quantity)::int  AS quantity,
        MAX(last_updated)   AS last_updated
      FROM weav3r_items
      WHERE weav3r_min_price = min_price
      GROUP BY item_id, weav3r_min_price
      """;

    var rows = await DbContext.BazaarSummaries
        .FromSqlRaw(sql)
        .AsNoTracking()
        .ToListAsync(stoppingToken);

    return rows.Select(r => r.AsDto());
  }

  private static ListingEntity CreateEntityFromDto(ListingDto listingDto)
  {
    return new ListingEntity
    {
      Id = listingDto.Id ?? Guid.NewGuid(),
      Source = listingDto.Source.ToString(),
      CorrelationId = listingDto.CorrelationId,
      PlayerId = listingDto.PlayerId,
      ItemId = listingDto.ItemId,
      ListingPosition = listingDto.ListingPosition,
      TimeSeen = listingDto.TimeSeen.ToUniversalTime(),
      Price = listingDto.Price,
      Quantity = listingDto.Quantity
    };
  }
}
