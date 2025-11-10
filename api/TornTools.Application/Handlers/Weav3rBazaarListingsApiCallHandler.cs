using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Models.Weav3rBazaarListings;

namespace TornTools.Application.Handlers;

public class Weav3rBazaarListingsApiCallHandler(
    ILogger<Weav3rBazaarListingsApiCallHandler> logger,
    IDatabaseService databaseService
) : ListingApiCallHandler<Weav3rBazaarListingsApiCallHandler>(logger, databaseService)
{
    public override ApiCallType CallType => ApiCallType.Weav3rBazaarListings;

    public override async Task HandleResponseAsync(string content, CancellationToken stoppingToken)
    {
        var payload = JsonSerializer.Deserialize<BazaarItemPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(BazaarItemPayload)} from API response.");

        var correlationId = Guid.NewGuid();
        var itemId = payload.ItemId;
        var previousListings = await GetPreviousListings(Source.Weav3r, itemId, stoppingToken);
        
        var newListings = payload.Listings
            .Select((listing, index) =>
                new ListingDto(
                    listing,
                    correlationId,
                    index
                )
            )
            .Take(ApiConstants.NumberOfListingsToStorePerItem)
            .ToList();

        await ProcessListings(itemId, previousListings, newListings, stoppingToken);
    }
}
