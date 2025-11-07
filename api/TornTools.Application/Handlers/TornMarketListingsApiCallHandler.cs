using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Models.TornMarketListings;

namespace TornTools.Application.Handlers;

public class TornMarketListingsApiCallHandler(
    ILogger<TornMarketListingsApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler(logger, databaseService)
{
    public override string CallHandler => nameof(TornMarketListingsApiCallHandler);

    public override async Task HandleResponseAsync(HttpResponseMessage response, CancellationToken stoppingToken)
    {
        var content = await response.Content.ReadAsStringAsync(stoppingToken);
        var payload = JsonSerializer.Deserialize<ItemMarketPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(ItemMarketPayload)} from API response.");

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
