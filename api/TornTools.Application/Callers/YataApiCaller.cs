using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Constants;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;

public class YataApiCaller(
    ILogger<YataApiCaller> logger,
    IApiCallHandlerResolver callHandlerResolver,
    IDatabaseService databaseService,
    IHttpClientFactory httpClientFactory,
    IMetricsCollector metricsCollector
) : ApiCaller<YataApiCaller>(logger, callHandlerResolver, databaseService, httpClientFactory, metricsCollector), IApiCaller
{
    public override IEnumerable<ApiCallType> CallTypes =>
    [
        ApiCallType.YataForeignStock
    ];

    protected override string ClientName => YataApiConstants.ClientName;

    Task<bool> IApiCaller.CallAsync(QueueItemDto queueItemDto, CancellationToken stoppingToken)
    {
        return CallAsync(queueItemDto, stoppingToken);
    }
}
