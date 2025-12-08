using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        var listings = await DbContext.Listings
            .Where(l => l.Source == source.ToString() && l.ItemId == itemId)
            .ExecuteDeleteAsync(stoppingToken);
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
