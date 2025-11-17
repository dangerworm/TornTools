using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class TornApiCaller(
    ILogger<TornApiCaller> logger,
    IApiCallHandlerResolver callHandlerResolver,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory
) : ApiCaller<TornApiCaller>(logger, callHandlerResolver, databaseService, httpClientFactory), IApiCaller
{
    public override IEnumerable<ApiCallType> CallTypes =>
    [
        ApiCallType.TornItems,
        ApiCallType.TornMarketListings
    ];

    protected override string ClientName => TornApiConstants.ClientName;

    protected override async Task AddHeaders(HttpRequestMessage requestMessage, QueueItemDto item, CancellationToken stoppingToken)
    {
        var nextApiKey = await DatabaseService.GetNextApiKeyAsync(stoppingToken);

        requestMessage.Headers.TryAddWithoutValidation("Authorization", $"ApiKey {nextApiKey}");
        await base.AddHeaders(requestMessage, item, stoppingToken);
    }

    Task<bool> IApiCaller.CallAsync(QueueItemDto item, CancellationToken ct)
    {
        return CallAsync(item, ct);
    }
}
