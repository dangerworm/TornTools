using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Models.Weav3rBazaarListings;

namespace TornTools.Application.Handlers;

public class Weav3rBazaarListingsApiCallHandler(
    ILogger<Weav3rBazaarListingsApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler(logger, databaseService)
{
    public override string CallHandler => nameof(Weav3rBazaarListingsApiCallHandler);

    public override async Task HandleResponseAsync(HttpResponseMessage response, CancellationToken stoppingToken)
    {
        var content = await response.Content.ReadAsStringAsync(stoppingToken);
        var payload = JsonSerializer.Deserialize<BazaarItemPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(BazaarItemPayload)} from API response.");

        var correlationId = Guid.NewGuid();

        var items = payload.Listings.Select((listing, index) => new ListingDto(
            listing,
            correlationId,
            index
        ));

        await DatabaseService.CreateListingsAsync(items, stoppingToken);
    }
}
