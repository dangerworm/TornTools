using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.DataTransferObjects;
using TornTools.Core.Enums;

namespace TornTools.Application.Callers;
public class TornApiCaller(
    ILogger<TornApiCaller> logger,
    IApiCallHandlerResolver handlerResolver,
    TornApiCallerConfiguration options
) : ApiCaller<TornApiCaller>(logger, handlerResolver), IApiCaller
{
    private readonly TornApiCallerConfiguration _options = options ?? throw new ArgumentNullException(nameof(options));

    public override IEnumerable<ApiCallType> CallTypes =>
    [
        ApiCallType.TornItems,
        ApiCallType.TornMarketListings
    ];

    protected override string ClientName => "torn-api-caller";

    protected override void AddHeaders(HttpRequestMessage requestMessage, QueueItemDto item)
    {
        requestMessage.Headers.TryAddWithoutValidation("Authorization", $"ApiKey {_options.ApiKey}");
        base.AddHeaders(requestMessage, item);
    }

    Task<bool> IApiCaller.CallAsync(QueueItemDto item, CancellationToken ct)
    {
        return CallAsync(item, ct);
    }
}
