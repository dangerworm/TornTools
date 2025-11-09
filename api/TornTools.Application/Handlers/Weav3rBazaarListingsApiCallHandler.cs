using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Models.Weav3rBazaarListings;

namespace TornTools.Application.Handlers;

public class Weav3rBazaarListingsApiCallHandler(
    ILogger<Weav3rBazaarListingsApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler(logger, databaseService)
{
    public override CallType CallType => CallType.Weav3rBazaarListings;

    public override async Task HandleResponseAsync(string content, CancellationToken stoppingToken)
    {
        var payload = JsonSerializer.Deserialize<BazaarItemPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(BazaarItemPayload)} from API response.");

        var previousListings = (
            await DatabaseService.GetListingsBySourceAndItemIdAsync(
                Source.Weav3r,
                payload.ItemId,
                stoppingToken
            )
        ).ToList();

        if (previousListings.Count != 0)
        {
            var previousMinimumPrice = previousListings.Min(l => l.Price);
            var newMinimumPrice = payload.Listings.Min(l => l.Price);

            // In most cases this check will be false, but for small markets it's
            // a little optimisation to avoid iterating all listings unnecessarily.
            var hasMarketChanged = previousListings.Count != payload.Listings.Count();
            var hasMinimumPriceChanged = previousMinimumPrice != newMinimumPrice;

            if (!hasMarketChanged && !hasMinimumPriceChanged)
            {
                var i = 0;
                while (i < previousListings.Count)
                {
                    var previousListing = previousListings[i];
                    var newListing = payload.Listings.ElementAtOrDefault(i);
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
                    ItemId = payload.ItemId,
                    Source = Source.Weav3r,
                    NewPrice = newMinimumPrice,
                    ChangeTime = DateTime.UtcNow,
                };

                await DatabaseService.CreateItemChangeLogAsync(itemChangeLog, stoppingToken);
            }
        }

        await DatabaseService.DeleteListingsBySourceAndItemIdAsync(
            Source.Weav3r,
            payload.ItemId,
            stoppingToken
        );

        var correlationId = Guid.NewGuid();
        var items = payload.Listings.Select((listing, index) => new ListingDto(
            listing,
            correlationId,
            index
        ));

        await DatabaseService.CreateListingsAsync(items, stoppingToken);
    }
}
