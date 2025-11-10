using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Handlers;

public abstract class ListingApiCallHandler<TCallHandler>(
    ILogger<TCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler<TCallHandler>(logger, databaseService)
    where TCallHandler : IApiCallHandler
{
    protected async Task<List<ListingDto>> GetPreviousListings(Source source, int itemId, CancellationToken stoppingToken)
    {
        var previousListings =
            (
                await DatabaseService.GetListingsBySourceAndItemIdAsync(
                    source,
                    itemId,
                    stoppingToken
                )
            )
            .OrderBy(l => l.ListingPosition)
            .ToList();

        return previousListings;
    }

    protected async Task ProcessListings(
        int itemId, 
        List<ListingDto> previousListings,
        List<ListingDto> newListings,
        CancellationToken stoppingToken)
    {
        if (previousListings.Count == 0)
        {
            await DatabaseService.CreateListingsAsync(newListings, stoppingToken);
            return;
        }

        var previousMinimumPrice = previousListings.Min(l => l.Price);
        var newMinimumPrice = newListings.Min(l => l.Price);

        // There are a maximum of 100 items returned.
        // In most cases this check will be false, but for small markets it's
        // a little optimisation to avoid iterating all listings unnecessarily.
        var hasMarketChanged = previousListings.Count != newListings.Count;
        var hasMinimumPriceChanged = previousMinimumPrice != newMinimumPrice;

        if (!hasMarketChanged && !hasMinimumPriceChanged)
        {
            var i = 0;
            while (i < previousListings.Count)
            {
                var previousListing = previousListings[i];
                var newListing = newListings[i];
                if (newListing == null || previousListing.Price != newListing.Price)
                {
                    hasMarketChanged = true;
                    break;
                }
                i++;
            }
        }

        if (hasMarketChanged || hasMinimumPriceChanged)
        {
            var itemChangeLog = new ItemChangeLogDto
            {
                ItemId = itemId,
                Source = Source.Torn,
                NewPrice = newMinimumPrice,
                ChangeTime = DateTime.UtcNow,
            };

            await DatabaseService.CreateItemChangeLogAsync(itemChangeLog, stoppingToken);

            await DatabaseService.DeleteListingsBySourceAndItemIdAsync(
                Source.Torn,
                itemId,
                stoppingToken
            );

            await DatabaseService.CreateListingsAsync(newListings, stoppingToken);
        }
    }
}
