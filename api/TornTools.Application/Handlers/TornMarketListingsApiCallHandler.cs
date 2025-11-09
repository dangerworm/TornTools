using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Models.TornMarketListings;

namespace TornTools.Application.Handlers;

public class TornMarketListingsApiCallHandler(
    ILogger<TornMarketListingsApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler(logger, databaseService)
{
    public override CallType CallType => CallType.TornMarketListings;

    public override async Task HandleResponseAsync(string content, CancellationToken stoppingToken)
    {
        var payload = JsonSerializer.Deserialize<ItemMarketPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(ItemMarketPayload)} from API response.");

        var previousListings = (
            await DatabaseService.GetListingsBySourceAndItemIdAsync(
                Source.Torn,
                payload.ItemMarket.Item.Id,
                stoppingToken
            )
        ).ToList();

        if (previousListings.Count != 0)
        {
            var previousMinimumPrice = previousListings.Min(l => l.Price);
            var newMinimumPrice = payload.ItemMarket.Listings.Min(l => l.Price);

            // There are a maximum of 100 items returned.
            // In most cases this check will be false, but for small markets it's
            // a little optimisation to avoid iterating all listings unnecessarily.
            var hasMarketChanged = previousListings.Count != payload.ItemMarket.Listings.Count();
            var hasMinimumPriceChanged = previousMinimumPrice != newMinimumPrice;
            
            if (!hasMarketChanged && !hasMinimumPriceChanged)
            {
                var i = 0;
                while (i < previousListings.Count)
                {
                    var previousListing = previousListings[i];
                    var newListing = payload.ItemMarket.Listings.ElementAtOrDefault(i);
                    if (newListing == null || previousListing.Price != newListing.Price)
                    {
                        hasMarketChanged = true;
                        break;
                    }
                }
            }

            if (hasMarketChanged || hasMinimumPriceChanged)
            {
                var itemChangeLog = new ItemChangeLogDto
                {
                    ItemId = payload.ItemMarket.Item.Id,
                    Source = Source.Torn,
                    NewPrice = newMinimumPrice,
                    ChangeTime = DateTime.UtcNow,
                };

                await DatabaseService.CreateItemChangeLogAsync(itemChangeLog, stoppingToken);
            }
        }

        await DatabaseService.DeleteListingsBySourceAndItemIdAsync(
            Source.Torn,
            payload.ItemMarket.Item.Id,
            stoppingToken
        );

        var correlationId = Guid.NewGuid();
        var listings = payload.ItemMarket.Listings.Select((listing, index) => 
            new ListingDto(
                listing,
                correlationId,
                payload.ItemMarket.Item.Id,
                index
            ));

        await DatabaseService.CreateListingsAsync(listings, stoppingToken);
    }
}
