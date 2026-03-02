using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class TornApiMultiKeyCaller(
    ILogger<TornApiMultiKeyCaller> logger,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory
) : ApiCaller<TornApiMultiKeyCaller>(logger, databaseService, httpClientFactory), IApiCaller
{
    public override IEnumerable<ApiCallType> CallTypes =>
    [
        ApiCallType.TornItems,
        ApiCallType.TornMarketListings
    ];

    protected override string ClientName => TornApiConstants.ClientName;

    protected override async Task AddAuthorizationHeader(HttpRequestMessage requestMessage, CancellationToken stoppingToken)
    {
        var nextApiKey = await DatabaseService.GetNextApiKeyAsync(stoppingToken);
        requestMessage.Headers.TryAddWithoutValidation("Authorization", $"ApiKey {nextApiKey}");
    }

    Task<bool> IApiCaller.CallAsync(QueueItemDto queueItemDto, IApiCallHandler handler, CancellationToken stoppingToken)
    {
        return CallAsync(queueItemDto, handler, stoppingToken);
    }
}
