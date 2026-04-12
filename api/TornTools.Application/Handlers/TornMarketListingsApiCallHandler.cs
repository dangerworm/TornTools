using Microsoft.Extensions.Logging;
using System.Text.Json;
using TornTools.Application.Exceptions;
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

  public override async Task HandleResponseAsync(QueueItemDto item, string content, CancellationToken stoppingToken)
  {
    var payload = JsonSerializer.Deserialize<ItemMarketPayload>(content);

    if (payload is null)
    {
      Logger.LogError("Failed to deserialize {ItemMarketPayload} from API response.", nameof(ItemMarketPayload));
      throw new Exception($"Failed to deserialize {nameof(ItemMarketPayload)} from API response.");
    }

    if (payload.ItemMarket is null)
    {
      var errorCode = payload.Error?.Code ?? 0;
      var errorMessage = payload.Error?.ErrorMessage ?? "Unknown error";
      Logger.LogError("API call resulted in error: {ErrorMessage}", errorMessage);

      // Codes 2 (Incorrect key) and 13 (Owner inactivity) mean this key will never work again.
      if (errorCode is 2 or 13)
        throw new TornKeyUnavailableException(errorCode, errorMessage);

      throw new Exception($"API call resulted in error: {errorMessage}");
    }

    var correlationId = Guid.NewGuid();
    var itemId = payload.ItemMarket.Item.Id;

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

    await DatabaseService.ProcessListingsAsync(Source.Torn, itemId, newListings, stoppingToken);
  }
}
