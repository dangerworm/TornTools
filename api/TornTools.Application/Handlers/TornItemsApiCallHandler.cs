using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Models.TornItems;

namespace TornTools.Application.Handlers;

public class TornItemsApiCallHandler(
    ILogger<TornItemsApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler(logger, databaseService)
{
    public override string CallHandler => nameof(TornItemsApiCallHandler);

    public override async Task HandleResponseAsync(HttpResponseMessage response, CancellationToken stoppingToken)
    {
        var content = await response.Content.ReadAsStringAsync(stoppingToken);
        var payload = JsonSerializer.Deserialize<ItemsPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(ItemsPayload)} from API response.");
        
        var items = payload.Items.Select(item => new ItemDto(item));

        await DatabaseService.UpsertItemsAsync(items, stoppingToken);
    }
}
