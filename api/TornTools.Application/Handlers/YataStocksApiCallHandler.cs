using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Models.YataStocks;

namespace TornTools.Application.Handlers;
public class YataStocksApiCallHandler(
    ILogger<YataStocksApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler<YataStocksApiCallHandler>(logger, databaseService)
{
    public override ApiCallType CallType => ApiCallType.YataForeignStock;

    public override async Task HandleResponseAsync(string content, CancellationToken stoppingToken)
    {
        var payload = JsonSerializer.Deserialize<ForeignStocksPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(ForeignStocksPayload)} from API response.");

        var items = payload.CountryStocks.SelectMany(kvp =>
        {
            var countryCode = kvp.Key;
            var lastUpdated = kvp.Value.LastUpdated;

            return kvp.Value.ForeignStockItems.Select(item =>
                new ForeignStockItemDto
                {
                    ItemId = item.ItemId,
                    Country = CountryConstants.CountryCodeLookup[countryCode],
                    ItemName = item.ItemName,
                    Quantity = item.Quantity,
                    Cost = item.Cost,
                    LastUpdated = lastUpdated
                });
        });

        await DatabaseService.UpsertForeignStockItemsAsync(items, stoppingToken);
    }
}
