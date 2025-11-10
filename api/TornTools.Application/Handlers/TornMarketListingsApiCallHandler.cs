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
) : ListingApiCallHandler<TornMarketListingsApiCallHandler>(logger, databaseService)
{
    public override ApiCallType CallType => ApiCallType.TornMarketListings;

    public override async Task HandleResponseAsync(string content, CancellationToken stoppingToken)
    {
        var payload = JsonSerializer.Deserialize<ItemMarketPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(ItemMarketPayload)} from API response.");

        var correlationId = Guid.NewGuid();
        var itemId = payload.ItemMarket.Item.Id;
        var previousListings = await GetPreviousListings(Source.Torn, itemId, stoppingToken);

        var newListings = payload.ItemMarket.Listings
            .Select((listing, index) =>
                new ListingDto(
                    listing,
                    correlationId,
                    payload.ItemMarket.Item.Id,
                    index
                )
            )
            .ToList();

        await ProcessListings(itemId, previousListings, newListings, stoppingToken);
    }
}
