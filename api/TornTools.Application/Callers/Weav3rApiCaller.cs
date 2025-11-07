using Microsoft.Extensions.Logging;
using TornTools.Application.Interfaces;
using TornTools.Core.Configurations;
using TornTools.Core.DataTransferObjects;

namespace TornTools.Application.Callers;
public class Weav3rApiCaller(
    ILogger<Weav3rApiCaller> logger,
    IApiCallHandlerResolver handlerResolver,
    IHttpClientFactory httpClientFactory,
    Weav3rApiCallerConfiguration options
) : ApiCaller<Weav3rApiCaller>(logger, handlerResolver, httpClientFactory), IApiCaller
{
    private readonly Weav3rApiCallerConfiguration _options = options ?? throw new ArgumentNullException(nameof(options));

    protected override string ClientName => "torn-api-caller";

    Task<bool> IApiCaller.CallAsync(QueueItemDto item, CancellationToken ct)
    {
        return CallAsync(item, ct);
    }
}
