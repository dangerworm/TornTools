using System.Text.Json;
using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;
using TornTools.Core.Models.TornItems;

namespace TornTools.Application.Handlers;

public class TornItemsApiCallHandler(
    ILogger<TornItemsApiCallHandler> logger,
    IDatabaseService databaseService
) : ApiCallHandler<TornItemsApiCallHandler>(logger, databaseService)
{
    public override ApiCallType CallType => ApiCallType.TornItems;

    public override async Task HandleResponseAsync(string content, CancellationToken stoppingToken)
    {
        var payload = JsonSerializer.Deserialize<ItemsPayload>(content)
            ?? throw new Exception($"Failed to deserialize {nameof(ItemsPayload)} from API response.");
        
        var items = payload.Items.Select(item => new ItemDto(item));

        await DatabaseService.UpsertItemsAsync(items, stoppingToken);
    }
}
